import { connectToMongo } from "@/lib/mongodb";
import MidcapNiftyMarketPrice from '@/models/Midcap_Nifty_50_Market_Price';
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToMongo();
    const data = await MidcapNiftyMarketPrice.find();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
