'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Brush,
} from 'recharts';
import Link from 'next/link';

// ---------- helpers ----------
function toINR(n) {
  if (n == null || Number.isNaN(n)) return '-';
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
function SMA(values, period) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] ?? 0;
    if (i >= period) sum -= values[i - period] ?? 0;
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}
function normalizeTimeLabel(ts) {
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
  if (abs >= 1_00_000)    return (n / 1_00_000).toFixed(1) + 'L';
  if (abs >= 1_000)      return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

// small screen detector (SSR-safe)
function useIsSmall() {
  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isSmall;
}

// ---------- page ----------
export default function OptionMarketPrice() {
  const [index, setIndex] = useState('nifty_50');
  const [period, setPeriod] = useState('1w');       // new!
  const [chartType, setChartType] = useState('line');
  const [showVolume, setShowVolume] = useState(true);
  const [showSMA5, setShowSMA5]       = useState(true);
  const [showSMA20, setShowSMA20]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [raw, setRaw]                 = useState([]); // now a flat array
  const [error, setError]             = useState('');
  const isSmall = useIsSmall();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError('');
        setLoading(true);
        const res = await axios.get(
          `/api/market_data/price?symbol=${index}&period=${period}`
        );
        if (!mounted) return;

        if (res.data.success) {
          const grouped = res.data.data || {};
          const flat = Object.values(grouped).flat();
          setRaw(flat);
        } else {
          throw new Error(res.data.error || 'Unknown error');
        }
      } catch (e) {
        setError('Failed to load market data. Please try again.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [index, period]);
  
  // same mapping / SMA / stats logic as before
  const data = useMemo(() => {
    if (!raw?.length) return [];
    const mapped = raw[0].data
    .map(d => ({
      time: normalizeTimeLabel(d.timestamp),
      price: Number(d.price),
      volume: Number(d.volume),
    }))
    .filter(r => Number.isFinite(r.price));
    
    const prices = mapped.map(m => m.price);
    const sma5 = SMA(prices, 5);
    const sma20 = SMA(prices, 20);
    
    return mapped.map((row, i) => ({
      ...row,
      sma5: sma5[i],
      sma20: sma20[i],
    }));
  }, [raw]);
  
  const stats = useMemo(() => {
    if (!data.length) return null;
    const prices = data.map(d => d.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const open = prices[0];
    const close = prices[prices.length - 1];
    const chg = close - open;
    const chgPct = (chg / open) * 100;
    const volSum = data.reduce((acc, d) => acc + (d.volume || 0), 0);
    return { high, low, open, close, chg, chgPct, volSum };
  }, [data]);

  const ChartComp = chartType === 'bar' ? BarChart : LineChart;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Header / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-white">Analysis</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Intraday price analysis ({period.toUpperCase()})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Symbol */}
          <select
            value={index}
            onChange={e => setIndex(e.target.value)}
            className="text-xs sm:text-sm bg-white text-gray-900 border rounded-lg px-3 py-2"
          >
            <option value="nifty_50">Nifty 50</option>
            <option value="bank_nifty">Bank Nifty</option>
            <option value="fin_nifty">Fin Nifty</option>
            <option value="midcap_nifty_50">Midcap 50</option>
          </select>
          {/* Period */}
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="text-xs sm:text-sm bg-white text-gray-900 border rounded-lg px-3 py-2"
          >
            <option value="1d">Today</option>
            <option value="1w">1W</option>
            <option value="1m">1M</option>
            <option value="3m">3M</option>
            <option value="1y">1Y</option>
            <option value="3y">3Y</option>
            <option value="all">All</option>
          </select>
          {/* Chart type & toggles */}
          <select
            value={chartType}
            onChange={e => setChartType(e.target.value)}
            className="text-xs sm:text-sm bg-white text-gray-900 border rounded-lg px-3 py-2"
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
          </select>
          <label className="flex items-center gap-2 text-xs sm:text-sm bg-white text-gray-900 border rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={showVolume}
              onChange={e => setShowVolume(e.target.checked)}
            />
            Volume
          </label>
          <label className="flex items-center gap-2 text-xs sm:text-sm bg-white text-gray-900 border rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={showSMA5}
              onChange={e => setShowSMA5(e.target.checked)}
            />
            SMA-5
          </label>
          <label className="flex items-center gap-2 text-xs sm:text-sm bg-white text-gray-900 border rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={showSMA20}
              onChange={e => setShowSMA20(e.target.checked)}
            />
            SMA-20
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
        <Stat label="Open" value={toINR(stats?.open)} />
        <Stat label="High" value={toINR(stats?.high)} />
        <Stat label="Low" value={toINR(stats?.low)} />
        <Stat label="Close" value={toINR(stats?.close)} />
        <Stat
          label="Change"
          value={
            stats
              ? `${toINR(stats.chg)} (${stats.chgPct >= 0 ? '+' : ''}${stats.chgPct.toFixed(2)}%)`
              : '-'
          }
          accent={stats?.chg >= 0 ? 'up' : 'down'}
        />
        <Stat label="Volume Σ" value={toINR(stats?.volSum)} />
      </div>

      {/* Chart Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl shadow-md p-3 sm:p-5">
        {loading ? (
          <p className="text-center py-10 text-gray-400">Loading market data…</p>
        ) : error ? (
          <p className="text-center py-10 text-red-400">{error}</p>
        ) : !data.length ? (
          <p className="text-center py-10 text-gray-400">No data to display.</p>
        ) : (
          <div className="w-full h-[260px] sm:h-[360px] md:h-[430px] lg:h-[520px]">
            <ResponsiveContainer width="100%" height="100%">
              <ChartComp
                data={data}
                margin={{ top: 10, right: isSmall ? 10 : 20, left: 0, bottom: isSmall ? 30 : 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: isSmall ? 9 : 10, fill: '#cbd5e1' }}
                  angle={isSmall ? -20 : -30}
                  textAnchor="end"
                  height={isSmall ? 42 : 50}
                  interval="preserveStartEnd"
                  minTickGap={isSmall ? 14 : 8}
                />
                <YAxis
                  yAxisId="price"
                  tick={{ fontSize: isSmall ? 9 : 10, fill: '#cbd5e1' }}
                  width={isSmall ? 46 : 60}
                  domain={['dataMin - 15', 'dataMax + 15']}
                  tickFormatter={compactNum}
                />
                {showVolume && (
                  <YAxis
                    yAxisId="vol"
                    orientation="right"
                    tick={{ fontSize: isSmall ? 9 : 10, fill: '#cbd5e1' }}
                    width={isSmall ? 40 : 50}
                    domain={[0, 'dataMax']}
                    tickFormatter={compactNum}
                  />
                )}
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1220',
                    color: '#fff',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  labelStyle={{ color: '#fbbf24' }}
                  formatter={(value, name) => {
                    if (name === 'price') return [`₹${Number(value).toFixed(2)}`, 'Price'];
                    if (name === 'sma5') return [`₹${Number(value).toFixed(2)}`, 'SMA-5'];
                    if (name === 'sma20') return [`₹${Number(value).toFixed(2)}`, 'SMA-20'];
                    if (name === 'volume') return [compactNum(Number(value)), 'Volume'];
                    return [value, name];
                  }}
                  labelFormatter={label => `Time: ${label}`}
                />
                {!isSmall && (
                  <Legend verticalAlign="top" height={24} wrapperStyle={{ color: '#cbd5e1' }} />
                )}

                {/* price series */}
                {chartType === 'bar' ? (
                  <Bar yAxisId="price" dataKey="price" name="Price" fill="#3b82f6" />
                ) : (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="price"
                    name="Price"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={isSmall ? false : { r: 2.5 }}
                    activeDot={{ r: 4 }}
                  />
                )}
                {showSMA5 && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma5"
                    name="SMA-5"
                    stroke="#10b981"
                    strokeDasharray="4 3"
                    dot={false}
                  />
                )}
                {showSMA20 && !isSmall && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma20"
                    name="SMA-20"
                    stroke="#f59e0b"
                    strokeDasharray="5 4"
                    dot={false}
                  />
                )}
                {showVolume && (
                  <Bar
                    yAxisId="vol"
                    dataKey="volume"
                    name="Volume"
                    fill="#94a3b8"
                    opacity={0.7}
                  />
                )}
                {!isSmall && (
                  <Brush dataKey="time" height={22} travellerWidth={8} stroke="#9ca3af" />
                )}
              </ChartComp>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end mt-3">
        <Link href="/marketprice" className="text-xs sm:text-sm text-sky-400 hover:underline">
          Go to Market Price →
        </Link>
      </div>
    </div>
  );
}

// ---------- small stat card ----------
function Stat({ label, value, accent }) {
  const accentCls =
    accent === 'up'
      ? 'text-emerald-400'
      : accent === 'down'
      ? 'text-rose-400'
      : 'text-slate-100';
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl shadow-sm p-3">
      <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className={`text-sm sm:text-base font-semibold ${accentCls}`}>{value}</div>
    </div>
  );
}
