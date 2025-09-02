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

// 🔹 Lookback options (minutes)
const LOOKBACK_OPTIONS = [1, 3, 5, 15, 30, 45, 60];

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

// 🔹 Prediction logic (now uses dynamic lookback)
function getPredictionTrend(timewiseData, lookback, opts = {}) {
  const {
    oiPctThreshold = 0.005, // 🔹 thoda relax kiya
    pcrThreshold = 0.01, // 🔹 thoda relax kiya
    useVolume = true,
  } = opts;
  const eps = 1e-9;

  if (!timewiseData || timewiseData.length <= lookback) {
    return { label: "Insufficient Data", score: 0, confidence: 0, reasons: [] };
  }

  const last = timewiseData[timewiseData.length - 1];
  const prev = timewiseData[timewiseData.length - 1 - lookback];

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

  // PCR weighting
  if (pcrChange > pcrThreshold) {
    if (pcrChange > 0.05) {
      score += 2; // Strong Put dominance
      reasons.push(`PCR Strong ↑ (${pcrChange.toFixed(2)})`);
    } else {
      score += 1; // Mild Put dominance
      reasons.push(`PCR Mild ↑ (${pcrChange.toFixed(2)})`);
    }
  } else if (pcrChange < -pcrThreshold) {
    if (pcrChange < -0.05) {
      score -= 2; // Strong Call dominance
      reasons.push(`PCR Strong ↓ (${pcrChange.toFixed(2)})`);
    } else {
      score -= 1; // Mild Call dominance
      reasons.push(`PCR Mild ↓ (${pcrChange.toFixed(2)})`);
    }
  }

  if (useVolume) {
    const callVolPct =
      (last.totalCallVol - prev.totalCallVol) /
      (Math.abs(prev.totalCallVol) + eps);
    const putVolPct =
      (last.totalPutVol - prev.totalPutVol) /
      (Math.abs(prev.totalPutVol) + eps);

    if (putVolPct > oiPctThreshold && callVolPct < -oiPctThreshold) {
      score += 1;
      reasons.push("Put Vol ↑");
    } else if (callVolPct > oiPctThreshold && putVolPct < -oiPctThreshold) {
      score -= 1;
      reasons.push("Call Vol ↑");
    }
  }

  // 🔹 Label decide karna
  let label = "Neutral / Range";
  if (score >= 2) label = "Bullish Bias 📈";
  else if (score <= -2) label = "Bearish Bias 📉";

  // 🔹 Confidence ko aur smooth kiya
  let confidence = 0;
  if (score === 0) confidence = 0;
  else if (Math.abs(score) === 1) confidence = 40;
  else if (Math.abs(score) === 2) confidence = 65;
  else if (Math.abs(score) >= 3) confidence = 90;

  return {
    label,
    score,
    confidence,
    reasons,
    details: { callOI_pct, putOI_pct, pcrChange },
  };
}

const Analysis = () => {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("nifty_50");
  const [lookback, setLookback] = useState(1); // default = 1 min
  const [error, setError] = useState("");
  const [spot, setSpot] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");

        const oc = await axios.get(
          `/api/market_data/option_chain?symbol=${symbol}&sort=asc&period=1d`
        );
        const arr = oc.data?.data || [];
        if (mounted) setSnapshots(arr);

        const priceIndex = symbolToIndex[symbol] || symbol;
        const mp = await axios.get(
          `/api/market_data/price?symbol=${priceIndex}&period=1d`
        );
        const seriesRaw = mp.data?.data || {};
        const allSeries = Object.values(seriesRaw).flat();
        const lastItem =
          allSeries.length > 0 ? allSeries[allSeries.length - 1] : null;
        if (mounted) setSpot(lastItem ? Number(lastItem.price) : null);
      } catch (e) {
        console.error(e);
        if (mounted) setError("Failed to load option data or spot.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [symbol]);

  const timewiseData = calculateTimewisePCR(snapshots);
  const prediction = getPredictionTrend(timewiseData, lookback);

  const latest = snapshots[snapshots.length - 1] || null;
  const prevIndex = Math.max(0, snapshots.length - 1 - lookback);
  const prev = snapshots[prevIndex] || null;

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

              {/* 🔹 Lookback Selector */}
              <div className="mb-6">
                <div className="inline-flex rounded-2xl bg-gray-100 p-1 shadow-inner">
                  {LOOKBACK_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setLookback(opt)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
          ${
            lookback === opt
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-700 hover:bg-gray-200"
          }`}
                    >
                      {opt}m
                    </button>
                  ))}
                </div>
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
                  Based on OI + Volume + PCR shifts (Lookback {lookback}m)
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
