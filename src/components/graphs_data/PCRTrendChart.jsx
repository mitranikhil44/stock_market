"use client";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function PCRChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">PCR Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis domain={[0, "auto"]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="pcrOI" name="PCR (OI)" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="pcrVol" name="PCR (Volume)" stroke="#82ca9d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
