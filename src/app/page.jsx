import dynamic from 'next/dynamic';

const OptionMarketPriceGraph = dynamic(() => import('@/components/graphs_data/MarketPriceGraph'));

export default function Dashboard() {
  return (
    <div>
      <OptionMarketPriceGraph />
    </div>
  );
}
