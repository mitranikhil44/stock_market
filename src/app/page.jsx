import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';

const OptionMarketPriceGraph = dynamic(() => import('@/components/graphs/OptionMarketPriceGraph'));

export default function Dashboard() {
  return (
    <div>
      <Navbar/>
      <OptionMarketPriceGraph index="nifty_50" />
      <OptionMarketPriceGraph index="bank_nifty" />
      <OptionMarketPriceGraph index="fin_nifty" />
      <OptionMarketPriceGraph index="nifty_midcap_50" />
    </div>
  );
}
