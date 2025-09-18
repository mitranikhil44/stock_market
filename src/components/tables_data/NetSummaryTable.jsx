"use client";

import React from "react";

// number formatting helper
function formatNum(n, divisor = 1, unit = "") {
  if (n == null) return "-";
  const scaled = n / divisor;
  const sign = n > 0 ? "+" : "";
  return (
    sign +
    Number(scaled.toFixed(2)).toLocaleString("en-IN") +
    (unit ? ` ${unit}` : "")
  );
}

function signCls(n) {
  if (n == null) return "text-slate-400";
  if (n > 0) return "text-emerald-400 font-semibold";
  if (n < 0) return "text-rose-400 font-semibold";
  return "text-slate-400";
}

/**
 * Props:
 * snapshots = [
 *   {
 *     timestamp: "9:16:20 AM",
 *     data: [...]
 *   }
 * ]
 * scale = { divisor, unit }
 */
export default function NetSummaryTable({
  snapshots,
  scale = { divisor: 1_000_000, unit: "M" },
}) {
  const cleanNum = (val) => {
    if (!val || val === "-" || val.trim?.() === "") return 0;
    return Number(String(val).replace(/,/g, "")) || 0;
  };

  // calculate NET CHANGES (Δ) vs previous snapshot
  const rows = snapshots.map((snap, idx) => {
    let totalCallOI = 0;
    let totalPutOI = 0;
    let totalCallVol = 0;
    let totalPutVol = 0;

    snap.data?.forEach((r) => {
      totalCallOI += cleanNum(r.CallOI);
      totalPutOI += cleanNum(r.PutOI);
      totalCallVol += cleanNum(r.CallVol);
      totalPutVol += cleanNum(r.PutVol);
    });

    // Previous snapshot totals (for delta calculation)
    let prev = { totalCallOI: 0, totalPutOI: 0, totalCallVol: 0, totalPutVol: 0 };
    if (idx > 0) {
      snapshots[idx - 1].data?.forEach((r) => {
        prev.totalCallOI += cleanNum(r.CallOI);
        prev.totalPutOI += cleanNum(r.PutOI);
        prev.totalCallVol += cleanNum(r.CallVol);
        prev.totalPutVol += cleanNum(r.PutVol);
      });
    }

    return {
      timestamp: snap.timestamp,
      netCallOI: idx === 0 ? 0 : totalCallOI - prev.totalCallOI,
      netPutOI: idx === 0 ? 0 : totalPutOI - prev.totalPutOI,
      netCallVol: idx === 0 ? 0 : totalCallVol - prev.totalCallVol,
      netPutVol: idx === 0 ? 0 : totalPutVol - prev.totalPutVol,
    };
  });

  return (
    <div className="bg-slate-900/70 border mt-4 sm:mt-2 border-slate-700 rounded-xl p-3 h-[40vh] flex flex-col">
      <h4 className="text-sm font-semibold text-slate-200 mb-2 px-1">
        Net Summary Δ (Snapshot to Snapshot)
      </h4>
      <div className="overflow-auto rounded-md border border-slate-700 flex-1">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-800/90 backdrop-blur text-slate-300">
            <tr>
              <th className="text-left py-2 px-2">Timestamp</th>
              <th className="text-right px-2">Δ Call OI</th>
              <th className="text-right px-2">Δ Put OI</th>
              <th className="text-right px-2">Δ Call Vol</th>
              <th className="text-right px-2">Δ Put Vol</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={`${
                  i % 2 === 0 ? "bg-slate-800/40" : "bg-slate-900/40"
                } hover:bg-slate-700/40 transition`}
              >
                <td className="py-2 font-medium text-sky-300">
                  {r.timestamp
                    ? r.timestamp.split(":").slice(0, 2).join(":") +
                      " " +
                      r.timestamp.split(" ")[1]
                    : "-"}
                </td>
                <td className={`px-2 text-right ${signCls(r.netCallOI)}`}>
                  {formatNum(r.netCallOI, scale.divisor, scale.unit)}
                </td>
                <td className={`px-2 text-right ${signCls(r.netPutOI)}`}>
                  {formatNum(r.netPutOI, scale.divisor, scale.unit)}
                </td>
                <td className={`px-2 text-right ${signCls(r.netCallVol)}`}>
                  {formatNum(r.netCallVol, scale.divisor, scale.unit)}
                </td>
                <td className={`px-2 text-right ${signCls(r.netPutVol)}`}>
                  {formatNum(r.netPutVol, scale.divisor, scale.unit)}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={5}
                  className="py-3 text-center text-slate-500 italic"
                >
                  No snapshots available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
