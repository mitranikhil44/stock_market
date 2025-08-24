import { NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongodb";
import { isIndianMarketOpen } from "@/components/functions/check_marketing_hour";

// models
import NiftyOptionChainData from "@/models/Nifty_50_Option_Chain_Data";
import BankNiftyOptionChainData from "@/models/Bank_Nifty_Option_Chain_Data";
import FinNiftyOptionChainData from "@/models/Fin_Nifty_Option_Chain_Data";
import MidcapNiftyOptionChainData from "@/models/Midcap_Nifty_50_Option_Chain_Data";

// scraper fn
import get_option_chain_data from "@/components/functions/get_option_chain_data";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    console.log("Connecting to MongoDB...");
    await connectToMongo();
    console.log("Connected to MongoDB ✅");

    const isMarketOpen = isIndianMarketOpen();
    console.log("Market open check:", isMarketOpen);

    if (!isMarketOpen) {
      console.log("Market is closed ❌");
      return NextResponse.json({ success: false, message: "Market is closed" });
    }

    console.log("Fetching & saving option chain data...");
    const [nifty, bank, fin, midcap] = await Promise.all([
      get_option_chain_data("NIFTY", NiftyOptionChainData),
      get_option_chain_data("BANKNIFTY", BankNiftyOptionChainData),
      get_option_chain_data("FINNIFTY", FinNiftyOptionChainData),
      get_option_chain_data("MIDCPNIFTY", MidcapNiftyOptionChainData),
    ]);
    console.log("Fetched & saved all option chain data ✅");

    return NextResponse.json({
      success: true,
      message: "Option chain data fetched & saved successfully",
      saved: {
        nifty_50: !!nifty,
        bank_nifty: !!bank,
        fin_nifty: !!fin,
        midcap_nifty_50: !!midcap,
      },
    });
  } catch (error) {
    console.error("❌ Error occurred in OptionChain GET():", error);
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
