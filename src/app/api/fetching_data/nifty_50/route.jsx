import { NextResponse } from 'next/server';
import NiftyMarketPrice from '@/models/Nifty_50_Market_Price';
import NiftyOptionChainData from '@/models/Nifty_50_Option_Chain_Data';
import get_live_market_price from '@/components/functions/get_live_market_price';
import get_option_chain_data from '@/components/functions/get_option_chain_data';
import CheckAndUpdateExpiryDate from '@/components/CheckAndUpdateExpiryDate';


// API Route handler
export async function POST() {
  try {
    await CheckAndUpdateExpiryDate("NIFTY")

    const data = await get_option_chain_data("NIFTY", NiftyOptionChainData);
    const marketPrice = await get_live_market_price("nifty-50", NiftyMarketPrice);

    if (!data || !marketPrice) {
      return NextResponse.json({ success: false, message: "No new data inserted" });
    }

    return NextResponse.json({ success: true, message: "Nifty data updated" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
