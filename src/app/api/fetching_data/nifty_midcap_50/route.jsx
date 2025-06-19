import { NextResponse } from 'next/server';
import MidcapNiftyMarketPrice from '@/models/Midcap_Nifty_50_Market_Price';
import MidcapNiftyOptionChainData from '@/models/Midcap_Nifty_50_Option_Chain_Data';
import get_live_market_price from '@/components/functions/get_live_market_price';
import get_option_chain_data from '@/components/functions/get_option_chain_data';
import CheckAndUpdateExpiryDate from '@/components/CheckAndUpdateExpiryDate';

// API Route handler
export async function POST() {
  try {
    await CheckAndUpdateExpiryDate("MIDCPNIFTY")
    
    const data = await get_option_chain_data("MIDCPNIFTY", MidcapNiftyOptionChainData);
    const marketPrice = await get_live_market_price("nifty-midcap-50", MidcapNiftyMarketPrice);
    
    if (!data || !marketPrice) {
      return NextResponse.json({ success: false, message: "No new data inserted" });
    }
    
    return NextResponse.json({ success: true, message: "MIDCPNIFTY data updated" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
