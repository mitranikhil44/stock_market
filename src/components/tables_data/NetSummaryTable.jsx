"use client";

import React from "react";

// number formatting helper
function formatNum(n, divisor = 1, unit = "") {
  if (n == null) return "-";
  const sign = n > 0 ? "+" : "";
  return (
    sign +
    Number((n / divisor).toFixed(2)).toLocaleString("en-IN") +
    (unit ? ` ${unit}` : "")
  );
}

function signCls(n) {
  if (n == null) return "text-slate-400";
  if (n > 0) return "text-emerald-400 font-semibold";
  if (n < 0) return "text-rose-400 font-semibold";
  return "text-slate-400";
}

export default function NetSummaryTable({
  snapshots,
  scale = { divisor: 1_000_000, unit: "M" },
}) {
  const cleanNum = (val) => {
    if (!val || val === "-" || val.trim?.() === "") return 0;
    return Number(String(val).replace(/,/g, "")) || 0;
  };

  // calculate rows with both Δ and total
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
      deltaCallOI: idx === 0 ? 0 : totalCallOI - prev.totalCallOI,
      deltaPutOI: idx === 0 ? 0 : totalPutOI - prev.totalPutOI,
      deltaCallVol: idx === 0 ? 0 : totalCallVol - prev.totalCallVol,
      deltaPutVol: idx === 0 ? 0 : totalPutVol - prev.totalPutVol,
      totalCallOI,
      totalPutOI,
      totalCallVol,
      totalPutVol,
    };
  });

  // last snapshot (for summary cards)
  const latest = rows.length ? rows[rows.length - 1] : null;

  return (
    <div className="bg-slate-900/70 border mt-4 sm:mt-2 border-slate-700 rounded-xl p-3 flex flex-col gap-4">
      <h4 className="text-sm font-semibold text-slate-200">
        Net Summary (Snapshot to Snapshot + Cumulative)
      </h4>

      {/* summary cards (latest cumulative) */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Total Call OI</div>
            <div className={`text-sm font-semibold ${signCls(latest.totalCallOI)}`}>
              {formatNum(latest.totalCallOI, scale.divisor, scale.unit)}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Total Put OI</div>
            <div className={`text-sm font-semibold ${signCls(latest.totalPutOI)}`}>
              {formatNum(latest.totalPutOI, scale.divisor, scale.unit)}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Total Call Vol</div>
            <div className={`text-sm font-semibold ${signCls(latest.totalCallVol)}`}>
              {formatNum(latest.totalCallVol, scale.divisor, scale.unit)}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Total Put Vol</div>
            <div className={`text-sm font-semibold ${signCls(latest.totalPutVol)}`}>
              {formatNum(latest.totalPutVol, scale.divisor, scale.unit)}
            </div>
          </div>
        </div>
      )}

      {/* detailed table */}
      <div className="overflow-auto rounded-md border border-slate-700 flex-1 max-h-[45vh]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-800/90 backdrop-blur text-slate-300">
            <tr>
              <th className="text-left py-2 px-2">Timestamp</th>
              <th className="text-right px-2">Δ Call OI</th>
              <th className="text-right px-2">Δ Put OI</th>
              <th className="text-right px-2">Δ Call Vol</th>
              <th className="text-right px-2">Δ Put Vol</th>
              <th className="text-right px-2">Total Call OI</th>
              <th className="text-right px-2">Total Put OI</th>
              <th className="text-right px-2">Total Call Vol</th>
              <th className="text-right px-2">Total Put Vol</th>
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
                <td className={`px-2 text-right ${signCls(r.deltaCallOI)}`}>
                  {formatNum(r.deltaCallOI, scale.divisor, scale.unit)}
                </td>
                <td className={`px-2 text-right ${signCls(r.deltaPutOI)}`}>
                  {formatNum(r.deltaPutOI, scale.divisor, scale.unit)}
                </td>
                <td className={`px-2 text-right ${signCls(r.deltaCallVol)}`}>
                  {formatNum(r.deltaCallVol, scale.divisor, scale.unit)}
                </td>
                <td className={`px-2 text-right ${signCls(r.deltaPutVol)}`}>
                  {formatNum(r.deltaPutVol, scale.divisor, scale.unit)}
                </td>

                <td className={`px-2 text-right ${signCls(r.totalCallOI)}`}>
                  {formatNum(r.totalCallOI, scale.divisor, scale.unit)}
                </td>
                <td className={`px-2 text-right ${signCls(r.totalPutOI)}`}>
                  {formatNum(r.totalPutOI, scale.divisor, scale.unit)}
                </td>
                <td className={`px-2 text-right ${signCls(r.totalCallVol)}`}>
                  {formatNum(r.totalCallVol, scale.divisor, scale.unit)}
                </td>
                <td className={`px-2 text-right ${signCls(r.totalPutVol)}`}>
                  {formatNum(r.totalPutVol, scale.divisor, scale.unit)}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={9}
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
