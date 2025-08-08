"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import OptionChainTable from "@/components/tables_data/OptionChainTable";
import OptionChainChart from "@/components/graphs_data/OptionChainChart";

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

  // Fetch snapshots + spot
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch option chain
        const oc = await axios.get(
          `/api/market_data/option_chain?symbol=${symbol}&sort=asc`
        );
        const arr = oc.data?.data || [];

        if (mounted) {
          setSnapshots(arr);
          // Default selected time to latest if available
          if (arr.length > 0) {
            setSelectedTimestamp(arr[arr.length - 1].timestamp);
          } else {
            setSelectedTimestamp("");
          }
        }

        // Fetch spot price
        const priceIndex = symbolToIndex[symbol] || symbol;
        const mp = await axios.get(
          `/api/market_data/price?symbol=${priceIndex}&period=1d`
        );
        const seriesRaw = mp.data?.data || {};
        const allSeries = Object.values(seriesRaw).flat();
        const lastItem =
          allSeries.length > 0 ? allSeries[allSeries.length - 1] : null;

        if (mounted) {
          setSpot(lastItem ? Number(lastItem.price) : null);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError("Failed to load option data or spot.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [symbol]);

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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Option Data</h1>
        <div className="flex gap-2">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="text-sm bg-white text-gray-900 border rounded-lg px-3 py-2"
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
              className="text-sm bg-white text-gray-900 border rounded-lg px-3 py-2"
            >
              {snapshots.map((snap) => (
                <option key={snap._id} value={snap.timestamp}>
                  {snap.timestamp}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading option chain…</p>
      ) : error ? (
        <p className="text-center text-red-400 py-10">{error}</p>
      ) : (
        <>
          <OptionChainTable
            snapshots={filteredSnapshots}
            symbol={symbol}
            underlyingSpot={spot}
            showPrevInline={true}
          />
          <div className="mt-6">
            {filteredSnapshots.length > 0 && (
              <OptionChainChart
                snapshot={filteredSnapshots[filteredSnapshots.length - 1]}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
