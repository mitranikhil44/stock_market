"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import OptionChainTable from "@/components/tables_data/OptionChainTable";
import OptionChainChart from "@/components/graphs_data/OptionChainChart";
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
        const last = lastItem?.data?.length
          ? lastItem.data[lastItem.data.length - 1]
          : null;
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
  );
};

export default analysis;
