"use client"
import React, { useEffect, useState } from "react";
import axios from "axios";
import OptionFlowShift from "@/components/analysis/OptionFlowShift";

const symbolToIndex = {
  bank_nifty: "nifty_bank",
  nifty_50: "nifty_50",
  fin_nifty: "nifty_financial",
  midcap_nifty_50: "nifty_midcap_50",
};

const analysis = () => {
      const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("nifty_50");
  const [error, setError] = useState("");
  const [spot, setSpot] = useState(null); // ✅ underlying index LTP for ATM highlight

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

        // 2) Get latest index price (for ATM). If your endpoint returns many rows, take last one.
        const priceIndex = symbolToIndex[symbol] || symbol;
        const mp = await axios.get(`/api/market_data/price/${priceIndex}`);
        const series = Array.isArray(mp.data) ? mp.data : mp.data?.data || [];
        const last = series.length ? series[series.length - 1] : null;
        if (mounted) setSpot(last ? Number(last.price) : null);
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

  const latest = snapshots[snapshots.length - 1] || null;
  const prev = snapshots[snapshots.length - 2] || null;
  return (
    
    <>
    {loading ? (
        <p className="text-center text-gray-400 py-10">Loading option chain…</p>
      ) : error ? (
        <p className="text-center text-red-400 py-10">{error}</p>
      ) : (
        <>
    {latest && prev && (
            <div className="mt-6">
              <OptionFlowShift
                latestSnapshot={latest}
                prevSnapshot={prev}
                symbol={symbol}
                topN={8} // optional
                minAbsChange={1000} // tiny noise filter
              />
            </div>
          )}
          
        </>
      )}
    </>
  )
}

export default analysis