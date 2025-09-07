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
  const [chartMode, setChartMode] = useState("PCR"); // Default

  function kFormat(n) {
    if (n == null) return "-";
    const a = Math.abs(n);
    if (a >= 1_00_00_000) return (n / 1_00_00_000).toFixed(1) + "Cr";
    if (a >= 1_00_000) return (n / 1_00_000).toFixed(1) + "L";
    if (a >= 1_000) return (n / 1_000).toFixed(1) + "k";
    return n.toLocaleString();
  }

  const chartData = (data || []).map((d) => {
    const totalCallOI = d.totalCallOI || 0;
    const totalPutOI = d.totalPutOI || 0;
    const totalCallVol = d.totalCallVol || 0;
    const totalPutVol = d.totalPutVol || 0;

    return {
      time: d.timestamp,
      totalCallOI,
      totalPutOI,
      totalCallVol,
      totalPutVol,
      chgOI: totalPutOI - totalCallOI,
      chgVol: totalPutVol - totalCallVol,
      pcr: totalCallOI > 0 ? totalPutOI / totalCallOI : 0,
    };
  });

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
    line1Name = "Put Vol - Call Vol";
  } else if (chartMode === "PCR") {
    line1Key = "pcr";
    line1Name = "Put/Call Ratio";
  }

  return (
    <div className="glass-card mt-6 p-2 md:p-4 sm:p-6">
      {/* Selector */}
      <div className="mb-4 flex justify-end">
        <select
          value={chartMode}
          onChange={(e) => setChartMode(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <CartesianGrid strokeDasharray="2 2" stroke="#374151" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={kFormat}
            tick={{ fontSize: 12, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", color: "#fff" }}
            formatter={(value) => kFormat(value)}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            wrapperStyle={{ color: "#D1D5DB" }}
          />

          {/* Lines */}
          <Line
            type="monotone"
            dataKey={line1Key}
            stroke="#60A5FA"
            strokeWidth={2}
            name={line1Name}
            dot={false}
          />
          {line2Key && (
            <Line
              type="monotone"
              dataKey={line2Key}
              stroke="#FBBF24"
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
