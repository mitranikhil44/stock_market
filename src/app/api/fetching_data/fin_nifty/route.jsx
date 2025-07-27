import { NextResponse } from 'next/server';
import FinniftyMarketPrice from '@/models/Fin_Nifty_Market_Price';
import FinniftyOptionChainData from '@/models/Fin_Nifty_Option_Chain_Data';
import get_live_market_price from '@/components/functions/get_live_market_price';
import get_option_chain_data from '@/components/functions/get_option_chain_data';
import CheckAndUpdateExpiryDate from '@/components/CheckAndUpdateExpiryDate';


// API Route handler
export async function POST() {
  try {
    await CheckAndUpdateExpiryDate("FINNIFTY")
    
    const data = await get_option_chain_data("FINNIFTY", FinniftyOptionChainData);
    const marketPrice = await get_live_market_price("nifty-financial-services", FinniftyMarketPrice);
    
    if (!data || !marketPrice) {
      return NextResponse.json({ success: false, message: "No new data inserted" });
    }
    
    return NextResponse.json({ success: true, message: "Finnifty data updated" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
