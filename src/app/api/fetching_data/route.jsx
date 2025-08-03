import { NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongodb";
import { isIndianMarketOpen } from "@/components/functions/check_marketing_hour";

// Option Chain
import NiftyOptionChainData from "@/models/Nifty_50_Option_Chain_Data";
import BankNiftyOptionChainData from "@/models/Bank_Nifty_Option_Chain_Data";
import FinNiftyOptionChainData from "@/models/Fin_Nifty_Option_Chain_Data";
import MidcapNiftyOptionChainData from "@/models/Midcap_Nifty_50_Option_Chain_Data";
import get_option_chain_data from "@/components/functions/get_option_chain_data";
import CheckAndUpdateExpiryDate from "@/components/CheckAndUpdateExpiryDate";

// Market Prices
import NiftyMarketPrice from "@/models/Nifty_50_Market_Price";
import BankNiftyMarketPrice from "@/models/Bank_Nifty_Market_Price";
import FinNiftyMarketPrice from "@/models/Fin_Nifty_Market_Price";
import MidcapNiftyMarketPrice from "@/models/Midcap_Nifty_50_Market_Price";
import get_live_market_price from "@/components/functions/get_live_market_price";

export async function GET() {
  try {
    await connectToMongo();

    if (!isIndianMarketOpen()) {
      return NextResponse.json({ success: false, message: "Market is closed" });
    }

    // 1. Update expiry dates
    await Promise.all([
      CheckAndUpdateExpiryDate("NIFTY"),
      CheckAndUpdateExpiryDate("BANKNIFTY"),
      CheckAndUpdateExpiryDate("FINNIFTY"),
      CheckAndUpdateExpiryDate("MIDCPNIFTY"),
    ]);

    // 2. Fetch all option chains in parallel
    const [niftyOC, bankOC, finOC, midcapOC] = await Promise.all([
      get_option_chain_data("NIFTY", NiftyOptionChainData),
      get_option_chain_data("BANKNIFTY", BankNiftyOptionChainData),
      get_option_chain_data("FINNIFTY", FinNiftyOptionChainData),
      get_option_chain_data("MIDCPNIFTY", MidcapNiftyOptionChainData),
    ]);

    // 3. Fetch all live prices in parallel
    const [niftyMP, bankMP, finMP, midcapMP] = await Promise.all([
      get_live_market_price("nifty-50", NiftyMarketPrice),
      get_live_market_price("nifty-bank", BankNiftyMarketPrice),
      get_live_market_price("nifty-financial-services", FinNiftyMarketPrice),
      get_live_market_price("nifty-midcap-50", MidcapNiftyMarketPrice),
    ]);

    return NextResponse.json({
      success: true,
      message: "All index data updated successfully",
      results: {
        option_chain: {
          nifty_50: !!niftyOC,
          bank_nifty: !!bankOC,
          fin_nifty: !!finOC,
          midcap_nifty_50: !!midcapOC,
        },
        market_prices: {
          nifty_50: !!niftyMP,
          bank_nifty: !!bankMP,
          fin_nifty: !!finMP,
          midcap_nifty_50: !!midcapMP,
        },
      },
    });
  } catch (err) {
    console.error("Combined data fetch error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
