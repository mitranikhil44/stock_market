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

function getPredictionTrend(timewiseData, startIndex, endIndex, opts = {}) {
  const {
    oiPctThreshold = 0.005,
    pcrThreshold = 0.01,
    useVolume = true,
  } = opts;
  const eps = 1e-9;

  if (!timewiseData || endIndex <= startIndex)
    return { label: "Insufficient Data", score: 0, confidence: 0, reasons: [] };

  const last = timewiseData[endIndex];
  const prev = timewiseData[startIndex];

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
    score += pcrChange > 0.05 ? 2 : 1;
    reasons.push(`PCR ↑ (${pcrChange.toFixed(2)})`);
  } else if (pcrChange < -pcrThreshold) {
    score -= pcrChange < -0.05 ? 2 : 1;
    reasons.push(`PCR ↓ (${pcrChange.toFixed(2)})`);
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

  let label = "Neutral / Range";
  if (score >= 2) label = "Bullish Bias 📈";
  else if (score <= -2) label = "Bearish Bias 📉";

  let confidence = 0;
  if (score === 1 || score === -1) confidence = 40;
  else if (score === 2 || score === -2) confidence = 65;
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
  const [error, setError] = useState("");
  const [spot, setSpot] = useState(null);
  const [selectedEndIndex, setSelectedEndIndex] = useState(null);

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
        if (mounted) {
          setSnapshots(arr);
          setSelectedEndIndex(arr.length - 1);
        }

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
  const prediction =
    selectedEndIndex !== null
      ? getPredictionTrend(timewiseData, 0, selectedEndIndex)
      : null;

  const latest = snapshots[selectedEndIndex] || null;
  const prev = snapshots[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-foreground">
          📊 Option Analysis
        </h1>
        <div className="relative w-full sm:w-auto">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="appearance-none glass-card w-full sm:w-auto px-4 py-2 pr-8 text-sm text-foreground bg-transparent border border-white/20 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          >
            <option value="bank_nifty">Bank Nifty</option>
            <option value="nifty_50">Nifty 50</option>
            <option value="fin_nifty">Fin Nifty</option>
            <option value="midcap_nifty_50">Midcap 50</option>
          </select>
          {/* 🔹 Dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg
              className="h-4 w-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading option chain…</p>
      ) : error ? (
        <p className="text-center text-red-400 py-10">{error}</p>
      ) : (
        <>
          {snapshots.length > 0 && (
            <>
              <div className="glass-card p-2 md:p-4 mb-6 overflow-x-auto">
                <PCRTable data={timewiseData} />
              </div>

              <div className="glass-card p-2 md:p-4 mb-6 overflow-x-auto">
                <PCRDiffChart data={timewiseData} />
              </div>

              {/* Time Selector Table */}
              <div className="glass-card p-2 md:p-4 mb-6 overflow-x-auto max-h-64">
                <h3 className="text-sm font-medium mb-2 text-foreground/90">
                  Select End Time (Default = Last)
                </h3>
                <table className="w-full text-xs border-collapse text-foreground/90 min-w-[400px]">
                  <thead>
                    <tr className="bg-white/10">
                      <th className="px-2 py-1 text-left">#</th>
                      <th className="px-2 py-1 text-left">Timestamp</th>
                      <th className="px-2 py-1 text-center">Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timewiseData.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-white/10 ${
                          selectedEndIndex === idx
                            ? "bg-white/20 font-semibold"
                            : ""
                        }`}
                      >
                        <td className="px-2 py-1">{idx + 1}</td>
                        <td className="px-2 py-1">{row.timestamp}</td>
                        <td className="px-2 py-1 text-center">
                          <button
                            onClick={() => setSelectedEndIndex(idx)}
                            className={`px-2 py-1 rounded text-xs transition-colors duration-200 ${
                              selectedEndIndex === idx
                                ? "bg-blue-600 text-white"
                                : "bg-white/5 hover:bg-white/20"
                            }`}
                          >
                            Use
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Prediction Card */}
              {prediction && (
                <div
                  className={`glass-card p-2 md:p-4 mt-4 ${
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
                    Based on OI + Volume + PCR shifts (Start →{" "}
                    {timewiseData[selectedEndIndex]?.timestamp})
                  </p>
                </div>
              )}
            </>
          )}

          {latest && prev && (
            <div className="mt-6 glass-card p-2 md:p-4 overflow-x-auto">
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
