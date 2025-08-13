"use client";
import React, { useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function NetOIChart({ timewiseData }) {
  const [mode, setMode] = useState("OI"); // Selector: OI, Volume, Chg OI, Chg Volume

  if (!timewiseData || timewiseData.length === 0) return null;

  // Number formatting
  function kFormat(n) {
    if (n == null) return "-";
    const a = Math.abs(n);
    if (a >= 1_00_00_000) return (n / 1_00_00_000).toFixed(1) + "Cr";
    if (a >= 1_00_000) return (n / 1_00_000).toFixed(1) + "L";
    if (a >= 1_000) return (n / 1_000).toFixed(1) + "k";
    return n.toLocaleString();
  }

  // Prepare chart data
  const chartData = timewiseData.map((item) => {
    return {
      ...item,
      chgOI: item.totalPutOI - item.totalCallOI,
      chgVol: item.totalPutVol - item.totalCallVol,
    };
  });

  // Dynamic keys based on mode
  let line1Key, line2Key, line1Name, line2Name;

  if (mode === "OI") {
    line1Key = "totalCallOI";
    line2Key = "totalPutOI";
    line1Name = "Call OI";
    line2Name = "Put OI";
  } else if (mode === "Volume") {
    line1Key = "totalCallVol";
    line2Key = "totalPutVol";
    line1Name = "Call Vol";
    line2Name = "Put Vol";
  } else if (mode === "Chg OI") {
    line1Key = "chgOI";
    line2Key = null;
    line1Name = "Put OI - Call OI";
  } else if (mode === "Chg Volume") {
    line1Key = "chgVol";
    line2Key = null;
    line1Name = "Put Vol - Call Vol";
  }

  return (
    <div className="mt-6">
      {/* Mode Selector */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-gray-800">
          Time-wise {mode}
        </h2>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="px-3 py-1 rounded-md border border-gray-400 bg-gray-800 text-white"
        >
          <option value="OI">OI</option>
          <option value="Volume">Volume</option>
          <option value="Chg OI">Chg OI</option>
          <option value="Chg Volume">Chg Volume</option>
        </select>
      </div>

      {/* Chart */}
      <div className="w-full h-96 bg-white text-gray-600 rounded-xl p-4 shadow-md">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis tickFormatter={kFormat} domain={["auto", "auto"]} />
            <Tooltip formatter={(value) => kFormat(value)} />
            <Legend />

            {/* Line Chart(s) */}
            <Line
              type="monotone"
              dataKey={line1Key}
              stroke="#3b82f6"
              strokeWidth={2}
              name={line1Name}
              dot={false}
            />
            {line2Key && (
              <Line
                type="monotone"
                dataKey={line2Key}
                stroke="#f59e0b"
                strokeWidth={2}
                name={line2Name}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
