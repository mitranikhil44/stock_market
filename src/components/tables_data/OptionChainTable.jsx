"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";

function parseNum(x) {
  if (x == null) return null;
  const s = String(x).trim();
  if (s === "-" || s === "") return null;
  const cleaned = s.replace(/,/g, "");
  const m = cleaned.match(/^-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}
const dividedAmount = 1000;

function CellLink({
  symbol,
  strike,
  metric,
  cur,
  prev,
  start,
  toggleMode,
  label,
}) {
  const d = cur != null && prev != null ? cur - prev : null;
  const e = cur != null && start != null ? cur - start : null;
  const sign = d == null ? "" : d > 0 ? "+" : "";
  const esign = e == null ? "" : e > 0 ? "+" : "";
  const color =
    d == null ? "text-gray-400" : d > 0 ? "text-green-400" : "text-red-400";
  const ecolor =
    e == null ? "text-gray-400" : e > 0 ? "text-green-400" : "text-red-400";

  return (
    <Link
      href={`/optiondata/${symbol}/strike/${encodeURIComponent(
        strike
      )}/${metric}`}
      title={`${label} details for ${strike}`}
      className="group flex items-center justify-between px-2 py-1 text-center hover:bg-blue-900/20 transition rounded-md"
    >
      <div className="font-semibold text-[13px] text-gray-100 group-hover:text-sky-300">
        {cur == null ? "-" : cur.toLocaleString("en-IN")}
      </div>
      <div className="flex flex-col gap-[1px] mt-0.5 text-[10px] leading-tight text-gray-400">
        {(toggleMode === "prev" || toggleMode === "both") && (
          <div className="flex justify-center gap-1">
            <span className="text-gray-500">P:</span>
            <span>{prev == null ? "-" : prev.toLocaleString("en-IN")}</span>
            <span className={`font-medium ${color}`}>
              {d == null ? "-" : `${sign}${(d / dividedAmount).toFixed(2)}`}
            </span>
          </div>
        )}
        {(toggleMode === "start" || toggleMode === "both") && (
          <div className="flex justify-center gap-1">
            <span className="text-gray-500">S:</span>
            <span>{start == null ? "-" : start.toLocaleString("en-IN")}</span>
            <span className={`font-medium ${ecolor}`}>
              {e == null ? "-" : `${esign}${(e / dividedAmount).toFixed(2)}`}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function MiniChartCell({ strike, metric, snapshots }) {
  const data = snapshots
    .map((snap) => {
      const row = snap.data.find((r) => String(r.StrikePrice) === strike) || {};
      let val = null;
      if (metric === "call-oi") val = parseNum(row.CallOI);
      if (metric === "call-vol") val = parseNum(row.CallVol);
      if (metric === "put-oi") val = parseNum(row.PutOI);
      if (metric === "put-vol") val = parseNum(row.PutVol);
      return { time: snap.timestamp, value: val };
    })
    .filter((d) => d.value != null);

  return (
    <div className="w-[80px] h-[30px]">
      {data.length > 1 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              dataKey="value"
              stroke="#60a5fa"
              strokeWidth={1}
              dot={false}
            />
            <Tooltip
              cursor={false}
              formatter={(v) => v?.toLocaleString("en-IN")}
              labelFormatter={(l) => `Time: ${l}`}
              contentStyle={{ display: "none" }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-[10px] text-gray-400">–</div>
      )}
    </div>
  );
}

export default function OptionChainTable({
  snapshots,
  symbol,
  underlyingSpot,
}) {
  const [toggleMode, setToggleMode] = useState("both");
  const [interval, setInterval] = useState(1);
  const [manualPrev, setManualPrev] = useState(null); // for user-selected snapshot

  const { latest, prev, start } = useMemo(() => {
    if (!snapshots?.length) return { latest: null, prev: null, start: null };

    const latestSnap = snapshots[snapshots.length - 1];
    let prevSnap;
    if (manualPrev) {
      prevSnap = snapshots.find((s) => s.timestamp === manualPrev);
    } else if (interval === "all") {
      prevSnap = snapshots[0]; // oldest when "all" is selected
    } else {
      const intervalIndex = Math.max(snapshots.length - 1 - interval, 0);
      prevSnap = snapshots[intervalIndex];
    }
    const startSnap = snapshots[1] || {};

    return { latest: latestSnap, prev: prevSnap, start: startSnap };
  }, [snapshots, interval, manualPrev]);

  const prevByStrike = useMemo(() => {
    const m = new Map();
    (prev?.data || []).forEach((r) => m.set(String(r.StrikePrice), r));
    return m;
  }, [prev]);

  const startByStrike = useMemo(() => {
    const m = new Map();
    (start?.data || []).forEach((r) => m.set(String(r.StrikePrice), r));
    return m;
  }, [start]);

  const atmStrike = useMemo(() => {
    if (!latest?.data?.length || !underlyingSpot) return null;
    let best = null,
      bestDiff = Infinity;
    latest.data.forEach((r) => {
      const k = Number(r.StrikePrice);
      const d = Math.abs(k - underlyingSpot);
      if (d < bestDiff) {
        bestDiff = d;
        best = k;
      }
    });
    return best;
  }, [latest, underlyingSpot]);

  if (!latest?.data?.length) {
    return (
      <div className="text-center text-sm text-gray-400 py-10">
        No option chain data available.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur p-1 sm:p-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
        <h3 className="text-lg sm:text-xl font-semibold text-white">
          {symbol
            .replace(/_/g, " ")
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")}{" "}
          Option Chain
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>
            As of: <span className="text-gray-300">{latest.timestamp}</span>
          </span>
          {underlyingSpot != null && (
            <span>
              Spot:{" "}
              <b className="text-sky-300">
                {underlyingSpot.toLocaleString("en-IN")}
              </b>
            </span>
          )}
        </div>
      </div>

      {/* Interval "All" view */}
      {interval === "all" && (
        <div className="mb-3 p-2 bg-black/30 rounded-lg text-xs text-gray-300 max-h-[200px] overflow-y-auto">
          <p className="mb-1 font-medium text-sky-300">All Snapshots</p>
          <div className="flex flex-col gap-1">
            {snapshots.map((snap, idx) => {
              // Format timestamp → "HH:MM AM/PM"
              let formattedTime = "-";
              if (snap.timestamp) {
                const parts = snap.timestamp.split(" "); // ["9:16:20", "AM"]
                const timePart = parts[0]?.split(":").slice(0, 2).join(":"); // "9:16"
                const ampm = parts[1] || "";
                formattedTime = `${timePart} ${ampm}`;
              }
              return (
                <button
                  key={idx}
                  onClick={() => setManualPrev()}
                  className={`px-2 py-1 rounded text-left ${
                    manualPrev === snap.timestamp
                      ? "bg-sky-600 text-white"
                      : "hover:bg-sky-800/40"
                  }`}
                >
                  {formattedTime}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-x-auto max-h-[80vh]">
        <table className="min-w-[900px] w-full table-auto text-xs sm:text-sm border-collapse">
          <thead className="bg-black backdrop-blur">
            <tr>
              <td colSpan={11} className="pb-1 border-white/10">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-slate-300">Show</label>
                    <select
                      className="text-[10px] bg-white text-slate-900 border rounded px-1 py-0.5"
                      value={toggleMode}
                      onChange={(e) => setToggleMode(e.target.value)}
                    >
                      <option value="both">Both</option>
                      <option value="start">Start</option>
                      <option value="prev">Prev</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-slate-300">
                      Interval
                    </label>
                    <select
                      className="text-[10px] bg-white text-slate-900 border rounded px-1 py-0.5"
                      value={interval}
                      onChange={(e) => {
                        setInterval(
                          e.target.value === "all"
                            ? "all"
                            : Number(e.target.value)
                        );
                        setManualPrev(null);
                      }}
                    >
                      <option value={1}>1 min</option>
                      <option value={5}>5 min</option>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                </div>
              </td>
            </tr>
            <tr className="text-gray-300 sticky top-0 z-10 bg-black">
              <th className="py-1 px-1 text-center border-x">Call LTP</th>
              <th className="py-1 px-1 text-center border-x">Call Chg</th>
              <th className="py-1 px-1 text-center border-x">Call Vol</th>
              <th className="py-1 px-1 text-center border-x">Call OI</th>
              <th className="py-1 px-1 text-center border-x">Chart OI</th>
              <th className="py-2 pr-2 text-center border-x">
                Strike{" "}
                {atmStrike != null && (
                  <span className="text-[10px] text-emerald-400">
                    (ATM: {atmStrike})
                  </span>
                )}
              </th>
              <th className="py-1 px-1 text-center border-x">Chart OI</th>
              <th className="py-1 px-1 text-center border-x">Put OI</th>
              <th className="py-1 px-1 text-center border-x">Put Vol</th>
              <th className="py-1 px-1 text-center border-x">Put Chg</th>
              <th className="py-1 px-1 text-center border-x">Put LTP</th>
            </tr>
          </thead>

          <tbody>
            {latest.data.map((row, idx) => {
              const kStr = String(row.StrikePrice);
              const prevRow = prevByStrike.get(kStr) || {};
              const startRow = startByStrike.get(kStr) || {};

              const cLTP = parseNum(row.CallLTP);
              const cChg = row.CallChgLTP ?? "-";
              const cVol = parseNum(row.CallVol);
              const pCVol = parseNum(prevRow.CallVol);
              const sCVol = parseNum(startRow.CallVol);
              const cOI = parseNum(row.CallOI);
              const pCOI = parseNum(prevRow.CallOI);
              const sCOI = parseNum(startRow.CallOI);

              const pOI = parseNum(row.PutOI);
              const ppOI = parseNum(prevRow.PutOI);
              const spOI = parseNum(startRow.PutOI);
              const putVol = parseNum(row.PutVol);
              const pPutVol = parseNum(prevRow.PutVol);
              const sPutVol = parseNum(startRow.PutVol);
              const putChg = row.PutChgLTP ?? "-";
              const putLTP = parseNum(row.PutLTP);

              const isATM = Number(row.StrikePrice) === atmStrike;

              return (
                <tr
                  key={idx}
                  className={`transition-colors duration-200 hover:bg-blue-500/40 ${
                    isATM ? "bg-blue-500/60" : idx % 2 === 0 ? "bg-white/5" : ""
                  }`}
                >
                  <td className="border border-gray-600 px-1 text-right">
                    {cLTP == null ? "-" : cLTP.toLocaleString("en-IN")}
                  </td>
                  <td className="border border-gray-600 px-1 text-right text-gray-300">
                    {cChg}
                  </td>
                  <td className="border border-gray-600 px-1 text-right align-top">
                    <CellLink
                      {...{
                        symbol,
                        strike: kStr,
                        metric: "call-vol",
                        cur: cVol,
                        prev: pCVol,
                        start: sCVol,
                        toggleMode,
                        label: "Call Vol",
                      }}
                    />
                  </td>
                  <td className="border border-gray-600 px-1 text-right align-top">
                    <CellLink
                      {...{
                        symbol,
                        strike: kStr,
                        metric: "call-oi",
                        cur: cOI,
                        prev: pCOI,
                        start: sCOI,
                        toggleMode,
                        label: "Call OI",
                      }}
                    />
                  </td>
                  <td className="border border-gray-600 px-1 text-center">
                    <MiniChartCell
                      {...{ strike: kStr, metric: "call-oi", snapshots }}
                    />
                  </td>
                  <td className="border border-gray-600 px-2 font-mono text-center text-gray-200">
                    {isATM && (
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />
                    )}
                    {kStr}
                  </td>
                  <td className="border border-gray-600 px-1 text-center">
                    <MiniChartCell
                      {...{ strike: kStr, metric: "put-oi", snapshots }}
                    />
                  </td>
                  <td className="border border-gray-600 px-1 text-left align-top">
                    <CellLink
                      {...{
                        symbol,
                        strike: kStr,
                        metric: "put-oi",
                        cur: pOI,
                        prev: ppOI,
                        start: spOI,
                        toggleMode,
                        label: "Put OI",
                      }}
                    />
                  </td>
                  <td className="border border-gray-600 px-1 text-left align-top">
                    <CellLink
                      {...{
                        symbol,
                        strike: kStr,
                        metric: "put-vol",
                        cur: putVol,
                        prev: pPutVol,
                        start: sPutVol,
                        toggleMode,
                        label: "Put Vol",
                      }}
                    />
                  </td>
                  <td className="border border-gray-600 px-1 text-left text-gray-300">
                    {putChg}
                  </td>
                  <td className="border border-gray-600 px-1 text-left">
                    {putLTP == null ? "-" : putLTP.toLocaleString("en-IN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[11px] text-gray-400">
        Click OI/Vol cells to open a detailed chart & analysis for that strike.
      </p>
    </div>
  );
}
