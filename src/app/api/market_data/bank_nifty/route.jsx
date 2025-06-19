import { connectToMongo } from "@/lib/mongodb";
import BankNiftyMarketPrice from "@/models/Bank_Nifty_Market_Price";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToMongo();
    const data = await BankNiftyMarketPrice.find();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
