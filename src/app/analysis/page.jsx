"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import OptionFlowShift from "@/components/analysis/OptionFlowShift";
import PCRTable from "@/components/tables_data/PCRTable";
import PCRDiffChart from "@/components/graphs_data/PCRDiffChart";

const symbolToIndex = {
  bank_nifty: "bank_nifty",
  nifty_50: "nifty_50",
  fin_nifty: "fin_nifty",
  midcap_nifty_50: "midcap_nifty_50",
};

const SCALE_DIVISOR = 1000000;
const TIME_OPTIONS = [
  { label: "1 Day", value: "1d" },
  { label: "5 Days", value: "5d" },
  { label: "1 Month", value: "1mo" },
];

// 🔹 Calculate timewise PCR/OI/Vol
function calculateTimewisePCR(snapshots) {
  const cleanNum = (val) => {
    if (typeof val !== "string") return 0;
    if (val === "-" || val.trim() === "") return 0;
    return Number(val.replace(/,/g, "")) || 0;
  };

  return snapshots.map((snap) => {
    let totalCallOI = 0;
    let totalPutOI = 0;
    let totalCallVol = 0;
    let totalPutVol = 0;

    snap.data?.forEach((row) => {
      totalCallOI += cleanNum(row.CallOI) / SCALE_DIVISOR;
      totalPutOI += cleanNum(row.PutOI) / SCALE_DIVISOR;
      totalCallVol += cleanNum(row.CallVol) / SCALE_DIVISOR;
      totalPutVol += cleanNum(row.PutVol) / SCALE_DIVISOR;
    });

    const pcrOI = totalCallOI > 0 ? totalPutOI / totalCallOI : 0;
    const pcrVol = totalCallVol > 0 ? totalPutVol / totalCallVol : 0;

    return {
      timestamp: snap.timestamp,
      totalCallOI,
      totalPutOI,
      totalCallVol,
      totalPutVol,
      pcrOI: Number(pcrOI.toFixed(2)),
      pcrVol: Number(pcrVol.toFixed(2)),
    };
  });
}

// 🔹 Prediction logic
function getPredictionTrend(timewiseData, opts = {}) {
  const { oiPctThreshold = 0.01, pcrThreshold = 0.02, useVolume = true } = opts;
  const eps = 1e-9;

  if (!timewiseData || timewiseData.length < 2) {
    return { label: "Insufficient Data", score: 0, confidence: 0, reasons: [] };
  }

  const last = timewiseData[timewiseData.length - 1];
  const prev = timewiseData[timewiseData.length - 2];

  const callOIChange = last.totalCallOI - prev.totalCallOI;
  const putOIChange = last.totalPutOI - prev.totalPutOI;
  const callOI_pct = callOIChange / (Math.abs(prev.totalCallOI) + eps);
  const putOI_pct = putOIChange / (Math.abs(prev.totalPutOI) + eps);
  const pcrChange = last.pcrOI - prev.pcrOI;

  let score = 0;
  const reasons = [];

  if (putOI_pct > oiPctThreshold && callOI_pct < -oiPctThreshold) {
    score += 2;
    reasons.push("Put OI ↑ & Call OI ↓");
  } else if (callOI_pct > oiPctThreshold && putOI_pct < -oiPctThreshold) {
    score -= 2;
    reasons.push("Call OI ↑ & Put OI ↓");
  }

  if (pcrChange > pcrThreshold) {
    score += 1;
    reasons.push("PCR ↑");
  } else if (pcrChange < -pcrThreshold) {
    score -= 1;
    reasons.push("PCR ↓");
  }

  if (useVolume) {
    const callVolPct =
      (last.totalCallVol - prev.totalCallVol) / (Math.abs(prev.totalCallVol) + eps);
    const putVolPct =
      (last.totalPutVol - prev.totalPutVol) / (Math.abs(prev.totalPutVol) + eps);

    if (putVolPct > oiPctThreshold && callVolPct < -oiPctThreshold) {
      score += 1;
      reasons.push("Put Vol ↑");
    } else if (callVolPct > oiPctThreshold && putVolPct < -oiPctThreshold) {
      score -= 1;
      reasons.push("Call Vol ↑");
    }
  }

  const maxScore = 4;
  const absScore = Math.abs(score);
  let label = "Neutral / Range";
  if (score >= 2) label = "Bullish Bias 📈";
  else if (score <= -2) label = "Bearish Bias 📉";

  const confidence = Math.min(100, Math.round((absScore / maxScore) * 100));

  return { label, score, confidence, reasons, details: { callOI_pct, putOI_pct, pcrChange } };
}

const Analysis = () => {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("nifty_50");
  const [timeframe, setTimeframe] = useState("1d");
  const [error, setError] = useState("");
  const [spot, setSpot] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");

        const oc = await axios.get(
          `/api/market_data/option_chain?symbol=${symbol}&sort=asc&period=${timeframe}`
        );
        const arr = oc.data?.data || [];
        if (mounted) setSnapshots(arr);

        const priceIndex = symbolToIndex[symbol] || symbol;
        const mp = await axios.get(
          `/api/market_data/price?symbol=${priceIndex}&period=${timeframe}`
        );
        const seriesRaw = mp.data?.data || {};
        const allSeries = Object.values(seriesRaw).flat();
        const lastItem = allSeries.length > 0 ? allSeries[allSeries.length - 1] : null;
        if (mounted) setSpot(lastItem ? Number(lastItem.price) : null);
      } catch (e) {
        console.error(e);
        if (mounted) setError("Failed to load option data or spot.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [symbol, timeframe]);

  const timewiseData = calculateTimewisePCR(snapshots);
  const prediction = getPredictionTrend(timewiseData);

  const latest = snapshots[snapshots.length - 1] || null;
  const prev = snapshots[1] || null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
      {/* 🔹 Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📊 Option Analysis</h1>
        <div className="flex gap-3">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="glass-card px-3 py-2 text-sm bg-transparent text-foreground"
          >
            <option value="bank_nifty">Bank Nifty</option>
            <option value="nifty_50">Nifty 50</option>
            <option value="fin_nifty">Fin Nifty</option>
            <option value="midcap_nifty_50">Midcap 50</option>
          </select>

          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="glass-card px-3 py-2 text-sm bg-transparent text-foreground"
          >
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 🔹 Data Section */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading option chain…</p>
      ) : error ? (
        <p className="text-center text-red-400 py-10">{error}</p>
      ) : (
        <>
          {snapshots.length > 0 && (
            <>
              <div className="glass-card p-4 mb-6">
                <PCRTable data={timewiseData} />
              </div>

              <div className="glass-card p-4 mb-6">
                <PCRDiffChart data={timewiseData} />
              </div>

              {/* 🔹 Prediction Card */}
              <div
                className={`glass-card p-5 mt-4 ${
                  prediction.label.includes("Bull")
                    ? "border-green-400/30"
                    : prediction.label.includes("Bear")
                    ? "border-red-400/30"
                    : "border-gray-400/20"
                }`}
              >
                <h3 className="text-lg font-semibold">
                  {prediction.label} — {prediction.confidence}%
                </h3>
                <div className="text-xs text-gray-400 mt-1">
                  {prediction.reasons.length > 0
                    ? prediction.reasons.join(" · ")
                    : "No strong signals"}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Based on OI + Volume + PCR shifts
                </p>
              </div>
            </>
          )}

          {latest && prev && (
            <div className="mt-6 glass-card p-4">
              <OptionFlowShift
                latestSnapshot={latest}
                prevSnapshot={prev}
                symbol={symbol}
                topN={8}
                minAbsChange={1000}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analysis;
