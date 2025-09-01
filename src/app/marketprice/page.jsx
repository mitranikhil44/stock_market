"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
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
  ReferenceLine,
} from "recharts";

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

function EMA(values, period) {
  const out = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let ema = values[0];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (i === 0) {
      out[i] = v;
      continue;
    }
    ema = v * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

function RSI(values, period = 14) {
  const out = new Array(values.length).fill(null);
  let gains = 0,
    losses = 0;
  for (let i = 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
    if (i >= period) {
      const rs = gains / (losses || 1);
      out[i] = 100 - 100 / (1 + rs);
      const prevChange = values[i - period + 1] - values[i - period];
      if (prevChange >= 0) gains -= prevChange;
      else losses += prevChange;
    }
  }
  return out;
}

function MACD(values, fast = 12, slow = 26, signal = 9) {
  const emaFast = EMA(values, fast);
  const emaSlow = EMA(values, slow);
  const macdLine = values.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null ? emaFast[i] - emaSlow[i] : null
  );
  const signalLine = EMA(
    macdLine.map((v) => v ?? 0),
    signal
  );
  return { macdLine, signalLine };
}

function normalizeTimeLabel(ts) {
  if (!ts) return "";
  const [timePart] = ts.trim().split(" ");
  const [hoursStr, minutesStr] = timePart?.split(":") ?? [];
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr ?? "00";
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
}

