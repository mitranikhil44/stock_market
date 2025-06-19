import { connectToMongo } from "@/lib/mongodb";
import NiftyMarketPrice from "@/models/Nifty_50_Market_Price";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToMongo();
    const data = await NiftyMarketPrice.find();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
