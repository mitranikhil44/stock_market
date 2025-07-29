'use client';

import React, { useMemo } from 'react';
import { parseNum, delta } from '@/utils/optionChain';

// Simple tooltip cell wrapper
function HoverDelta({ label, cur, prev }) {
  const d = delta(cur, prev);
  const sign = d == null ? '' : d > 0 ? '+' : '';
  const color = d == null ? 'text-gray-300' : d > 0 ? 'text-green-400' : d < 0 ? 'text-red-400' : 'text-gray-300';

  return (
    <div className="relative group">
      <span className="whitespace-nowrap">{cur == null ? '-' : cur.toLocaleString('en-IN')}</span>
      {/* Tooltip */}
      <div className="invisible group-hover:visible absolute z-30 -top-2 left-1/2 -translate-x-1/2 -translate-y-full
                      min-w-[160px] rounded-md bg-gray-900 text-white text-xs p-2 shadow-lg border border-white/10">
        <div className="font-semibold mb-1">{label}</div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Prev:</span>
          <span>{prev == null ? '-' : prev.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Δ:</span>
          <span className={color}>{d == null ? '-' : `${sign}${d.toLocaleString('en-IN')}`}</span>
        </div>
      </div>
    </div>
  );
}

export default function OptionChainTable({ snapshots }) {
  // snapshots => [{ timestamp, data: [ {CallOI,...,StrikePrice,...} ]}, ...]

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

  if (!latest?.data?.length) {
    return <div className="text-center text-sm text-gray-400 py-10">No option chain data.</div>;
  }

  return (
    <div className="w-full overflow-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base sm:text-lg font-semibold">Bank Nifty Option Chain</h3>
        <div className="text-xs text-gray-400">As of: {latest.timestamp}</div>
      </div>

      <table className="min-w-[880px] w-full text-xs sm:text-sm">
        <thead>
          <tr className="text-gray-300 border-b border-white/10">
            <th className="py-2 pr-2 text-left">Strike</th>

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
            const k = String(row.StrikePrice);
            const prevRow = prevByStrike.get(k);

            const strike = row.StrikePrice;

            const cOI  = parseNum(row.CallOI);
            const pCOI = parseNum(prevRow?.CallOI);

            const cVol  = parseNum(row.CallVol);
            const pCVol = parseNum(prevRow?.CallVol);

            const cLTP = parseNum(row.CallLTP);
            const pLTP = parseNum(prevRow?.CallLTP);

            const cChgLTP = row.CallChgLTP ?? '-';

            const pLTPv = parseNum(row.PutLTP);
            const ppLTP = parseNum(prevRow?.PutLTP);

            const pChgLTP = row.PutChgLTP ?? '-';

            const pVol  = parseNum(row.PutVol);
            const ppVol = parseNum(prevRow?.PutVol);

            const pOI  = parseNum(row.PutOI);
            const ppOI = parseNum(prevRow?.PutOI);

            // zebra + highlight ATM-ish near center
            const trBg = idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent';

            return (
              <tr key={idx} className={`${trBg} hover:bg-white/[0.06] transition-colors`}>
                <td className="py-2 pr-2 font-medium text-blue-200">{strike}</td>

                <td className="py-2 px-2 text-right">
                  <HoverDelta label="Call OI" cur={cOI} prev={pCOI} />
                </td>
                <td className="py-2 px-2 text-right">
                  <HoverDelta label="Call Vol" cur={cVol} prev={pCVol} />
                </td>
                <td className="py-2 px-2 text-right">{cLTP == null ? '-' : cLTP.toLocaleString('en-IN')}</td>
                <td className="py-2 px-2 text-right text-gray-300">{cChgLTP}</td>

                <td className="py-2 px-2 text-right">{pLTPv == null ? '-' : pLTPv.toLocaleString('en-IN')}</td>
                <td className="py-2 px-2 text-right text-gray-300">{pChgLTP}</td>
                <td className="py-2 px-2 text-right">
                  <HoverDelta label="Put Vol" cur={pVol} prev={ppVol} />
                </td>
                <td className="py-2 px-2 text-right">
                  <HoverDelta label="Put OI" cur={pOI} prev={ppOI} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-2 text-[11px] text-gray-400">
        Hover OI/Vol cells to see previous snapshot value and change (Δ).
      </p>
    </div>
  );
}
