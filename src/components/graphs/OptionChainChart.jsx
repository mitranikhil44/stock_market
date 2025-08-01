'use client';

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis, YAxis,
  Tooltip, Legend, CartesianGrid,
  Bar, Line,
} from 'recharts';
import { parseNum } from '@/utils/optionChain';

export default function OptionChainChart({ snapshot }) {
  // snapshot => { timestamp, data: [...] }
  const [metric, setMetric] = useState('oi'); // 'oi' | 'vol'

  const chartData = useMemo(() => {
    if (!snapshot?.data?.length) return [];
    return snapshot.data.map(r => ({
      strike: String(r.StrikePrice),
      callOI: parseNum(r.CallOI) ?? 0,
      putOI: parseNum(r.PutOI) ?? 0,
      callVol: parseNum(r.CallVol) ?? 0,
      putVol: parseNum(r.PutVol) ?? 0,
      callLTP: parseNum(r.CallLTP) ?? null,
      putLTP: parseNum(r.PutLTP) ?? null,
    }));
  }, [snapshot]);

  const yLeftKey1 = metric === 'oi' ? 'callOI' : 'callVol';
  const yLeftKey2 = metric === 'oi' ? 'putOI' : 'putVol';
  
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-3 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base sm:text-lg font-semibold">Strike vs {metric === 'oi' ? 'Open Interest' : 'Volume'}</h3>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="text-xs sm:text-sm bg-gray-900 text-white border border-white/10 rounded-lg px-2 py-1"
        >
          <option value="oi">Open Interest</option>
          <option value="vol">Volume</option>
        </select>
      </div>

      <div className="w-full h-[300px] sm:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="strike"
              tick={{ fontSize: 10 }}
              angle={-30}
              textAnchor="end"
              height={50}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              width={60}
              domain={[0, 'dataMax']}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', color: '#fff', borderRadius: 8 }}
              labelStyle={{ color: '#fbbf24' }}
              formatter={(value, name) => [value.toLocaleString('en-IN'), name]}
              labelFormatter={(label) => `Strike: ${label}`}
            />
            <Legend />
            {/* Bars for Calls & Puts */}
            <Bar dataKey={yLeftKey1} name={`Call ${metric === 'oi' ? 'OI' : 'Vol'}`} fill="#3b82f6" />
            <Bar dataKey={yLeftKey2} name={`Put ${metric === 'oi' ? 'OI' : 'Vol'}`} fill="#f59e0b" />
            {/* Optional LTP line to overlay price context */}
            <Line dataKey="callLTP" name="Call LTP" stroke="#22c55e" dot={false} strokeWidth={1.5} />
            <Line dataKey="putLTP" name="Put LTP" stroke="#ef4444" dot={false} strokeWidth={1.5} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-gray-400 mt-2">
        Snapshot: <span className="text-gray-200">{snapshot?.timestamp || '-'}</span>
      </div>
    </div>
  );
}
