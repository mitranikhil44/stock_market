'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

/* Local safe parser so you won’t hit import issues */
function parseNum(x) {
  if (x == null) return null;
  const s = String(x).trim();
  if (s === '-' || s === '') return null;
  const cleaned = s.replace(/,/g, '');
  const m = cleaned.match(/^-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}
function delta(cur, prev) {
  if (cur == null || prev == null) return null;
  return cur - prev;
}

export default function OptionChainTable({ snapshots, symbol, underlyingSpot, showPrevInline = false }) {
  const { latest, prev } = useMemo(() => {
    if (!snapshots?.length) return { latest: null, prev: null };
    return {
      latest: snapshots[snapshots.length - 1],
      prev: snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null,
    };
  }, [snapshots]);

  const prevByStrike = useMemo(() => {
    const map = new Map();
    if (prev?.data?.length) {
      prev.data.forEach((r) => {
        map.set(String(r.StrikePrice), r);
      });
    }
    return map;
  }, [prev]);

  const atmStrike = useMemo(() => {
    if (!latest?.data?.length || !underlyingSpot) return null;
    let best = null, bestDiff = Infinity;
    for (const r of latest.data) {
      const k = Number(r.StrikePrice);
      if (!Number.isFinite(k)) continue;
      const d = Math.abs(k - underlyingSpot);
      if (d < bestDiff) { best = k; bestDiff = d; }
    }
    return best;
  }, [latest, underlyingSpot]);

  if (!latest?.data?.length) {
    return <div className="text-center text-sm text-gray-400 py-10">No option chain data.</div>;
  }

  return (
    <div className="w-full overflow-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base sm:text-lg font-semibold">
          {symbol.replace(/_/g, ' ')} Option Chain
        </h3>
        <div className="text-xs text-gray-400 flex gap-3">
          <span>As of: {latest.timestamp}</span>
          {underlyingSpot != null && (
            <span>Spot: <b className="text-sky-300">{underlyingSpot.toLocaleString('en-IN')}</b></span>
          )}
        </div>
      </div>

      <table className="min-w-[900px] w-full text-xs sm:text-sm">
        <thead>
          <tr className="text-gray-300 border-b border-white/10">
            <th className="py-2 pr-2 text-left">Strike {atmStrike != null && <span className="text-[10px] text-emerald-400">(ATM: {atmStrike})</span>}</th>

            <th className="py-2 px-2 text-right">Call OI</th>
            <th className="py-2 px-2 text-right">Call Vol</th>
            <th className="py-2 px-2 text-right">Call LTP</th>
            <th className="py-2 px-2 text-right">Call Chg LTP</th>

            <th className="py-2 px-2 text-right">Put LTP</th>
            <th className="py-2 px-2 text-right">Put Chg LTP</th>
            <th className="py-2 px-2 text-right">Put Vol</th>
            <th className="py-2 px-2 text-right">Put OI</th>
          </tr>
        </thead>
        <tbody>
          {latest.data.map((row, idx) => {
            const kStr = String(row.StrikePrice);
            const kNum = Number(row.StrikePrice);
            const prevRow = prevByStrike.get(kStr);

            const cOI  = parseNum(row.CallOI);
            const pCOI = parseNum(prevRow?.CallOI);

            const cVol  = parseNum(row.CallVol);
            const pCVol = parseNum(prevRow?.CallVol);

            const cLTP = parseNum(row.CallLTP);
            const pLTP = parseNum(prevRow?.CallLTP);

            const cChgLTP = row.CallChgLTP ?? '-';

            const putLTP  = parseNum(row.PutLTP);
            const pPutLTP = parseNum(prevRow?.PutLTP);

            const pChgLTP = row.PutChgLTP ?? '-';

            const putVol  = parseNum(row.PutVol);
            const pPutVol = parseNum(prevRow?.PutVol);

            const pOI  = parseNum(row.PutOI);
            const ppOI = parseNum(prevRow?.PutOI);

            const isATM = atmStrike != null && Number.isFinite(kNum) && kNum === atmStrike;

            return (
              <tr
                key={idx}
                className={`transition-colors ${
                  isATM ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : (idx % 2 === 0 ? 'bg-white/[0.02]' : '')
                }`}
              >
                <td className="py-2 pr-2 font-semibold text-blue-200">
                  <div className="flex items-center gap-2">
                    {isATM && <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />}
                    {kStr}
                  </div>
                </td>

                {/* ✅ Clickable cells open detail page */}
                <td className="py-2 px-2 text-right align-top">
                  <CellLink symbol={symbol} strike={kStr} metric="call-oi" cur={cOI} prev={pCOI} showPrevInline={showPrevInline} label="Call OI" />
                </td>
                <td className="py-2 px-2 text-right align-top">
                  <CellLink symbol={symbol} strike={kStr} metric="call-vol" cur={cVol} prev={pCVol} showPrevInline={showPrevInline} label="Call Vol" />
                </td>
                <td className="py-2 px-2 text-right">{cLTP == null ? '-' : cLTP.toLocaleString('en-IN')}</td>
                <td className="py-2 px-2 text-right text-gray-300">{cChgLTP}</td>

                <td className="py-2 px-2 text-right">{putLTP == null ? '-' : putLTP.toLocaleString('en-IN')}</td>
                <td className="py-2 px-2 text-right text-gray-300">{pChgLTP}</td>
                <td className="py-2 px-2 text-right align-top">
                  <CellLink symbol={symbol} strike={kStr} metric="put-vol" cur={putVol} prev={pPutVol} showPrevInline={showPrevInline} label="Put Vol" />
                </td>
                <td className="py-2 px-2 text-right align-top">
                  <CellLink symbol={symbol} strike={kStr} metric="put-oi" cur={pOI} prev={ppOI} showPrevInline={showPrevInline} label="Put OI" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-2 text-[11px] text-gray-400">
        Click OI/Vol cells to open a detailed graph & analysis for that strike. {showPrevInline ? 'Previous snapshot values are shown under the current number.' : 'Hover to see previous values.'}
      </p>
    </div>
  );
}

function CellLink({ symbol, strike, metric, cur, prev, showPrevInline, label }) {
  const d = cur != null && prev != null ? cur - prev : null;
  const sign = d == null ? '' : d > 0 ? '+' : '';
  const color = d == null ? 'text-gray-300' : d > 0 ? 'text-green-400' : d < 0 ? 'text-red-400' : 'text-gray-300';

  return (
    <Link
      href={`/optiondata/${symbol}/strike/${encodeURIComponent(strike)}/${metric}`}
      className="group inline-block"
      title={`${label} details for ${strike}`}
    >
      <div className="underline-offset-2 group-hover:underline">
        {cur == null ? '-' : cur.toLocaleString('en-IN')}
      </div>
      {showPrevInline && (
        <div className="text-[10px] mt-0.5 text-gray-400">
          Prev: {prev == null ? '-' : prev.toLocaleString('en-IN')} · <span className={color}>{d == null ? '-' : `${sign}${d.toLocaleString('en-IN')}`}</span>
        </div>
      )}
    </Link>
  );
}
