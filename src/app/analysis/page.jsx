"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import OptionFlowShift from "@/components/analysis/OptionFlowShift";
import PCRTable from "@/components/tables_data/PCRTable";
import PCRDiffChart from "@/components/graphs_data/PCRDiffChart";
import OptionHeatmapPrediction from "@/components/analysis/OptionHeatmapPrediction";
import { RefreshCw } from "lucide-react"; // refresh icon

const symbolToIndex = {
  bank_nifty: "bank_nifty",
  nifty_50: "nifty_50",
  fin_nifty: "fin_nifty",
  midcap_nifty_50: "midcap_nifty_50",
};

const SCALE_DIVISOR = 1000000;

// 🔹 Calculate PCR timewise
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

// 🔹 Prediction Trend (same as before)
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
  const [refreshing, setRefreshing] = useState(false);
  const [symbol, setSymbol] = useState("nifty_50");
  const [error, setError] = useState("");
  const [spot, setSpot] = useState(null);
  const [selectedEndIndex, setSelectedEndIndex] = useState(null);

  const [interval, setInterval] = useState("all");

  // 🔹 fetchData function (reusable for refresh)
  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true); // ✅ sirf first load ke time par loading
      setError("");

      const oc = await axios.get(
        `/api/market_data/option_chain?symbol=${symbol}&sort=asc&period=1d`
      );
      const arr = oc.data?.data || [];
      setSnapshots(arr);
      setSelectedEndIndex(arr.length - 1);

      const priceIndex = symbolToIndex[symbol] || symbol;
      const mp = await axios.get(
        `/api/market_data/price?symbol=${priceIndex}&period=1d`
      );
      const seriesRaw = mp.data?.data || {};
      const allSeries = Object.values(seriesRaw).flat();
      const lastItem =
        allSeries.length > 0 ? allSeries[allSeries.length - 1] : null;
      setSpot(lastItem ? Number(lastItem.price) : null);
    } catch (e) {
      console.error(e);
      setError("Failed to load option data or spot.");
    } finally {
      if (!isRefresh) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol]);

  // 🔹 PCR Data
  const timewiseData = calculateTimewisePCR(snapshots);

  const intervalMap = { "1m": 1, "5m": 5, "15m": 15, "30m": 30 };
  function getMinutes(ts) {
    try {
      if (ts.includes(":") && !ts.includes("T")) {
        const parts = ts.split(":");
        return parseInt(parts[1], 10);
      } else {
        return new Date(ts).getMinutes();
      }
    } catch {
      return 0;
    }
  }
  const filteredData = useMemo(() => {
    if (interval === "all") return timewiseData;
    const minutes = intervalMap[interval];
    if (!minutes) return timewiseData;
    return timewiseData.filter(
      (row) => getMinutes(row.timestamp) % minutes === 0
    );
  }, [timewiseData, interval]);

  const prediction =
    selectedEndIndex !== null
      ? getPredictionTrend(timewiseData, 0, selectedEndIndex)
      : null;

  const latest = snapshots[selectedEndIndex] || null;
  const prev = snapshots[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-md border-b border-white/10 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            📊 Option Analysis
          </h1>

          <div className="flex gap-3 items-center">
            {/* Symbol Selector */}
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="appearance-none rounded-xl border border-gray-700 bg-gray-900/70 text-gray-200 px-2 py-1 sm:px-4 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="bank_nifty">Bank Nifty</option>
              <option value="nifty_50">Nifty 50</option>
              <option value="fin_nifty">Fin Nifty</option>
              <option value="midcap_nifty_50">Midcap 50</option>
            </select>

            {/* Interval Selector */}
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="appearance-none rounded-xl border border-gray-700 bg-gray-900/70 text-gray-200 px-2 py-1 sm:px-4 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="all">All Time</option>
              <option value="1m">1 Min</option>
              <option value="5m">5 Min</option>
              <option value="15m">15 Min</option>
              <option value="30m">30 Min</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => {
                setRefreshing(true);
                fetchData(true); // ✅ pass isRefresh = true
              }}
              className="p-2 rounded-full mr-4 sm:mr-2 bg-gray-800 hover:bg-gray-700 transition"
              title="Refresh Data"
            >
              <RefreshCw
                className={`h-5 w-5 text-blue-400 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading option chain…</p>
      ) : error ? (
        <p className="text-center text-red-400 py-10">{error}</p>
      ) : (
        <>
          {snapshots.length > 0 && (
            <>
              <div className="glass-card p-2 md:p-4 mb-6 overflow-x-auto">
                <PCRTable data={filteredData} />
              </div>

              <div className="glass-card p-2 md:p-4 mb-6 overflow-x-auto">
                <PCRDiffChart data={filteredData} />
              </div>

              {/* Prediction */}
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
                </div>
              )}
            </>
          )}

          {latest && prev && (
            <div className="mt-6 glass-card p-2 md:p-4 overflow-x-auto">
              <OptionHeatmapPrediction
                latestSnapshot={latest}
                prevSnapshot={prev}
                symbol={symbol}
                spot={spot}
              />
            </div>
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
