"use client";

import React, { useMemo } from "react";

// 🔹 Utility: Parse numbers safely
function parseNum(x) {
  if (x == null) return null;
  const s = String(x).trim();
  if (s === "-" || s === "") return null;
  return Number(s.replace(/,/g, "")) || null;
}

// 🔹 Intensity for background color strength
function intensity(val, maxAbs) {
  if (val == null || maxAbs === 0) return 0;
  return Math.min(1, Math.abs(val) / maxAbs);
}

// 🔹 Classify option move based on price + OI
function classifyMove(priceChg, oiChg) {
  if (priceChg == null || oiChg == null) return "No Data";

  if (priceChg > 0 && oiChg > 0) return "Long Build-up 📈";
  if (priceChg < 0 && oiChg > 0) return "Short Build-up 📉";
  if (priceChg > 0 && oiChg < 0) return "Short Covering 🔥";
  if (priceChg < 0 && oiChg < 0) return "Long Unwinding ⚠️";
  return "Neutral";
}

export default function OptionHeatmapPrediction({
  latestSnapshot,
  prevSnapshot,
  symbol,
  spot, // 🔹 ATM highlight
}) {
  // 🔹 Process rows
  const rows = useMemo(() => {
    if (!latestSnapshot || !prevSnapshot) return [];

    const prevMap = new Map(prevSnapshot.data.map((r) => [String(r.StrikePrice), r]));

    return latestSnapshot.data.map((r) => {
      const strike = parseNum(r.StrikePrice);
      const prev = prevMap.get(String(r.StrikePrice));

      const callOI = parseNum(r.CallOI);
      const putOI = parseNum(r.PutOI);
      const callVol = parseNum(r.CallVol);
      const putVol = parseNum(r.PutVol);
      const callLtp = parseNum(r.CallLTP);
      const putLtp = parseNum(r.PutLTP);

      const prevCallOI = parseNum(prev?.CallOI);
      const prevPutOI = parseNum(prev?.PutOI);
      const prevCallVol = parseNum(prev?.CallVol);
      const prevPutVol = parseNum(prev?.PutVol);
      const prevCallLtp = parseNum(prev?.CallLTP);
      const prevPutLtp = parseNum(prev?.PutLTP);

      const callOiDelta = callOI && prevCallOI ? callOI - prevCallOI : 0;
      const putOiDelta = putOI && prevPutOI ? putOI - prevPutOI : 0;
      const callVolDelta = callVol && prevCallVol ? callVol - prevCallVol : 0;
      const putVolDelta = putVol && prevPutVol ? putVol - prevPutVol : 0;

      const callPriceChg = callLtp && prevCallLtp ? callLtp - prevCallLtp : 0;
      const putPriceChg = putLtp && prevPutLtp ? putLtp - prevPutLtp : 0;

      const callSignal = classifyMove(callPriceChg, callOiDelta);
      const putSignal = classifyMove(putPriceChg, putOiDelta);

      return {
        strike,
        callOiDelta,
        putOiDelta,
        callVolDelta,
        putVolDelta,
        callPriceChg,
        putPriceChg,
        callSignal,
        putSignal,
      };
    });
  }, [latestSnapshot, prevSnapshot]);

  // 🔹 Intensity max reference
  const maxAbs = useMemo(() => {
    return Math.max(
      ...rows.flatMap((r) => [
        Math.abs(r.callOiDelta ?? 0),
        Math.abs(r.putOiDelta ?? 0),
      ]),
      0
    );
  }, [rows]);

  // 🔹 ATM strike detection
  const atmStrike = useMemo(() => {
    if (!spot || rows.length === 0) return null;
    let nearest = rows[0].strike;
    let minDiff = Math.abs(rows[0].strike - spot);
    rows.forEach((r) => {
      const diff = Math.abs(r.strike - spot);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = r.strike;
      }
    });
    return nearest;
  }, [rows, spot]);

  // 🔹 Net calculations for prediction
  const netCallOI = rows.reduce((a, r) => a + (r.callOiDelta ?? 0), 0);
  const netPutOI = rows.reduce((a, r) => a + (r.putOiDelta ?? 0), 0);
  const netCallPrice = rows.reduce((a, r) => a + (r.callPriceChg ?? 0), 0);
  const netPutPrice = rows.reduce((a, r) => a + (r.putPriceChg ?? 0), 0);

  // 🔹 Market bias prediction
  let netBias = "Neutral Market 😐";
  if (netCallOI > netPutOI * 1.3 && netCallPrice > 0) {
    netBias = "Bullish Bias 🚀";
  } else if (netPutOI > netCallOI * 1.3 && netPutPrice > 0) {
    netBias = "Bearish Bias 🐻";
  } else if (netCallOI > netPutOI && netPutPrice < 0) {
    netBias = "Call Writers Active 📉";
  } else if (netPutOI > netCallOI && netCallPrice < 0) {
    netBias = "Put Writers Active 📉";
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 flex flex-col h-[75vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">
          Option Heatmap Prediction ({symbol})
        </h3>
        <div
          className={`font-bold ${
            netBias.includes("Bull")
              ? "text-green-400"
              : netBias.includes("Bear")
              ? "text-red-400"
              : "text-yellow-400"
          }`}
        >
          {netBias}
        </div>
      </div>

      {/* Spot & ATM Info */}
      {spot && (
        <p className="text-sm text-gray-400 mb-2">
          Spot: <span className="font-semibold text-sky-400">{spot}</span> | ATM Strike:{" "}
          <span className="font-semibold text-yellow-400">{atmStrike}</span>
        </p>
      )}

      {/* Table */}
      <div className="overflow-auto flex-1 border-t border-gray-700 rounded-lg">
        <table className="w-full text-sm table-auto border-collapse">
          <thead className="sticky top-0 bg-gray-800 z-10">
            <tr className="text-gray-300">
              <th className="px-2 py-1 border-b border-gray-700">Strike</th>
              <th className="px-2 py-1 border-b border-gray-700">Call Δ OI</th>
              <th className="px-2 py-1 border-b border-gray-700">Call Δ Vol</th>
              <th className="px-2 py-1 border-b border-gray-700">Call Δ Price</th>
              <th className="px-2 py-1 border-b border-gray-700">Call Signal</th>
              <th className="px-2 py-1 border-b border-gray-700">Put Δ OI</th>
              <th className="px-2 py-1 border-b border-gray-700">Put Δ Vol</th>
              <th className="px-2 py-1 border-b border-gray-700">Put Δ Price</th>
              <th className="px-2 py-1 border-b border-gray-700">Put Signal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const callInt = intensity(r.callOiDelta, maxAbs);
              const putInt = intensity(r.putOiDelta, maxAbs);
              const isATM = atmStrike === r.strike;

              return (
                <tr
                  key={i}
                  className={`text-center border-b border-gray-700 ${
                    isATM ? "bg-yellow-900/30 font-semibold" : "hover:bg-gray-800/30"
                  }`}
                >
                  <td className="px-2 py-1 text-sky-300 font-medium">{r.strike}</td>

                  <td
                    className="px-2 py-1"
                    style={{
                      backgroundColor:
                        r.callOiDelta > 0
                          ? `rgba(16, 185, 129, ${callInt})`
                          : `rgba(239, 68, 68, ${callInt})`,
                    }}
                  >
                    {r.callOiDelta.toLocaleString("en-IN")}
                  </td>

                  <td className="px-2 py-1">{r.callVolDelta.toLocaleString("en-IN")}</td>
                  <td
                    className={`px-2 py-1 ${
                      r.callPriceChg > 0
                        ? "text-green-400"
                        : r.callPriceChg < 0
                        ? "text-red-400"
                        : ""
                    }`}
                  >
                    {r.callPriceChg}
                  </td>
                  <td className="px-2 py-1">{r.callSignal}</td>

                  <td
                    className="px-2 py-1"
                    style={{
                      backgroundColor:
                        r.putOiDelta > 0
                          ? `rgba(16, 185, 129, ${putInt})`
                          : `rgba(239, 68, 68, ${putInt})`,
                    }}
                  >
                    {r.putOiDelta.toLocaleString("en-IN")}
                  </td>

                  <td className="px-2 py-1">{r.putVolDelta.toLocaleString("en-IN")}</td>
                  <td
                    className={`px-2 py-1 ${
                      r.putPriceChg > 0
                        ? "text-green-400"
                        : r.putPriceChg < 0
                        ? "text-red-400"
                        : ""
                    }`}
                  >
                    {r.putPriceChg}
                  </td>
                  <td className="px-2 py-1">{r.putSignal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
