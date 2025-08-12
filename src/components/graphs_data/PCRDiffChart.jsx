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
  const [chartMode, setChartMode] = useState("both");

  const SCALE_DIVISOR = 100000; // Convert to Lakhs

  // Transform & scale data for chart
  const chartData = data.map((d) => ({
    time: d.timestamp,
    oiDiff: (d.totalPutOI - d.totalCallOI) / SCALE_DIVISOR,
    volDiff: (d.totalPutVol - d.totalCallVol) / SCALE_DIVISOR,
  }));

  return (
    <div className="shadow-lg rounded-2xl p-4 sm:p-6 mt-6 bg-white">
      {/* Toggle Buttons */}
      <div className="flex gap-2 mb-4">
        {["oi", "vol", "both"].map((mode) => (
          <button
            key={mode}
            onClick={() => setChartMode(mode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              chartMode === mode
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {mode === "oi" ? "OI Diff" : mode === "vol" ? "Volume Diff" : "Both"}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            label={{
              value: "OI Diff (Lakhs)",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle" },
            }}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: "Vol Diff (Lakhs)",
              angle: -90,
              position: "insideRight",
              style: { textAnchor: "middle" },
            }}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => `${value.toFixed(2)} Lakh`}
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
            }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          {(chartMode === "oi" || chartMode === "both") && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="oiDiff"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="OI Diff (Put - Call)"
            />
          )}
          {(chartMode === "vol" || chartMode === "both") && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="volDiff"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              name="Vol Diff (Put - Call)"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
