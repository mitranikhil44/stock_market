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
  const [chartMode, setChartMode] = useState("all");

  const SCALE_DIVISOR = 100000; 

  // Transform & scale data for chart
  const chartData = data.slice(1).map((d) => {
    const oiDiff = (d.totalPutOI - d.totalCallOI) / SCALE_DIVISOR;
    const volDiff = (d.totalPutVol - d.totalCallVol) / SCALE_DIVISOR;
    const pcr = d.totalCallOI === 0 ? 0 : d.totalPutOI / d.totalCallOI;

    return {
      time: d.timestamp,
      oiDiff,
      volDiff,
      pcr,
    };
  });

  return (
    <div className="shadow-lg rounded-2xl p-4 sm:p-6 mt-6 bg-white text-gray-700">
      {/* Dropdown Selector */}
      <div className="mb-4">
        <select
          value={chartMode}
          onChange={(e) => setChartMode(e.target.value)}
          className="px-4 py-2 border rounded-lg border-gray-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="oi">OI Diff</option>
          <option value="vol">Volume Diff</option>
          <option value="pcr">PCR</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" className="text-gray-600" height={400}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />

          {/* Left Y Axis for OI & Volume */}
          <YAxis
            yAxisId="left"
            label={{
              value: "(Lakhs)",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle" },
            }}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />

          {/* Right Y Axis for PCR */}
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: "PCR",
              angle: -90,
              position: "insideRight",
              style: { textAnchor: "middle" },
            }}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip
            formatter={(value, name) =>
              name.includes("PCR")
                ? value.toFixed(2)
                : `${value.toFixed(2)} Lakh`
            }
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
            }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />

          {/* Conditional Lines */}
          {(chartMode === "oi" || chartMode === "all") && (
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
          {(chartMode === "vol" || chartMode === "all") && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="volDiff"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              name="Vol Diff (Put - Call)"
            />
          )}
          {(chartMode === "pcr" || chartMode === "all") && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pcr"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="PCR"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
