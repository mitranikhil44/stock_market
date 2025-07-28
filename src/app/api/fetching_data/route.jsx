import { NextResponse } from "next/server";
import { isIndianMarketOpen } from "@/components/functions/check_marketing_hour";
import { connectToMongo } from "@/lib/mongodb";

// Import sub-API POST functions directly
import { POST as fetchNifty50 } from "@/app/api/fetching_data/nifty_50/route";
import { POST as fetchNiftyBank } from "@/app/api/fetching_data/nifty_bank/route";
import { POST as fetchFinNifty } from "@/app/api/fetching_data/fin_nifty/route";
import { POST as fetchMidcapNifty } from "@/app/api/fetching_data/nifty_midcap_50/route";

// Prevent edge runtime for better DB supportF
export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectToMongo();

    if (!isIndianMarketOpen()) {
      console.log("⏸️ Market is closed. Skipping data fetching.");
      return NextResponse.json({
        success: false,
        message: "Market is closed",
      });
    }

    console.log("📌 Market is open. Fetching data...");

    const responses = await Promise.all([
      fetchNifty50(),
      fetchNiftyBank(),
      fetchFinNifty(),
      fetchMidcapNifty(),
    ]);

    const results = await Promise.all(responses.map((res) => res.json()));

    return NextResponse.json({
      success: true,
      message: "Data updated",
      results,
    });
  } catch (error) {
    console.error("❌ Error in fetching_data route:", error.message);
    return NextResponse.json({ success: false, error: error.message });
  }
}
