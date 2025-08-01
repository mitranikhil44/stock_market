import dynamic from 'next/dynamic';

const OptionMarketPriceGraph = dynamic(() => import('@/components/graphs/OptionMarketPriceGraph'));

export default function Dashboard() {
  return (
    <div>
      <OptionMarketPriceGraph />
    </div>
  );
}
