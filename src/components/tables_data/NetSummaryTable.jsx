"use client";

import React, { useState } from "react";

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
  scale = { divisor: 100000, unit: "M" },
}) {
  const cleanNum = (val) => {
    if (!val || val === "-" || val.trim?.() === "") return 0;
    return Number(String(val).replace(/,/g, "")) || 0;
  };

  const rows = snapshots.map((snap) => {
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

    return {
      timestamp: snap.timestamp,
      totalCallOI,
      totalPutOI,
      totalCallVol,
      totalPutVol,
    };
  });

  const latest = rows.length ? rows[rows.length - 1] : null;

  // 🔹 Default start = first, end = latest
  const [startIdx, setStartIdx] = useState(0);
  const [endIdx, setEndIdx] = useState(rows.length - 1);

  const start = rows[startIdx];
  const end = rows[endIdx];
  
  const formatTime = (data) => {
    // Format timestamp → "HH:MM AM/PM"
    let formattedTime = "-";
    if (data.timestamp) {
      const parts = data.timestamp.split(" "); // ["9:16:20", "AM"]
      const timePart = parts[0]?.split(":").slice(0, 2).join(":"); // "9:16"
      const ampm = parts[1] || "";
      formattedTime = `${timePart} ${ampm}`;
    }
    return formattedTime;
  };

  const netChange =
    start && end
      ? {
          deltaCallOI: end.totalCallOI - start.totalCallOI,
          deltaPutOI: end.totalPutOI - start.totalPutOI,
          deltaCallVol: end.totalCallVol - start.totalCallVol,
          deltaPutVol: end.totalPutVol - start.totalPutVol,
        }
      : null;

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
            <div
              className={`text-sm font-semibold ${signCls(latest.totalCallOI)}`}
            >
              {formatNum(latest.totalCallOI, scale.divisor, scale.unit)}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Total Put OI</div>
            <div
              className={`text-sm font-semibold ${signCls(latest.totalPutOI)}`}
            >
              {formatNum(latest.totalPutOI, scale.divisor, scale.unit)}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Total Call Vol</div>
            <div
              className={`text-sm font-semibold ${signCls(
                latest.totalCallVol
              )}`}
            >
              {formatNum(latest.totalCallVol, scale.divisor, scale.unit)}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Total Put Vol</div>
            <div
              className={`text-sm font-semibold ${signCls(latest.totalPutVol)}`}
            >
              {formatNum(latest.totalPutVol, scale.divisor, scale.unit)}
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Dropdowns to choose start & end timestamps */}
      {rows.length > 1 && (
        <div className="flex gap-3 items-center text-xs text-slate-300">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Start
            </label>
            <select
              value={startIdx}
              onChange={(e) => setStartIdx(Number(e.target.value))}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1"
            >
              {rows.map((r, i) => {
                // Format timestamp → "HH:MM AM/PM"
                let formattedTime = "-";
                if (r.timestamp) {
                  const parts = r.timestamp.split(" "); // ["9:16:20", "AM"]
                  const timePart = parts[0]?.split(":").slice(0, 2).join(":"); // "9:16"
                  const ampm = parts[1] || "";
                  formattedTime = `${timePart} ${ampm}`;
                }
                return (
                  <option key={i} value={i}>
                    {formattedTime}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">End</label>
            <select
              value={endIdx}
              onChange={(e) => setEndIdx(Number(e.target.value))}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1"
            >
              {rows.map((r, i) => {
                // Format timestamp → "HH:MM AM/PM"
                let formattedTime = "-";
                if (r.timestamp) {
                  const parts = r.timestamp.split(" "); // ["9:16:20", "AM"]
                  const timePart = parts[0]?.split(":").slice(0, 2).join(":"); // "9:16"
                  const ampm = parts[1] || "";
                  formattedTime = `${timePart} ${ampm}`;
                }
                return (
                  <option key={i} value={i}>
                    {formattedTime}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {/* 🔹 selected timestamp net summary card */}
      {netChange && (
        <div className="bg-slate-800/60 border border-slate-600 rounded-xl p-3">
          <div className="text-[12px] text-slate-400 mb-2">
            Net Change from{" "}
            <span className="text-sky-400 font-medium">
              {formatTime(start?.timestamp)}
            </span>{" "}
            →{" "}
            <span className="text-sky-400 font-medium">
              {formatTime(end?.timestamp)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-2">
              <div className="text-[11px] text-slate-400">Δ Call OI</div>
              <div className={`text-sm ${signCls(netChange.deltaCallOI)}`}>
                {formatNum(netChange.deltaCallOI, scale.divisor, scale.unit)}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2">
              <div className="text-[11px] text-slate-400">Δ Put OI</div>
              <div className={`text-sm ${signCls(netChange.deltaPutOI)}`}>
                {formatNum(netChange.deltaPutOI, scale.divisor, scale.unit)}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2">
              <div className="text-[11px] text-slate-400">Δ Call Vol</div>
              <div className={`text-sm ${signCls(netChange.deltaCallVol)}`}>
                {formatNum(netChange.deltaCallVol, scale.divisor, scale.unit)}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2">
              <div className="text-[11px] text-slate-400">Δ Put Vol</div>
              <div className={`text-sm ${signCls(netChange.deltaPutVol)}`}>
                {formatNum(netChange.deltaPutVol, scale.divisor, scale.unit)}
              </div>
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
            {rows.map((r, i) => {
              // 🔹 Previous snapshot
              const prev = rows[i - 1] || {};

              // 🔹 Difference helpers
              const diff = (curr, prevVal) => {
                if (curr == null || prevVal == null) return null;
                return curr - prevVal;
              };

              return (
                <tr
                  key={i}
                  className={`${
                    i % 2 === 0 ? "bg-slate-800/40" : "bg-slate-900/40"
                  } hover:bg-slate-700/40 transition`}
                >
                  <td className="py-2 font-medium text-sky-300">
                    {r.timestamp}
                  </td>
                  {/* Δ Call OI */}
                  <td
                    className={`px-2 text-right ${
                      diff(r.totalCallOI, prev.totalCallOI) > 0
                        ? "text-green-400"
                        : diff(r.totalCallOI, prev.totalCallOI) < 0
                        ? "text-red-400"
                        : "text-slate-400"
                    }`}
                  >
                    {diff(r.totalCallOI, prev.totalCallOI) !== null
                      ? formatNum(
                          diff(r.totalCallOI, prev.totalCallOI),
                          scale.divisor,
                          scale.unit
                        )
                      : "-"}
                  </td>

                  {/* Δ Put OI */}
                  <td
                    className={`px-2 text-right ${
                      diff(r.totalPutOI, prev.totalPutOI) > 0
                        ? "text-green-400"
                        : diff(r.totalPutOI, prev.totalPutOI) < 0
                        ? "text-red-400"
                        : "text-slate-400"
                    }`}
                  >
                    {diff(r.totalPutOI, prev.totalPutOI) !== null
                      ? formatNum(
                          diff(r.totalPutOI, prev.totalPutOI),
                          scale.divisor,
                          scale.unit
                        )
                      : "-"}
                  </td>

                  {/* Δ Call Vol */}
                  <td
                    className={`px-2 text-right ${
                      diff(r.totalCallVol, prev.totalCallVol) > 0
                        ? "text-green-400"
                        : diff(r.totalCallVol, prev.totalCallVol) < 0
                        ? "text-red-400"
                        : "text-slate-400"
                    }`}
                  >
                    {diff(r.totalCallVol, prev.totalCallVol) !== null
                      ? formatNum(
                          diff(r.totalCallVol, prev.totalCallVol),
                          scale.divisor,
                          scale.unit
                        )
                      : "-"}
                  </td>

                  {/* Δ Put Vol */}
                  <td
                    className={`px-2 text-right ${
                      diff(r.totalPutVol, prev.totalPutVol) > 0
                        ? "text-green-400"
                        : diff(r.totalPutVol, prev.totalPutVol) < 0
                        ? "text-red-400"
                        : "text-slate-400"
                    }`}
                  >
                    {diff(r.totalPutVol, prev.totalPutVol) !== null
                      ? formatNum(
                          diff(r.totalPutVol, prev.totalPutVol),
                          scale.divisor,
                          scale.unit
                        )
                      : "-"}
                  </td>

                  {/* Total Put OI */}
                  <td className="px-2 text-right">
                    {formatNum(r.totalPutOI, scale.divisor, scale.unit)}
                  </td>

                  {/* Total Call OI */}
                  <td className="px-2 text-right">
                    {formatNum(r.totalCallOI, scale.divisor, scale.unit)}
                  </td>

                  {/* Total Call Vol */}
                  <td className="px-2 text-right">
                    {formatNum(r.totalCallVol, scale.divisor, scale.unit)}
                  </td>

                  {/* Total Put Vol */}
                  <td className="px-2 text-right">
                    {formatNum(r.totalPutVol, scale.divisor, scale.unit)}
                  </td>
                </tr>
              );
            })}
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
