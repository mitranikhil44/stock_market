import { NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongodb";
import { isIndianMarketOpen } from "@/components/functions/check_marketing_hour";

// models
import NiftyMarketPrice           from "@/models/Nifty_50_Market_Price";
import BankNiftyMarketPrice       from "@/models/Bank_Nifty_Market_Price";
import FinNiftyMarketPrice        from "@/models/Fin_Nifty_Market_Price";
import MidcapNiftyMarketPrice     from "@/models/Midcap_Nifty_50_Market_Price";

// scraper fn
import get_live_market_price      from "@/components/functions/get_live_market_price";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    await connectToMongo();

    if (!isIndianMarketOpen()) {
      return NextResponse.json({ success: false, message: "Market is closed" });
    }

    // call all four in parallel
    const [nifty, bank, fin, midcap] = await Promise.all([
      get_live_market_price("nifty-50",    NiftyMarketPrice),
      get_live_market_price("nifty-bank",  BankNiftyMarketPrice),
      get_live_market_price("nifty-financial-services", FinNiftyMarketPrice),
      get_live_market_price("nifty-midcap-50", MidcapNiftyMarketPrice),
    ]);

    return NextResponse.json({
      success: true,
      results: {
        nifty_50:      !!nifty,
        bank_nifty:    !!bank,
        fin_nifty:     !!fin,
        midcap_nifty_50: !!midcap,
      },
    });
  } catch (error) {
    console.error("Market-prices fetch error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
