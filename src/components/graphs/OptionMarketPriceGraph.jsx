'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const OptionIndexGraph = ({ type = 'line', index = 'nifty_50' }) => {
  const [marketData, setMarketData] = useState([]);
  const [chartType, setChartType] = useState(type);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await axios.get(`/api/market_data/${index}`);
        setMarketData(response.data); 
      } catch (error) {
        console.error("Error fetching market data", error);
      }
    };

    fetchMarketData();
  }, [index]);

  const Chart = chartType === 'bar' ? BarChart : LineChart;
  const DataComponent = chartType === 'bar' ? Bar : Line;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold capitalize">{index.replace(/_/g, ' ')} Market Price</h2>
        <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="border px-2 py-1 rounded">
          <option value="line">Line</option>
          <option value="bar">Bar</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <Chart data={marketData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis dataKey="price" />
          <Tooltip />
          <DataComponent dataKey="price" stroke="#8884d8" fill="#8884d8" />
        </Chart>
      </ResponsiveContainer>
    </div>
  );
};

export default OptionIndexGraph;
