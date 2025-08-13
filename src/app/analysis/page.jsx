"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import OptionFlowShift from "@/components/analysis/OptionFlowShift";
import PCRTable from "@/components/tables_data/PCRTable";
import PCRDiffChart from "@/components/graphs_data/PCRDiffChart";
import NetOIChart from "@/components/graphs_data/NetOIChart";

const symbolToIndex = {
  bank_nifty: "bank_nifty",
  nifty_50: "nifty_50",
  fin_nifty: "fin_nifty",
  midcap_nifty_50: "midcap_nifty_50",
};

function calculateTimewisePCR(snapshots) {
  const cleanNum = (val) => {
    if (typeof val !== "string") return 0;
    if (val === "-" || val.trim() === "") return 0;
    return Number(val.replace(/,/g, "")) || 0;
  };

  return snapshots.map((snap) => {
    let totalCallOI = 0;
    let totalPutOI = 0;
    let totalCallVol = 0;
    let totalPutVol = 0;

    snap.data?.forEach((row) => {
      totalCallOI += cleanNum(row.CallOI);
      totalPutOI += cleanNum(row.PutOI);
      totalCallVol += cleanNum(row.CallVol);
      totalPutVol += cleanNum(row.PutVol);
    });

    const pcrOI = totalCallOI > 0 ? totalPutOI / totalCallOI : 0;
    const pcrVol = totalCallVol > 0 ? totalPutVol / totalCallVol : 0;

    return {
      timestamp: snap.timestamp,
      totalCallOI,
      totalPutOI,
      totalCallVol,
      totalPutVol,
      pcrOI: Number(pcrOI.toFixed(2)),
      pcrVol: Number(pcrVol.toFixed(2)),
    };
  });
}

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
  const prev = snapshots[1] || null;

  const timewiseData = calculateTimewisePCR(snapshots);

  return (
    <>
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
          </div>
        </div>
        {loading ? (
          <p className="text-center text-gray-400 py-10">
            Loading option chain…
          </p>
        ) : error ? (
          <p className="text-center text-red-400 py-10">{error}</p>
        ) : (
          <>
            {snapshots.length > 0 && (
              <>
                <PCRTable data={calculateTimewisePCR(snapshots)} />
                <PCRDiffChart data={calculateTimewisePCR(snapshots)} />
                <NetOIChart timewiseData={timewiseData} />

              </>
            )}
            {latest && prev && (
              <div className="mt-6">
                <OptionFlowShift
                  latestSnapshot={latest}
                  prevSnapshot={prev}
                  symbol={symbol}
                  topN={8}
                  minAbsChange={1000}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default analysis;
