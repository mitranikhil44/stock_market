"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import OptionChainTable from "@/components/tables_data/OptionChainTable";
import OptionChainChart from "@/components/graphs_data/OptionChainChart";

const symbolToIndex = {
  bank_nifty: "nifty_bank",
  nifty_50: "nifty_50",
  fin_nifty: "nifty_financial",
  midcap_nifty_50: "nifty_midcap_50",
};

export default function OptionDataPage() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("nifty_50");
  const [error, setError] = useState("");
  const [spot, setSpot] = useState(null); 

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");

        // 1) Get last 2 snapshots (oldest->newest) for delta & latest
        const oc = await axios.get(
          `/api/market_data/option_chain?symbol=${symbol}&sort=asc`
        );
        const arr = oc.data?.data || [];
        if (mounted) setSnapshots(arr);

        const priceIndex = symbolToIndex[symbol] || symbol;
        const mp = await axios.get(
          `/api/market_data/price?symbol=${priceIndex}&period=1d`
        );
        const seriesRaw = mp.data?.data || {};
        const allSeries = Object.values(seriesRaw).flat();
        const lastItem =
          allSeries.length > 0 ? allSeries[allSeries.length - 1] : null;
        if (mounted) setSpot(lastItem ? Number(lastItem.price) : null);
        
      } catch (e) {
        console.error(e);
        if (mounted) setError("Failed to load option data or spot.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [symbol]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Option Data</h1>
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
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading option chain…</p>
      ) : error ? (
        <p className="text-center text-red-400 py-10">{error}</p>
      ) : (
        <>
          {/* ✅ Pass spot to highlight ATM; showPrevInline toggles previous data under current */}
          <OptionChainTable
            snapshots={snapshots}
            symbol={symbol}
            underlyingSpot={spot}
            showPrevInline={true}
          />

          {/* Chart from latest snapshot (optional; you already had this) */}
          <div className="mt-6">
            <OptionChainChart snapshot={snapshots[snapshots.length - 1]} />
          </div>
        </>
      )}
    </div>
  );
}
