"use client";
import React from "react";

export default function PCRTable({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4 text-gray-200">Time-wise PCR Table</h2>

      {/* Scrollable container */}
      <div className="max-h-[400px] overflow-y-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm text-gray-700">
          <thead className="sticky top-0 z-10 bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-center">PCR (OI)</th>
              <th className="px-4 py-3 text-center">PCR (Volume)</th>
              <th className="px-4 py-3 text-right">Call OI</th>
              <th className="px-4 py-3 text-right">Put OI</th>
              <th className="px-4 py-3 text-right">Call Vol</th>
              <th className="px-4 py-3 text-right">Put Vol</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.timestamp}
                className={`transition duration-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50`}
              >
                <td className="px-4 py-2 font-mono">{row.timestamp}</td>
                <td className="px-4 py-2 text-center font-semibold text-blue-700">{row.pcrOI}</td>
                <td className="px-4 py-2 text-center font-semibold text-purple-700">{row.pcrVol}</td>
                <td className="px-4 py-2 text-right font-mono">{row.totalCallOI.toLocaleString()}</td>
                <td className="px-4 py-2 text-right font-mono">{row.totalPutOI.toLocaleString()}</td>
                <td className="px-4 py-2 text-right font-mono">{row.totalCallVol.toLocaleString()}</td>
                <td className="px-4 py-2 text-right font-mono">{row.totalPutVol.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
