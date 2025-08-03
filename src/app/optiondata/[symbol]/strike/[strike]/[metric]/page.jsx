'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Brush,
  Legend,
} from 'recharts';

function parseNum(x) {
  if (x == null) return null;
  const s = String(x).trim();
  if (s === '-' || s === '') return null;
  const cleaned = s.replace(/,/g, '');
  const m = cleaned.match(/^-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function normalizeTime(ts) {
  const parts = String(ts ?? '').trim().split(' ');
  if (parts.length >= 2) {
    const hm = parts[0]?.split(':') ?? [];
    if (hm.length >= 2) return `${hm[0]}:${hm[1]} ${parts[1]}`;
  }
  return String(ts ?? '');
}

function compactNum(n) {
  if (n == null) return '';
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return (n / 1_00_00_000).toFixed(1) + 'Cr';
  if (abs >= 1_00_000) return (n / 1_00_000).toFixed(1) + 'L';
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

const METRIC_KEYS = new Set(['call-oi', 'call-vol', 'put-oi', 'put-vol']);

export default function StrikeMetricPage() {
  const [chartType, setChartType] = useState('line');
  const params = useParams();
  const symbol = String(params?.symbol || '');
  const strike = decodeURIComponent(String(params?.strike || ''));
  const metric = String(params?.metric || '');

  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const getter = useMemo(() => {
    switch (metric) {
      case 'call-oi': return (r) => parseNum(r.CallOI);
      case 'call-vol': return (r) => parseNum(r.CallVol);
      case 'put-oi': return (r) => parseNum(r.PutOI);
      case 'put-vol': return (r) => parseNum(r.PutVol);
      default: return () => null;
    }
  }, [metric]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        if (!symbol || !strike || !METRIC_KEYS.has(metric)) throw new Error('Invalid URL parameters.');
        const { data } = await axios.get('/api/market_data/option_chain', { params: { symbol, sort: 'asc' } });
        const arr = Array.isArray(data?.data) ? data.data : [];
        if (mounted) setSnapshots(arr);
      } catch (e) {
        console.error(e);
        if (mounted) setErr(e?.response?.data?.error || e.message || 'Failed to load time series');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [symbol, strike, metric]);

  const series = useMemo(() => {
    if (!snapshots.length) return [];
    const out = [];
    for (const snap of snapshots) {
      const row = snap?.data?.find((r) => String(r.StrikePrice) === String(strike));
      if (!row) continue;
      const val = getter(row);
      if (val == null) continue;
      out.push({ time: normalizeTime(snap.timestamp), value: val });
    }
    return out;
  }, [snapshots, strike, getter]);

  const analysis = useMemo(() => {
    if (!series.length) return null;
    const values = series.map((s) => s.value);
    const first = values[0], last = values[values.length - 1];
    let moves = 0, maxVal = values[0], minVal = values[0], maxIdx = 0, minIdx = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i - 1]) moves++;
      if (values[i] > maxVal) { maxVal = values[i]; maxIdx = i; }
      if (values[i] < minVal) { minVal = values[i]; minIdx = i; }
    }
    return {
      obs: series.length,
      moves,
      first,
      last,
      totalChange: last - first,
      maxVal,
      maxTime: series[maxIdx]?.time,
      minVal,
      minTime: series[minIdx]?.time,
    };
  }, [series]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          {symbol.replace(/_/g, ' ')} · Strike {strike} · {metric.toUpperCase()}
        </h1>
        <Link href="/optiondata" className="text-sm text-sky-400 hover:underline">← Back</Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label className="text-xs text-gray-400">Chart:</label>
        <select value={chartType} onChange={(e) => setChartType(e.target.value)}
                className="text-sm bg-white text-gray-900 border rounded px-2 py-1">
          <option value="line">Line</option>
          <option value="bar">Bar</option>
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        <Stat label="Points" value={analysis?.obs ?? '-'} />
        <Stat label="Moves" value={analysis?.moves ?? '-'} />
        <Stat label="First" value={analysis?.first?.toLocaleString('en-IN') ?? '-'} />
        <Stat label="Last" value={analysis?.last?.toLocaleString('en-IN') ?? '-'} />
        <Stat label="Δ Total" value={analysis ? `${analysis.totalChange >= 0 ? '+' : ''}${analysis.totalChange.toLocaleString('en-IN')}` : '-'}
             accent={analysis?.totalChange >= 0 ? 'up' : 'down'} />
        <Stat label="Max @" value={analysis ? `${analysis.maxVal.toLocaleString('en-IN')} @ ${analysis.maxTime}` : '-'} />
        <Stat label="Min @" value={analysis ? `${analysis.minVal.toLocaleString('en-IN')} @ ${analysis.minTime}` : '-'} />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
        {loading ? (
          <p className="text-center text-gray-400 py-10">Loading…</p>
        ) : err ? (
          <p className="text-center text-red-400 py-10">{err}</p>
        ) : !series.length ? (
          <p className="text-center text-gray-400 py-10">No data for this strike.</p>
        ) : (
          <div className="w-full h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="time" angle={-25} textAnchor="end" height={50} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#cbd5e1' }} width={60} tickFormatter={compactNum} />
                  <Tooltip formatter={(v) => [v.toLocaleString('en-IN'), metric.toUpperCase()]} />
                  <Legend />
                  <Bar dataKey="value" name={metric.toUpperCase()} fill="#60a5fa" />
                  <Brush dataKey="time" height={22} travellerWidth={8} stroke="#9ca3af" />
                </BarChart>
              ) : (
                <LineChart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="time" angle={-25} textAnchor="end" height={50} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#cbd5e1' }} width={60} tickFormatter={compactNum} />
                  <Tooltip formatter={(v) => [v.toLocaleString('en-IN'), metric.toUpperCase()]} />
                  <Legend />
                  <Line dataKey="value" name={metric.toUpperCase()} stroke="#60a5fa" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Brush dataKey="time" height={22} travellerWidth={8} stroke="#9ca3af" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {!!series.length && (
        <div className="mt-6 overflow-x-auto bg-white/5 border border-white/10 rounded-xl p-3">
          <h4 className="text-sm font-semibold mb-2">Time-wise Changes</h4>
          <table className="min-w-[500px] w-full text-xs sm:text-sm">
            <thead className="bg-black text-gray-300 sticky top-0">
              <tr>
                <th className="px-2 py-1">Time</th>
                <th className="px-2 py-1">{metric.toUpperCase()}</th>
                <th className="px-2 py-1">Δ from Prev</th>
              </tr>
            </thead>
            <tbody>
              {series.map((pt, i) => {
                const prevVal = i > 0 ? series[i-1].value : null;
                const change = prevVal != null ? pt.value - prevVal : null;
                return (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                    <td className="px-2 py-1">{pt.time}</td>
                    <td className="px-2 py-1">{pt.value.toLocaleString('en-IN')}</td>
                    <td className={`px-2 py-1 ${change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : ''}`}>
                      {change == null ? '-' : (change>0? '+' : '') + change.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  const accentCls =
    accent === 'up' ? 'text-emerald-400' :
    accent === 'down' ? 'text-rose-400' :
    'text-slate-100';
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`text-sm font-semibold ${accentCls}`}>{value}</div>
    </div>
  );
}
