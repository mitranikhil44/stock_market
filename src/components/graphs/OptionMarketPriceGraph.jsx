'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const OptionIndexGraph = ({ index }) => {
  const [marketData, setMarketData] = useState([]);
  const [chartType, setChartType] = useState('line');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/market_data/price/${index}`);
        setMarketData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching market data", error);
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [index]);

  const ChartComponent = chartType === 'bar' ? BarChart : LineChart;
  const DataComponent = chartType === 'bar' ? Bar : Line;

  if (loading) {
    return <p className="text-center py-10 text-gray-500">Loading market data...</p>;
  }

  if (!marketData.data.length) {
    return <p className="text-center py-10 text-red-500">No data available for this index.</p>;
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md m-2 sm:m-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 capitalize">
          {index.replace(/_/g, ' ')} Market Price
        </h2>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="bg-blue-600 text-white text-sm px-3 py-1 rounded-xl shadow-sm focus:outline-none"
        >
          <option value="line">Line</option>
          <option value="bar">Bar</option>
        </select>
      </div>

      <div className="w-full h-[300px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent
            data={marketData.data}
            margin={{ top: 10, right: 20, left: -10, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              stroke="#4b5563"
              tick={{ fontSize: 10 }}
              angle={-30}
              textAnchor="end"
              interval="preserveStartEnd"
              height={50}
            />
            <YAxis
              stroke="#4b5563"
              tick={{ fontSize: 10 }}
              width={50}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px' }}
              labelStyle={{ color: '#fbbf24' }}
              formatter={(value) => [`₹${value}`, 'Price']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <DataComponent
              dataKey="price"
              stroke="#3b82f6"
              fill="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OptionIndexGraph;
