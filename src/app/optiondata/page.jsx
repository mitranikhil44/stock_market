'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import OptionChainTable from '@/components/OptionChainTable';
import OptionChainChart from '@/components/graphs/OptionChainChart';

export default function OptionDataPage() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState('bank_nifty'); // change via dropdown if needed
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        // Get only the last 2 snapshots for this symbol (newest last)
        // If your endpoint returns newest first, you can use &sort=asc to make it consistent
        const res = await axios.get(`/api/market_data/option_chain?symbol=${symbol}&limit=2&sort=asc`);
        const arr = res.data?.data || [];
        if (mounted) setSnapshots(arr);
      } catch (e) {
        console.error(e);
        setError('Failed to load option chain. Try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
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
          {/* Table with hover deltas */}
          <OptionChainTable snapshots={snapshots} />

          {/* Chart from latest snapshot */}
          <div className="mt-6">
            <OptionChainChart snapshot={snapshots[snapshots.length - 1]} />
          </div>
        </>
      )}
    </div>
  );
}
