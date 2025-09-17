"use client";
import React from "react";

export default function PCRTable({ data }) {
  if (!data || data.length === 0) return null;

  function kFormat(n) {
    if (n == null) return "-";
    const a = Math.abs(n);
    if (a >= 1_00_00_000) return (n / 1_00_00_000).toFixed(1) + "Cr";
    if (a >= 1_00_000) return (n / 1_00_000).toFixed(1) + "L";
    if (a >= 1_000) return (n / 1_000).toFixed(1) + "k";
    return n.toLocaleString();
  }

  return (
    <div className="glass-card p-2">
      <h2 className="text-xl font-bold p-2 text-gray-100">
        Time-wise PCR Table
      </h2>

      {/* Scrollable container */}
      <div className="max-h-[400px] overflow-y-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm text-gray-300">
          <thead className="sticky top-0 z-10 bg-gray-900/70 backdrop-blur-lg text-xs uppercase text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-center">PCR (OI)</th>
              <th className="px-4 py-3 text-center">PCR (Vol)</th>
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
                  index % 2 === 0 ? "bg-gray-900/30" : "bg-gray-800/30"
                } hover:bg-blue-900/30`}
              >
                <td className="py-2 px-2 font-medium text-yellow-400">
                  {row.timestamp
                    ? row.timestamp.split(":").slice(0, 2).join(":") +
                      " " +
                      row.timestamp.split(" ")[1]
                    : "-"}
                </td>
                <td className="px-4 py-2 text-center font-semibold text-blue-400">
                  {row.pcrOI}
                </td>
                <td className="px-4 py-2 text-center font-semibold text-purple-400">
                  {row.pcrVol}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {kFormat(row.totalCallOI)}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {kFormat(row.totalPutOI)}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {kFormat(row.totalCallVol)}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {kFormat(row.totalPutVol)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
