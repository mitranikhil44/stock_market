'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis, YAxis,
  Tooltip, CartesianGrid,
  Brush, Legend,
} from 'recharts';

// --- helpers ---
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

// Allowed metrics
const METRIC_KEYS = new Set(['call-oi', 'call-vol', 'put-oi', 'put-vol']);

export default function StrikeMetricPage() {
  // ✅ Use useParams in client components
  const params = useParams();
  const symbol = String(params?.symbol || '');
  const strike = decodeURIComponent(String(params?.strike || ''));
  const metric = String(params?.metric || '');

  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Map metric -> accessor
  const getter = useMemo(() => {
    switch (metric) {
      case 'call-oi':  return r => parseNum(r.CallOI);
      case 'call-vol': return r => parseNum(r.CallVol);
      case 'put-oi':   return r => parseNum(r.PutOI);
      case 'put-vol':  return r => parseNum(r.PutVol);
      default:         return () => null;
    }
  }, [metric]);

  // Fetch option chain history
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr('');

        // Guard invalid params early
        if (!symbol || !strike || !METRIC_KEYS.has(metric)) {
          throw new Error('Invalid URL parameters.');
        }

        // ✅ Use axios params, and request ascending so "last = latest"
        const { data } = await axios.get('/api/market_data/option_chain', {
          params: { symbol, sort: 'asc'},
        });

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

  // Build the time series for this strike/metric
  const series = useMemo(() => {
    if (!snapshots.length) return [];
    const out = [];
    for (const snap of snapshots) {
      const row = snap?.data?.find(r => String(r.StrikePrice) === String(strike));
      if (!row) continue;
      const val = getter(row);
      if (val == null) continue;
      out.push({
        time: normalizeTime(snap.timestamp),
        value: val,
      });
    }
    // Data is asc; "last = latest" (your requirement)
    return out;
  }, [snapshots, strike, getter]);

  // Quick analysis
  const analysis = useMemo(() => {
    if (!series.length) return null;
    const values = series.map(s => s.value);
    const first = values[0], last = values[values.length - 1];

    let moves = 0, maxVal = values[0], minVal = values[0], maxIdx = 0, minIdx = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i - 1]) moves++;
      if (values[i] > maxVal) { maxVal = values[i]; maxIdx = i; }
      if (values[i] < minVal) { minVal = values[i]; minIdx = i; }
    }
    const totalChange = last - first;
    return {
      obs: series.length,
      moves,
      first, last, totalChange,
      maxVal, maxTime: series[maxIdx]?.time,
      minVal, minTime: series[minIdx]?.time,
    };
  }, [series]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-white">
            {symbol.replace(/_/g, ' ')} · Strike {strike} · {metric.toUpperCase()}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Intraday time‑series of {metric.replace('-', ' ')} for this strike.
          </p>
        </div>
        <Link href={`/optiondata`} className="text-xs sm:text-sm text-sky-400 hover:underline">
          ← Back to Option Chain
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
        <Stat label="Points" value={analysis?.obs ?? '-'} />
        <Stat label="Moves (changes)" value={analysis?.moves ?? '-'} />
        <Stat label="First" value={analysis?.first?.toLocaleString('en-IN') ?? '-'} />
        <Stat label="Last" value={analysis?.last?.toLocaleString('en-IN') ?? '-'} />
        <Stat
          label="Δ Total"
          value={
            analysis
              ? (analysis.totalChange >= 0
                  ? `+${analysis.totalChange.toLocaleString('en-IN')}`
                  : analysis.totalChange.toLocaleString('en-IN'))
              : '-'
          }
          accent={analysis && analysis.totalChange >= 0 ? 'up' : 'down'}
        />
        <Stat label="Max / Time" value={analysis ? `${analysis.maxVal.toLocaleString('en-IN')} @ ${analysis.maxTime || '-'}` : '-'} />
        <Stat label="Min / Time" value={analysis ? `${analysis.minVal.toLocaleString('en-IN')} @ ${analysis.minTime || '-'}` : '-'} />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-5">
        {loading ? (
          <p className="text-center text-gray-400 py-10">Loading series…</p>
        ) : err ? (
          <p className="text-center text-red-400 py-10">{err}</p>
        ) : !series.length ? (
          <p className="text-center text-gray-400 py-10">No data available for this strike/metric.</p>
        ) : (
          <div className="w-full h-[260px] sm:h-[360px] md:h-[430px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#cbd5e1' }}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                  interval="preserveStartEnd"
                  minTickGap={12}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#cbd5e1' }}
                  width={60}
                  tickFormatter={compactNum}
                  domain={['auto','auto']}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b1220', color: '#fff', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}
                  labelStyle={{ color: '#fbbf24' }}
                  formatter={(v) => [v.toLocaleString('en-IN'), metric.toUpperCase()]}
                />
                <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={metric.toUpperCase()}
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Brush dataKey="time" height={22} travellerWidth={8} stroke="#9ca3af" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  const accentCls =
    accent === 'up'
      ? 'text-emerald-400'
      : accent === 'down'
        ? 'text-rose-400'
        : 'text-slate-100';
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`text-sm sm:text-base font-semibold ${accentCls}`}>{value}</div>
    </div>
  );
}
