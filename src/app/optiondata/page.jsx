"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import OptionChainTable from "@/components/tables_data/OptionChainTable";
import OptionChainChart from "@/components/graphs_data/OptionChainChart";
import { RefreshCcw } from "lucide-react"; // refresh icon

// Convert "9:15:20 AM" → total seconds
const parseTime = (timeStr) => {
  if (!timeStr) return 0;
  const [time, meridian] = timeStr.split(" ");
  let [hours, minutes, seconds] = time.split(":").map(Number);

  if (meridian === "PM" && hours !== 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  return hours * 3600 + minutes * 60 + seconds;
};

const symbolToIndex = {
  bank_nifty: "bank_nifty",
  nifty_50: "nifty_50",
  fin_nifty: "fin_nifty",
  midcap_nifty_50: "midcap_nifty_50",
};

export default function OptionDataPage() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimestamp, setSelectedTimestamp] = useState("");
  const [symbol, setSymbol] = useState("nifty_50");
  const [error, setError] = useState("");
  const [spot, setSpot] = useState(null);
  const [filteredSnapshots, setFilteredSnapshots] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Fetch snapshots + spot (extracted for reuse)
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      // Fetch option chain
      const oc = await axios.get(
        `/api/market_data/option_chain?symbol=${symbol}&sort=asc`
      );
      const arr = oc.data?.data || [];
      setSnapshots(arr);
      setSelectedTimestamp(arr.length > 0 ? arr[arr.length - 1].timestamp : "");

      // Fetch spot price
      const priceIndex = symbolToIndex[symbol] || symbol;
      const mp = await axios.get(
        `/api/market_data/price?symbol=${priceIndex}&period=1d`
      );
      const allSeries = Object.values(mp.data?.data || {}).flat();
      const lastItem =
        allSeries.length > 0 ? allSeries[allSeries.length - 1] : null;

      setSpot(lastItem ? Number(lastItem.price) : null);
    } catch (e) {
      console.error(e);
      setError("Failed to load option data or spot.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [symbol]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [symbol, fetchData]);

  // Filter snapshots when timestamp changes
  useEffect(() => {
    if (!snapshots.length) {
      setFilteredSnapshots([]);
      return;
    }

    const sorted = [...snapshots].sort(
      (a, b) => parseTime(a.timestamp) - parseTime(b.timestamp)
    );

    if (!selectedTimestamp) {
      setFilteredSnapshots(sorted);
    } else {
      setFilteredSnapshots(
        sorted.filter(
          (snap) => parseTime(snap.timestamp) <= parseTime(selectedTimestamp)
        )
      );
    }
  }, [snapshots, selectedTimestamp]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-2">
      {/* Sticky Header Controls */}
      <div className="border-b py-3 mb-4 sticky top-0 bg-white/5 backdrop-blur z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">📊 Option Data</h1>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bank_nifty">Bank Nifty</option>
              <option value="nifty_50">Nifty 50</option>
              <option value="fin_nifty">Fin Nifty</option>
              <option value="midcap_nifty_50">Midcap 50</option>
            </select>

            {snapshots.length > 0 && (
              <select
                value={selectedTimestamp || ""}
                onChange={(e) => setSelectedTimestamp(e.target.value)}
                className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {snapshots.map((snap) => (
                  <option key={snap._id} value={snap.timestamp}>
                    {snap.timestamp}
                  </option>
                ))}
              </select>
            )}

            {/* 🔄 Refresh Button */}
            <button
              type="button"
              onClick={fetchData}
              className="p-2 rounded-lg border mr-2 border-gray-300 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
              disabled={refreshing}
              title="Refresh Data"
            >
              <RefreshCcw
                className={`w-5 h-5 ${
                  refreshing ? "animate-spin text-blue-500" : "text-gray-700"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <p className="text-center text-gray-400 py-10 animate-pulse">
          Loading option chain…
        </p>
      ) : error ? (
        <p className="text-center text-red-500 py-10">{error}</p>
      ) : (
        <>
          <div className="shadow-lg rounded-2xl p-1 sm:p-3">
            <OptionChainTable
              snapshots={filteredSnapshots}
              symbol={symbol}
              underlyingSpot={spot}
              showPrevInline={true}
            />
          </div>

          {filteredSnapshots.length > 0 && (
            <div className="shadow-lg rounded-2xl p-1 sm:p-3 mt-2 sm:mt-4">
              <OptionChainChart
                snapshot={filteredSnapshots[filteredSnapshots.length - 1]}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
