import { NextResponse } from "next/server";
import axios from "axios";
import { isIndianMarketOpen } from "@/components/functions/check_marketing_hour";
import { verifyAdminUser } from "@/middleware/Verify_Admin_Token";
import { connectToMongo } from "@/lib/mongodb";

const INDICES = [
  "nifty_50",
  "nifty_bank",
  "nifty_financial",
  "nifty_midcap_50",
];

const fetchIndexData = async (index) => {
  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/api/fetching_data/${index}`
    );
    console.log(`✅ Successfully fetched ${index} data`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching ${index} data:`, error.message);
    return null;
  }
};

export async function GET(req) {
  await connectToMongo();

  if (!isIndianMarketOpen()) {
    console.log("⏸️ Market is closed. Skipping data fetching.");
    return NextResponse.json({ success: false, message: "Market is closed" });
  }

  console.log("📌 Market is open. Fetching data...");
  const results = await Promise.all(INDICES.map(fetchIndexData));

  return NextResponse.json({ success: true, message: "Data updated", results });
}
