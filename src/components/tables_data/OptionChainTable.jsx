"use client";

import React, { useMemo } from "react";
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

function CellLink({
  symbol,
  strike,
  metric,
  cur,
  prev,
  start,
  showPrevInline,
  label,
}) {
  const d = cur != null && prev != null ? cur - prev : null;
  const e = cur != null && start != null ? cur - start : null;
  const sign = d == null ? "" : d > 0 ? "+" : "";
  const esign = e == null ? "" : e > 0 ? "+" : "";
  const color =
    d == null ? "text-gray-300" : d > 0 ? "text-green-400" : "text-red-400";
  const ecolor =
    e == null ? "text-gray-300" : e > 0 ? "text-green-400" : "text-red-400";

  return (
    <Link
      href={`/optiondata/${symbol}/strike/${encodeURIComponent(
        strike
      )}/${metric}`}
      className="group inline-block"
      title={`${label} details for ${strike}`}
    >
      <div className="underline-offset-2 group-hover:underline">
        {cur == null ? "-" : cur.toLocaleString("en-IN")}
      </div>
      {showPrevInline && (
        <>
        <div className="text-[10px] mt-0.5 text-gray-400">
          Prev: {prev == null ? "-" : prev.toLocaleString("en-IN")} ·{" "}
          <span className={color}>
            {d == null ? "-" : `${sign}${d.toLocaleString("en-IN")}`}
          </span>
        </div>
        <div className="text-[10px] mt-0.5 text-gray-400">
          Start: {start == null ? "-" : start.toLocaleString("en-IN")} ·{" "}
          <span className={ecolor}>
            {e == null ? "-" : `${esign}${e.toLocaleString("en-IN")}`}
          </span>
        </div>
        </>
      )}
    </Link>
  );
}

function MiniChartCell({ symbol, strike, metric, snapshots }) {
  const data = snapshots
    .map((snap) => {
      const row = snap.data.find((r) => String(r.StrikePrice) === strike) || {};
      // !!! USE row.CallOI, row.CallVol, row.PutOI, row.PutVol !!!
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
  showPrevInline = false,
}) {
  const { latest, prev, start } = useMemo(() => {
    if (!snapshots?.length) return { latest: null, prev: null };
    return {
      latest: snapshots[snapshots.length - 1],
      prev: snapshots.length >= 2 ? snapshots[snapshots.length - 2] : {},
      start: snapshots.length >= 2 ? snapshots[0] : {},
    };
  }, [snapshots]);

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
        No option chain data.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-3">
      <div className="max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold">
            {symbol.replace(/_/g, " ")} Option Chain
          </h3>
          <div className="text-xs text-gray-400 flex gap-3">
            <span>As of: {latest.timestamp}</span>
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

        <table className="min-w-[900px] w-full table-auto text-xs sm:text-sm">
          <thead className="sticky top-0 z-10 bg-black">
            <tr className="text-gray-300 border-b border-white/10">
              <th className="py-1 px-1 text-right">Call LTP</th>
              <th className="py-1 px-1 text-right">Call Chg</th>
              <th className="py-1 px-1 text-right">Call Vol</th>
              <th className="py-1 px-1 text-right">Call OI</th>
              <th className="py-1 px-1 text-center">Chart OI</th>
              <th className="py-2 pr-2 text-center w-full">
                Strike{" "}
                {atmStrike != null && (
                  <span className="text-[10px] text-emerald-400">
                    (ATM:{atmStrike})
                  </span>
                )}
              </th>
              <th className="py-1 px-1 text-center">Chart OI</th>
              <th className="py-1 px-1 text-left">Put OI</th>
              <th className="py-1 px-1 text-left">Put Vol</th>
              <th className="py-1 px-1 text-left">Put Chg</th>
              <th className="py-1 px-1 text-left">Put LTP</th>
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
                  className={`transition-colors ${
                    isATM
                      ? "bg-emerald-500/10 hover:bg-emerald-500/20"
                      : idx % 2 === 0
                      ? "bg-white/[0.02]"
                      : ""
                  }`}
                >
                  <td className="py-1 px-1 text-right">
                    {cLTP == null ? "-" : cLTP.toLocaleString("en-IN")}
                  </td>
                  <td className="py-1 px-1 text-right text-gray-300">{cChg}</td>
                  <td className="py-1 px-1 text-right align-top">
                    <CellLink
                      symbol={symbol}
                      strike={kStr}
                      metric="call-vol"
                      cur={cVol}
                      prev={pCVol}
                      start={sCVol}
                      showPrevInline={showPrevInline}
                      label="Call Vol"
                    />
                  </td>
                  <td className="py-1 px-1 text-right align-top">
                    <CellLink
                      symbol={symbol}
                      strike={kStr}
                      metric="call-oi"
                      cur={cOI}
                      prev={pCOI}
                      start={sCOI}
                      showPrevInline={showPrevInline}
                      label="Call OI"
                    />
                  </td>
                  <td className="py-1 px-1 text-center">
                    <MiniChartCell
                      symbol={symbol}
                      strike={kStr}
                      metric="call-oi"
                      snapshots={snapshots}
                    />
                  </td>
                  <td className="py-1 px-2 font-mono text-gray-200 text-center">
                    {isATM && (
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />
                    )}
                    {kStr}
                  </td>
                  <td className="py-1 px-1 text-center">
                    <MiniChartCell
                      symbol={symbol}
                      strike={kStr}
                      metric="put-oi"
                      snapshots={snapshots}
                    />
                  </td>
                  <td className="py-1 px-1 text-left align-top">
                    <CellLink
                      symbol={symbol}
                      strike={kStr}
                      metric="put-oi"
                      cur={pOI}
                      prev={ppOI}
                      start={spOI}
                      showPrevInline={showPrevInline}
                      label="Put OI"
                    />
                  </td>
                  <td className="py-1 px-1 text-left align-top">
                    <CellLink
                      symbol={symbol}
                      strike={kStr}
                      metric="put-vol"
                      cur={putVol}
                      prev={pPutVol}
                      start={sPutVol}
                      showPrevInline={showPrevInline}
                      label="Put Vol"
                    />
                  </td>
                  <td className="py-1 px-1 text-left text-gray-300">
                    {putChg}
                  </td>
                  <td className="py-1 px-1 text-left">
                    {putLTP == null ? "-" : putLTP.toLocaleString("en-IN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="mt-2 text-[11px] text-gray-400">
          Click OI/Vol cells to open a detailed graph & analysis for that
          strike.
        </p>
      </div>
    </div>
  );
}