// Number formatting
function kFormat(n) {
  if (n == null) return "-";
  const a = Math.abs(n);
  if (a >= 1_00_00_000) return (n / 1_00_00_000).toFixed(1) + "Cr";
  if (a >= 1_00_000) return (n / 1_00_000).toFixed(1) + "L";
  if (a >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

// ---------- Custom Tooltip ----------
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-blue-500/40 rounded-lg shadow-lg px-3 py-2">
        <p className="text-sm font-semibold text-blue-300 border-b border-gray-700 mb-1 pb-1">
          {label}
        </p>
        {payload.map((entry, i) => (
          <p key={`item-${i}`} className="text-xs text-gray-200">
            <span className="inline-block w-20 text-gray-400">
              {entry.name}
            </span>
            <span className="font-bold text-white">{kFormat(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ---------- Reusable MarketChart ----------
function MarketChart({ symbol, title }) {
  const [period, setPeriod] = useState("1d");
  const [chartType, setChartType] = useState("line");
  const [raw, setRaw] = useState([]);
  const [analysis, setAnalysis] = useState(["SMA5", "SMA20"]); // toggles
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `/api/market_data/price?symbol=${symbol}&period=${period}`
        );
        if (!mounted) return;
        const grouped = res.data.data || {};
        const flat = Object.values(grouped).flat();
        setRaw(flat);
      } catch (e) {
        console.error("Error fetching:", e);
      } finally {
        setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [symbol, period]);

  const data = useMemo(() => {
    if (!raw?.length) return [];
    const mapped = raw
      .map((d) => ({
        time: normalizeTimeLabel(d.timestamp),
        price: Number(d.price),
        volume: Number(d.volume),
        high: Number(d.high),
        low: Number(d.low),
        close: Number(d.close),
      }))
      .filter((r) => Number.isFinite(r.price));

    const prices = mapped.map((m) => m.price);
    const sma5 = SMA(prices, 5);
    const sma20 = SMA(prices, 20);
    const ema10 = EMA(prices, 10);
    const rsi = RSI(prices, 14);
    const { macdLine, signalLine } = MACD(prices);
    const supertrend = calculateSuperTrend(mapped);

    let enriched = mapped.map((row, i) => ({
      ...row,
      sma5: sma5[i],
      sma20: sma20[i],
      ema10: ema10[i],
      rsi: rsi[i],
      macd: macdLine[i],
      signal: signalLine[i],
      supertrend: supertrend[i],
    }));

    // ✅ Prediction line (1 step future based on SMA5 last value)
    const lastSMA = sma5[sma5.length - 1];
    if (lastSMA) {
      enriched.push({
        time: "Prediction",
        price: null,
        sma5: lastSMA,
        sma20: null,
        ema10: null,
        rsi: null,
        macd: null,
        signal: null,
        supertrend: null,
        prediction: lastSMA,
      });
    }

    return enriched;
  }, [raw]);

  // ✅ SuperTrend Calculation (fixed)
  function calculateSuperTrend(data, period = 10, multiplier = 3) {
    if (!data || data.length < period) return [];

    let atr = new Array(data.length).fill(null);
    let supertrend = new Array(data.length).fill(null);
    let hl2 = data.map((d) => (d.high + d.low) / 2);

    // ATR Calculation
    for (let i = 1; i < data.length; i++) {
      let tr = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      );
      atr[i] = tr;
    }

    // Smoothed ATR
    let atrAvg = new Array(data.length).fill(null);
    for (let i = period; i < data.length; i++) {
      let slice = atr.slice(i - period + 1, i + 1).filter((x) => x != null);
      atrAvg[i] = slice.reduce((a, b) => a + b, 0) / slice.length;
    }

    // SuperTrend Bands
    for (let i = period; i < data.length; i++) {
      let upperBand = hl2[i] + multiplier * atrAvg[i];
      let lowerBand = hl2[i] - multiplier * atrAvg[i];

      if (i === period) {
        supertrend[i] = hl2[i];
      } else {
        let prevST = supertrend[i - 1];
        if (data[i].close > prevST) {
          supertrend[i] = lowerBand;
        } else {
          supertrend[i] = upperBand;
        }
      }
    }

    return supertrend;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl shadow-md p-4 my-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-xs bg-white text-gray-900 border rounded-lg px-2 py-1"
        >
          <option value="1d">1D</option>
          <option value="1w">1W</option>
          <option value="1m">1M</option>
          <option value="3m">3M</option>
          <option value="1y">1Y</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-700 text-center py-10">Loading...</p>
      ) : (
        <div>
          <ResponsiveContainer width="100%" height={350}>
            {chartType === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" tick={{ fill: "#cbd5e1" }} />
                <YAxis
                  tick={{ fill: "#cbd5e1" }}
                  domain={["dataMin - 10", "dataMax + 10"]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" />

                {/* Price Line */}
                <Line
                  dataKey="price"
                  name="Price"
                  stroke="#3b82f6"
                  dot={false}
                />

                {/* SMA / EMA */}
                {analysis.includes("SMA5") && (
                  <Line
                    dataKey="sma5"
                    name="SMA-5"
                    stroke="#10b981"
                    dot={false}
                  />
                )}
                <Line
                  dataKey="prediction"
                  name="Prediction (SMA)"
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  dot={true}
                />
                {analysis.includes("SMA20") && (
                  <Line
                    dataKey="sma20"
                    name="SMA-20"
                    stroke="#f59e0b"
                    dot={false}
                  />
                )}
                {analysis.includes("EMA10") && (
                  <Line
                    dataKey="ema10"
                    name="EMA-10"
                    stroke="#e11d48"
                    dot={false}
                  />
                )}
                {analysis.includes("SuperTrend") && (
                  <Line
                    dataKey="supertrend"
                    name="SuperTrend"
                    stroke="#22c55e"
                    dot={false}
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" tick={{ fill: "#cbd5e1" }} />
                <YAxis tick={{ fill: "#cbd5e1" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="price" name="Price" fill="#3b82f6" />
              </BarChart>
            )}
          </ResponsiveContainer>

          {/* RSI Chart */}
          {analysis.includes("RSI") && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-blue-300 mb-2">
                RSI (14)
              </h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="time" tick={{ fill: "#9ca3af" }} hide />
                  <YAxis domain={[0, 100]} tick={{ fill: "#9ca3af" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="rsi"
                    name="RSI"
                    stroke="#8b5cf6"
                    strokeWidth={1.5}
                    dot={false}
                  />

                  {/* OverSold (30) */}
                  <ReferenceLine
                    y={30}
                    stroke="#22c55e"
                    strokeDasharray="3 3"
                    label={{
                      value: "Oversold (30)",
                      fill: "#22c55e",
                      fontSize: 10,
                    }}
                  />

                  {/* OverBought (70) */}
                  <ReferenceLine
                    y={70}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    label={{
                      value: "Overbought (70)",
                      fill: "#ef4444",
                      fontSize: 10,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* MACD Chart */}
          {analysis.includes("MACD") && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-blue-300 mb-2">MACD</h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="time" tick={{ fill: "#9ca3af" }} hide />
                  <YAxis
                    domain={["dataMin", "dataMax"]}
                    tick={{ fill: "#9ca3af" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={20} iconType="circle" />
                  <Line
                    dataKey="macd"
                    name="MACD Line"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    dataKey="signal"
                    name="Signal Line"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Analysis Toggles */}
      <div className="flex flex-wrap gap-2 mt-3">
        {["SMA5", "SMA20", "EMA10", "RSI", "MACD", "SuperTrend"].map((a) => (
          <button
            key={a}
            onClick={() =>
              setAnalysis((prev) =>
                prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
              )
            }
            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
              analysis.includes(a)
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-gray-700 text-gray-300 border-gray-500 hover:bg-gray-600"
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function MarketPricePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        Market Indices Analysis
      </h1>
      <MarketChart symbol="nifty_50" title="Nifty 50" />
      <MarketChart symbol="bank_nifty" title="Bank Nifty" />
      <MarketChart symbol="fin_nifty" title="Fin Nifty" />
      <MarketChart symbol="midcap_nifty_50" title="Midcap 50" />
    </div>
  );
}
