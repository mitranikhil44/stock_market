import React from "react";

export default function TimeWiseChangeTable({ series = [], metric = "" }) {
  if (!series.length) return null;

  const last = series.at(-1)?.value || 0;
  const first = series[0]?.value || 0;
  const netChange = last - first;
  const netDirection =
    netChange > 0 ? "↑ Increased" : netChange < 0 ? "↓ Decreased" : "→ No Change";

  return (
    <div className="mt-6 overflow-auto bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3 text-white">
        📈 Time-wise {metric.toUpperCase()} Changes
      </h3>

      <table className="w-full text-xs sm:text-sm text-white border-collapse">
        <thead className="sticky top-0 bg-black/70 backdrop-blur z-10">
          <tr className="text-left">
            <th className="px-2 py-2 text-left">Time</th>
            <th className="px-2 py-2 text-left">{metric.toUpperCase()}</th>
            <th className="px-2 py-2 text-left">Δ from Prev</th>
          </tr>
        </thead>
        <tbody>
          {series.map((pt, i) => {
            const prev = i > 0 ? series[i - 1]?.value : null;
            const delta = prev != null ? pt.value - prev : null;
            const deltaText =
              delta == null
                ? "-"
                : `${delta > 0 ? "+" : ""}${delta.toLocaleString("en-IN")}`;
            const deltaColor =
              delta > 0
                ? "text-green-400"
                : delta < 0
                ? "text-red-400"
                : "text-gray-300";

            return (
              <tr
                key={i}
                className={i % 2 === 0 ? "bg-white/5" : "bg-white/10"}
              >
                <td className="px-2 py-2 font-mono whitespace-nowrap">{pt.time}</td>
                <td className="px-2 py-2 font-semibold">
                  {pt.value.toLocaleString("en-IN")}
                </td>
                <td className={`px-2 py-2 font-medium ${deltaColor}`}>
                  {deltaText}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary Analysis */}
      <div className="mt-4 p-3 bg-black/20 rounded-md text-sm text-white">
        <p>
          <strong>Summary:</strong> From first to last data point,{" "}
          <span
            className={
              netChange > 0
                ? "text-green-400"
                : netChange < 0
                ? "text-red-400"
                : "text-yellow-300"
            }
          >
            {netDirection} by {Math.abs(netChange).toLocaleString("en-IN")}
          </span>
        </p>
      </div>
    </div>
  );
}
