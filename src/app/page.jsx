import dynamic from 'next/dynamic';

const OptionMarketPriceGraph = dynamic(() => import('@/components/graphs_data/OptionMarketPriceGraph'));

export default function Dashboard() {
  return (
    <div>
      <OptionMarketPriceGraph />
    </div>
  );
}
