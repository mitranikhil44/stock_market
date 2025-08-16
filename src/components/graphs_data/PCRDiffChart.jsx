"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function PCRDiffChart({ data }) {
  const [chartMode, setChartMode] = useState("PCR"); // Default to PCR

  // Number formatting
  function kFormat(n) {
    if (n == null) return "-";
    const a = Math.abs(n);
    if (a >= 1_00_00_000) return (n / 1_00_00_000).toFixed(1) + "Cr";
    if (a >= 1_00_000) return (n / 1_00_000).toFixed(1) + "L";
    if (a >= 1_000) return (n / 1_000).toFixed(1) + "k";
    return n.toLocaleString();
  }

  // Prepare chart data with safe PCR calculation
  const chartData = (data || []).map((d) => {
    const totalCallOI = d.totalCallOI || 0;
    const totalPutOI = d.totalPutOI || 0;
    const totalCallVol = d.totalCallVol || 0;
    const totalPutVol = d.totalPutVol || 0;

    return {
      time: d.timestamp,
      totalCallOI: totalCallOI,
      totalPutOI: totalPutOI,
      totalCallVol: totalCallVol,
      totalPutVol: totalPutVol,
      chgOI: totalPutOI - totalCallOI,
      chgVol: totalPutVol - totalCallVol,
      pcr: totalCallOI > 0 ? totalPutOI / totalCallOI : 0,
    };
  });

  // Dynamic keys
  let line1Key, line2Key, line1Name, line2Name;
  if (chartMode === "OI") {
    line1Key = "totalCallOI";
    line2Key = "totalPutOI";
    line1Name = "Call OI";
    line2Name = "Put OI";
  } else if (chartMode === "Volume") {
    line1Key = "totalCallVol";
    line2Key = "totalPutVol";
    line1Name = "Call Volume";
    line2Name = "Put Volume";
  } else if (chartMode === "Chg OI") {
    line1Key = "chgOI";
    line1Name = "Put OI - Call OI";
  } else if (chartMode === "Chg Volume") {
    line1Key = "chgVol";
    line1Name = "Put Volume - Call Volume";
  } else if (chartMode === "PCR") {
    line1Key = "pcr";
    line1Name = "Put/Call Ratio";
  }

  return (
    <div className="shadow-lg rounded-2xl p-4 sm:p-6 mt-6 bg-white text-gray-700">
      {/* Dropdown Selector */}
      <div className="mb-4">
        <select
          value={chartMode}
          onChange={(e) => setChartMode(e.target.value)}
          className="px-4 py-2 border rounded-lg border-gray-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="PCR">PCR</option>
          <option value="OI">OI</option>
          <option value="Volume">Volume</option>
          <option value="Chg OI">Chg OI</option>
          <option value="Chg Volume">Chg Volume</option>
        </select>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12, fill: "#000" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={kFormat}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip formatter={(value) => kFormat(value)} />
          <Legend verticalAlign="top" height={36} iconType="circle" />

          {/* Lines */}
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
