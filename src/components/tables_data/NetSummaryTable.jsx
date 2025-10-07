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
  const [startIdx, setStartIdx] = useState(0);
  const [endIdx, setEndIdx] = useState(rows.length - 1);

  const start = rows[startIdx];
  const end = rows[endIdx];

  // 🔹 Format time helper
  const formatTime = (t) => {
    if (!t) return "-";
    const parts = t.split(" ");
    const timePart = parts[0]?.split(":").slice(0, 2).join(":");
    const ampm = parts[1] || "";
    return `${timePart} ${ampm}`;
  };

  // 🔹 Calculate net changes
  const netChange =
    start && end
      ? {
          deltaCallOI: end.totalCallOI - start.totalCallOI,
          deltaPutOI: end.totalPutOI - start.totalPutOI,
          deltaCallVol: end.totalCallVol - start.totalCallVol,
          deltaPutVol: end.totalPutVol - start.totalPutVol,
        }
      : null;

  // 🔹 Bias calculation
  const getBias = (deltaCallOI, deltaPutOI) => {
    if (deltaCallOI > 0 && deltaPutOI < 0) return "Bearish 📉";
    if (deltaPutOI > 0 && deltaCallOI < 0) return "Bullish 📈";
    if (deltaCallOI > 0 && deltaPutOI > 0) return "Range-bound ⚖️";
    return "Neutral";
  };

  // 🔹 Smart money strength score
  const getStrength = (r, prev) => {
    const deltaCall = r.totalCallOI - prev.totalCallOI;
    const deltaPut = r.totalPutOI - prev.totalPutOI;
    const deltaVol = (r.totalPutVol - prev.totalPutVol) - (r.totalCallVol - prev.totalCallVol);
    const score = deltaPut - deltaCall + deltaVol * 0.5;
    if (score > 0) return { signal: "Bullish", score };
    if (score < 0) return { signal: "Bearish", score };
    return { signal: "Neutral", score };
  };

  // 🔹 Reversal detector (last 3 snapshots)
  const detectReversal = (rows) => {
    const n = rows.length;
    if (n < 3) return null;
    const prev2 = rows[n - 3], prev1 = rows[n - 2], latest = rows[n - 1];
    const callTrend = prev2.totalCallOI < prev1.totalCallOI && prev1.totalCallOI < latest.totalCallOI;
    const putTrend = prev2.totalPutOI < prev1.totalPutOI && prev1.totalPutOI < latest.totalPutOI;
    if (callTrend && latest.totalPutOI > prev1.totalPutOI * 1.05) return "🔻 Bearish Reversal";
    if (putTrend && latest.totalCallOI > prev1.totalCallOI * 1.05) return "🔺 Bullish Reversal";
    return null;
  };

  const reversal = detectReversal(rows);
  const pcr = end ? (end.totalPutOI / end.totalCallOI).toFixed(2) : "-";

  return (
    <div className="bg-slate-900/70 border mt-4 sm:mt-2 border-slate-700 rounded-xl p-3 flex flex-col gap-4">
      <h4 className="text-sm font-semibold text-slate-200">
        Net Summary (Snapshot to Snapshot + Cumulative)
      </h4>

      {/* Latest Summary */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Total Call OI", val: latest.totalCallOI },
            { label: "Total Put OI", val: latest.totalPutOI },
            { label: "Total Call Vol", val: latest.totalCallVol },
            { label: "Total Put Vol", val: latest.totalPutVol },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">{item.label}</div>
              <div className={`text-sm font-semibold ${signCls(item.val)}`}>
                {formatNum(item.val, scale.divisor, scale.unit)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timestamp Selector */}
      {rows.length > 1 && (
        <div className="flex gap-3 items-center text-xs text-slate-300">
          {[
            { label: "Start", idx: startIdx, setIdx: setStartIdx },
            { label: "End", idx: endIdx, setIdx: setEndIdx },
          ].map(({ label, idx, setIdx }) => (
            <div key={label}>
              <label className="block text-[11px] text-slate-400 mb-1">{label}</label>
              <select
                value={idx}
                onChange={(e) => setIdx(Number(e.target.value))}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1"
              >
                {rows.map((r, i) => (
                  <option key={i} value={i}>
                    {formatTime(r.timestamp)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Analysis Panel */}
      {netChange && (
        <div className="bg-slate-800/60 border border-slate-600 rounded-xl p-3">
          <div className="text-[12px] text-slate-400 mb-2">
            Analysis from{" "}
            <span className="text-sky-400">{formatTime(start?.timestamp)}</span> →{" "}
            <span className="text-sky-400">{formatTime(end?.timestamp)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-300">
            <div>
              <span className="text-sky-400">Directional Bias:</span>{" "}
              {getBias(netChange.deltaCallOI, netChange.deltaPutOI)}
            </div>
            <div>
              <span className="text-sky-400">PCR:</span> {pcr}
            </div>
            <div>
              <span className="text-sky-400">Strength:</span>{" "}
              {(() => {
                const prev = rows[endIdx - 1] || end;
                const s = getStrength(end, prev);
                return `${s.signal} (${s.score.toFixed(0)})`;
              })()}
            </div>
            <div>
              <span className="text-sky-400">Reversal Alert:</span>{" "}
              {reversal ? reversal : "None"}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
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
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const prev = rows[i - 1] || {};
              const diff = (a, b) => (a == null || b == null ? null : a - b);

              return (
                <tr
                  key={i}
                  className={`${i % 2 === 0 ? "bg-slate-800/40" : "bg-slate-900/40"} hover:bg-slate-700/40`}
                >
                  <td className="py-2 font-medium text-sky-300">{r.timestamp}</td>
                  {[r.totalCallOI, r.totalPutOI, r.totalCallVol, r.totalPutVol].map((val, j) => {
                    const prevVal = [prev.totalCallOI, prev.totalPutOI, prev.totalCallVol, prev.totalPutVol][j];
                    const d = diff(val, prevVal);
                    return (
                      <td
                        key={j}
                        className={`px-2 text-right ${
                          d > 0 ? "text-green-400" : d < 0 ? "text-red-400" : "text-slate-400"
                        }`}
                      >
                        {d !== null ? formatNum(d, scale.divisor, scale.unit) : "-"}
                      </td>
                    );
                  })}
                  <td className="px-2 text-right">{formatNum(r.totalCallOI, scale.divisor, scale.unit)}</td>
                  <td className="px-2 text-right">{formatNum(r.totalPutOI, scale.divisor, scale.unit)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
