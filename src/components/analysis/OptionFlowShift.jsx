"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

// --- helpers ---
function parseNum(x) {
  if (x == null) return null;
  const s = String(x).trim();
  if (s === "-" || s === "") return null;
  const cleaned = s.replace(/,/g, "");
  const m = cleaned.match(/^-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}
function toIN(n) {
  if (n == null || Number.isNaN(n)) return "-";
  // keep decimals when present
  return Number(n).toLocaleString("en-IN");
}
function signCls(n) {
  if (n == null) return "text-slate-300";
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-rose-400";
  return "text-slate-300";
}

// Build array for one side (call|put)
function buildRows(latest, prev, side) {
  // side: 'call' or 'put'
  const out = [];
  const L = latest?.data ?? [];
  const prevMap = new Map();
  (prev?.data ?? []).forEach((r) => prevMap.set(String(r.StrikePrice), r));

  for (const r of L) {
    const k = String(r.StrikePrice);
    const p = prevMap.get(k);

    const row = {
      strike: k,
      oiNow: parseNum(side === "call" ? r.CallOI : r.PutOI),
      oiPrev: parseNum(side === "call" ? p?.CallOI : p?.PutOI),
      volNow: parseNum(side === "call" ? r.CallVol : r.PutVol),
      volPrev: parseNum(side === "call" ? p?.CallVol : p?.PutVol),
      ltpNow: parseNum(side === "call" ? r.CallLTP : r.PutLTP),
      ltpPrev: parseNum(side === "call" ? p?.CallLTP : p?.PutLTP),
    };

    row.oiDelta =
      (row.oiNow ?? null) != null && (row.oiPrev ?? null) != null
        ? row.oiNow - row.oiPrev
        : null;
    row.volDelta =
      (row.volNow ?? null) != null && (row.volPrev ?? null) != null
        ? row.volNow - row.volPrev
        : null;
    row.ltpDelta =
      (row.ltpNow ?? null) != null && (row.ltpPrev ?? null) != null
        ? row.ltpNow - row.ltpPrev
        : null;

    out.push(row);
  }

  // Rank by current OI to see rank shifts
  const sortedNow = [...out]
    .filter((r) => r.oiNow != null)
    .sort((a, b) => b.oiNow - a.oiNow);
  const sortedPrev = [...out]
    .filter((r) => r.oiPrev != null)
    .sort((a, b) => b.oiPrev - a.oiPrev);
  const rankPrev = new Map(sortedPrev.map((r, i) => [r.strike, i + 1]));
  const rankNow = new Map(sortedNow.map((r, i) => [r.strike, i + 1]));
  out.forEach((r) => {
    const pr = rankPrev.get(r.strike);
    const nr = rankNow.get(r.strike);
    r.prevRank = pr ?? null;
    r.nowRank = nr ?? null;
    r.rankDelta = pr != null && nr != null ? pr - nr : null; // +ve => moved up (more interest)
  });

  return out;
}

function Pill({ children, className = "" }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] ${className}`}>
      {children}
    </span>
  );
}

function RowTable({ title, rows, symbol, metric, emptyNote, scaleDivisor, unitLabel }) {
  const colCount = rows[0]?.side ? 8 : 7; // Strike, (Side), Now, Prev, Δ, Vol Δ, Rank Δ, Chart

  const formatNow = (v) => {
    if (v == null) return "-";
    const scaled = v / scaleDivisor;
    // show up to 2 decimals and use Indian grouping
    return Number(scaled.toFixed(2)).toLocaleString("en-IN") + (unitLabel ? ` ${unitLabel}` : "");
  };
  const formatSigned = (v) => {
    if (v == null) return "-";
    const scaled = v / scaleDivisor;
    const sign = v > 0 ? "+" : "";
    return sign + Number(scaled.toFixed(2)).toLocaleString("en-IN") + (unitLabel ? ` ${unitLabel}` : "");
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        <Pill className="bg-white/10 text-slate-200">{rows.length}</Pill>
      </div>
      <div className="overflow-auto">
        <table className="min-w-[640px] w-full text-xs">
          <thead>
            <tr className="text-slate-300 border-b border-white/10">
              <th className="text-left py-2 pr-2">Strike</th>
              {rows[0]?.side && <th className="text-left px-2">Side</th>}
              <th className="text-right px-2">Now</th>
              <th className="text-right px-2">Prev</th>
              <th className="text-right px-2">Δ</th>
              <th className="text-right px-2">Vol Δ</th>
              <th className="text-right px-2">Rank Δ</th>
              <th className="text-right px-2">Chart</th>
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((r, i) => (
                <tr key={i} className={`${i % 2 === 0 ? "bg-white/5" : ""}`}>
                  <td className="py-2 pr-2 font-medium text-sky-300">{r.strike}</td>
                  {r.side && (
                    <td className="px-2 text-left">
                      <span
                        className={`font-medium ${
                          r.side === "Call" ? "text-amber-400" : "text-pink-400"
                        }`}
                      >
                        {r.side}
                      </span>
                    </td>
                  )}
                  <td className="px-2 text-right">{formatNow(r.nowVal)}</td>
                  <td className="px-2 text-right text-slate-300">{formatNow(r.prevVal)}</td>
                  <td className={`px-2 text-right ${signCls(r.delta)}`}>
                    {r.delta == null ? "-" : formatSigned(r.delta)}
                  </td>
                  <td className={`px-2 text-right ${signCls(r.volDelta)}`}>
                    {r.volDelta == null ? "-" : formatSigned(r.volDelta)}
                  </td>
                  <td className={`px-2 text-right ${signCls(r.rankDelta)}`}>
                    {r.rankDelta == null
                      ? "-"
                      : (r.rankDelta > 0 ? "↑" : r.rankDelta < 0 ? "↓" : "•") +
                        " " +
                        Math.abs(r.rankDelta)}
                  </td>
                  <td className="px-2 text-right">
                    <Link
                      className="text-sky-400 hover:underline"
                      href={`/optiondata/${symbol}/strike/${encodeURIComponent(
                        r.strike
                      )}/${metric}`}
                    >
                      open →
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-3 text-center text-slate-400" colSpan={colCount}>
                  {emptyNote}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Props:
 * - latestSnapshot, prevSnapshot (objects with { timestamp, data: [...] })
 * - symbol (e.g., 'bank_nifty')
 * - topN (default 8)
 * - minAbsChange (to filter tiny noises) default 1000
 */
export default function OptionFlowShift({
  latestSnapshot,
  prevSnapshot,
  symbol,
  topN = 8,
  minAbsChange = 1000,
}) {
  const [side, setSide] = useState("both"); // 'both' | 'call' | 'put'

  // scale options and default divisor
  const SCALE_OPTIONS = [
    { key: "none", label: "None", divisor: 1, unit: "" },
    { key: "thousand", label: "Thousands", divisor: 1_000, unit: "K" },
    { key: "lakh", label: "Lakhs", divisor: 100_000, unit: "L" },
    { key: "million", label: "Millions", divisor: 1_000_000, unit: "M" },
    { key: "crore", label: "Crores", divisor: 10_000_000, unit: "Cr" },
  ];
  const defaultScale = SCALE_OPTIONS[3]; 
  const [scale, setScale] = useState(defaultScale);

  const built = useMemo(() => {
    const C = buildRows(latestSnapshot, prevSnapshot, "call");
    const P = buildRows(latestSnapshot, prevSnapshot, "put");

    // inflows/outflows by OI
    const inflowC = C.filter(
      (r) =>
        r.oiDelta != null &&
        r.oiDelta > 0 &&
        Math.abs(r.oiDelta) >= minAbsChange
    )
      .sort((a, b) => b.oiDelta - a.oiDelta)
      .slice(0, topN);
    const outflowC = C.filter(
      (r) =>
        r.oiDelta != null &&
        r.oiDelta < 0 &&
        Math.abs(r.oiDelta) >= minAbsChange
    )
      .sort((a, b) => a.oiDelta - b.oiDelta)
      .slice(0, topN);

    const inflowP = P.filter(
      (r) =>
        r.oiDelta != null &&
        r.oiDelta > 0 &&
        Math.abs(r.oiDelta) >= minAbsChange
    )
      .sort((a, b) => b.oiDelta - a.oiDelta)
      .slice(0, topN);
    const outflowP = P.filter(
      (r) =>
        r.oiDelta != null &&
        r.oiDelta < 0 &&
        Math.abs(r.oiDelta) >= minAbsChange
    )
      .sort((a, b) => a.oiDelta - b.oiDelta)
      .slice(0, topN);

    // make row models for table component (generic)
    const mapRow = (r, which = "oi", sideLabel = "") => ({
      strike: r.strike,
      nowVal: which === "oi" ? r.oiNow : r.volNow,
      prevVal: which === "oi" ? r.oiPrev : r.volPrev,
      delta: which === "oi" ? r.oiDelta : r.volDelta,
      volDelta: r.volDelta,
      rankDelta: r.rankDelta,
      side: sideLabel,
    });

    // volume spikes (absolute)
    const volUpC = [...C]
      .filter((r) => r.volDelta != null && r.volDelta > 0)
      .sort((a, b) => b.volDelta - a.volDelta)
      .slice(0, topN);
    const volUpP = [...P]
      .filter((r) => r.volDelta != null && r.volDelta > 0)
      .sort((a, b) => b.volDelta - a.volDelta)
      .slice(0, topN);

    // rank movers
    const rankUpC = [...C]
      .filter((r) => r.rankDelta != null && r.rankDelta > 0)
      .sort((a, b) => b.rankDelta - a.rankDelta)
      .slice(0, topN);
    const rankUpP = [...P]
      .filter((r) => r.rankDelta != null && r.rankDelta > 0)
      .sort((a, b) => b.rankDelta - a.rankDelta)
      .slice(0, topN);

    const rankDownC = [...C]
      .filter((r) => r.rankDelta != null && r.rankDelta < 0)
      .sort((a, b) => a.rankDelta - b.rankDelta)
      .slice(0, topN);
    const rankDownP = [...P]
      .filter((r) => r.rankDelta != null && r.rankDelta < 0)
      .sort((a, b) => a.rankDelta - b.rankDelta)
      .slice(0, topN);

    // Net changes
    const sum = (arr) => arr.reduce((acc, r) => acc + (r ?? 0), 0);
    const netCallOI = sum(C.map((r) => r.oiDelta ?? 0));
    const netPutOI = sum(P.map((r) => r.oiDelta ?? 0));
    const netCallVol = sum(C.map((r) => r.volDelta ?? 0));
    const netPutVol = sum(P.map((r) => r.volDelta ?? 0));

    return {
      C,
      P,
      inflowC: inflowC.map((r) => mapRow(r, "oi", "Call")),
      outflowC: outflowC.map((r) => mapRow(r, "oi", "Call")),
      inflowP: inflowP.map((r) => mapRow(r, "oi", "Put")),
      outflowP: outflowP.map((r) => mapRow(r, "oi", "Put")),
      volUpC: volUpC.map((r) => mapRow(r, "vol", "Call")),
      volUpP: volUpP.map((r) => mapRow(r, "vol", "Put")),
      rankUpC: rankUpC.map((r) => mapRow(r, "oi", "Call")),
      rankDownC: rankDownC.map((r) => mapRow(r, "oi", "Call")),
      rankUpP: rankUpP.map((r) => mapRow(r, "oi", "Put")),
      rankDownP: rankDownP.map((r) => mapRow(r, "oi", "Put")),
      nets: { netCallOI, netPutOI, netCallVol, netPutVol },
    };
  }, [latestSnapshot, prevSnapshot, topN, minAbsChange]);

  const visible = useMemo(() => {
    if (side === "call") {
      return {
        inflowLeft: built.inflowC,
        outflowLeft: built.outflowC,
        volUp: built.volUpC,
        rankUp: built.rankUpC,
        rankDown: built.rankDownC,
        metricForLink: "call-oi",
        metricVolLink: "call-vol",
      };
    }
    if (side === "put") {
      return {
        inflowLeft: built.inflowP,
        outflowLeft: built.outflowP,
        volUp: built.volUpP,
        rankUp: built.rankUpP,
        rankDown: built.rankDownP,
        metricForLink: "put-oi",
        metricVolLink: "put-vol",
      };
    }
    // both: just merge and sort by abs delta
    const mergeSort = (a, b) => Math.abs(b?.delta ?? 0) - Math.abs(a?.delta ?? 0);
    const inflow = [...built.inflowC, ...built.inflowP]
      .sort(mergeSort)
      .slice(0, topN);
    const outflow = [...built.outflowC, ...built.outflowP]
      .sort(mergeSort)
      .slice(0, topN);
    const volUp = [...built.volUpC, ...built.volUpP]
      .sort((a, b) => (b?.volDelta ?? 0) - (a?.volDelta ?? 0))
      .slice(0, topN);
    const rankUp = [...built.rankUpC, ...built.rankUpP]
      .sort((a, b) => (b?.rankDelta ?? 0) - (a?.rankDelta ?? 0))
      .slice(0, topN);
    const rankDown = [...built.rankDownC, ...built.rankDownP]
      .sort((a, b) => (a?.rankDelta ?? 0) - (b?.rankDelta ?? 0))
      .slice(0, topN);

    return {
      inflowLeft: inflow,
      outflowLeft: outflow,
      volUp,
      rankUp,
      rankDown,
      metricForLink: "call-oi",
      metricVolLink: "call-vol",
    };
  }, [built, side, topN]);

  return (
    <div className="space-y-2 md:space-y-4">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">Flow / Shift Analysis (Prev → Latest)</h3>
          <p className="text-xs text-slate-400">Detect where OI/Volume is shifting between last two snapshots.</p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <label className="text-xs text-slate-300">Side</label>
          <select
            className="text-xs bg-white text-slate-900 border rounded-lg px-2 py-1"
            value={side}
            onChange={(e) => setSide(e.target.value)}
          >
            <option value="both">Both</option>
            <option value="call">Calls</option>
            <option value="put">Puts</option>
          </select>

          <label className="text-xs text-slate-300">Scale</label>
          <select
            className="text-xs bg-white text-slate-900 border rounded-lg px-2 py-1"
            value={scale.key}
            onChange={(e) => {
              const s = SCALE_OPTIONS.find((o) => o.key === e.target.value);
              if (s) setScale(s);
            }}
          >
            {SCALE_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* inflow / outflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <RowTable
          title={
            side === "both"
              ? "Top OI Inflows (Call/Put mixed)"
              : side === "call"
              ? "Top Call OI Inflows"
              : "Top Put OI Inflows"
          }
          rows={visible.inflowLeft}
          symbol={symbol}
          metric={side === "put" ? "put-oi" : "call-oi"}
          emptyNote="No significant inflow."
          scaleDivisor={scale.divisor}
          unitLabel={scale.unit}
        />
        <RowTable
          title={
            side === "both"
              ? "Top OI Outflows (Call/Put mixed)"
              : side === "call"
              ? "Top Call OI Outflows"
              : "Top Put OI Outflows"
          }
          rows={visible.outflowLeft}
          symbol={symbol}
          metric={side === "put" ? "put-oi" : "call-oi"}
          emptyNote="No significant outflow."
          scaleDivisor={scale.divisor}
          unitLabel={scale.unit}
        />
      </div>

      {/* volume spikes & rank movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <RowTable
          title={
            side === "both"
              ? "Volume Spikes (Call/Put mixed)"
              : side === "call"
              ? "Call Volume Spikes"
              : "Put Volume Spikes"
          }
          rows={visible.volUp}
          symbol={symbol}
          metric={side === "put" ? "put-vol" : "call-vol"}
          emptyNote="No significant volume spike."
          scaleDivisor={scale.divisor}
          unitLabel={scale.unit}
        />
        <div className="space-y-3">
          <RowTable
            title="Rank Movers ↑ (by OI Rank)"
            rows={visible.rankUp}
            symbol={symbol}
            metric={side === "put" ? "put-oi" : "call-oi"}
            emptyNote="No big rank upgrades."
            scaleDivisor={scale.divisor}
            unitLabel={scale.unit}
          />
          <RowTable
            title="Rank Movers ↓ (by OI Rank)"
            rows={visible.rankDown}
            symbol={symbol}
            metric={side === "put" ? "put-oi" : "call-oi"}
            emptyNote="No big rank drops."
            scaleDivisor={scale.divisor}
            unitLabel={scale.unit}
          />
        </div>
      </div>

      {/* legend */}
      <div className="text-[11px] text-slate-400">
        <span className="mr-2">Δ = change (Latest − Previous). </span>
        <span className="mr-2">
          <span className="text-emerald-400">Green</span> = increase, <span className="text-rose-400">Red</span> = decrease.
        </span>
        <span>Rank Δ +ve ⇒ strike moved up in OI ranking (more interest).</span>
      </div>
    </div>
  );
}
