import { NextResponse } from 'next/server';
import BankNiftyOptionChainData from '@/models/Bank_Nifty_Option_Chain_Data';
import BankNiftyMarketPrice from '@/models/Bank_Nifty_Market_Price';
import get_live_market_price from '@/components/functions/get_live_market_price';
import get_option_chain_data from '@/components/functions/get_option_chain_data';
import CheckAndUpdateExpiryDate from '@/components/CheckAndUpdateExpiryDate';


// API Route handler
export async function POST() {
  try {
    await CheckAndUpdateExpiryDate("BANKNIFTY")
    
    const data = await get_option_chain_data("BANKNIFTY", BankNiftyOptionChainData);
    const marketPrice = await get_live_market_price("nifty-bank", BankNiftyMarketPrice)

    if (!data || !marketPrice) {
      return NextResponse.json({ success: false, message: "No new data inserted" });
    }

    return NextResponse.json({ success: true, message: "Bank Nifty data updated" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
