import { NextResponse } from 'next/server';
import { connectToMongo } from '@/lib/mongodb';

import NiftyOptionChainData from '@/models/Nifty_50_Option_Chain_Data';
import BankNiftyOptionChainData from '@/models/Bank_Nifty_Option_Chain_Data';
import FinniftyOptionChainData from '@/models/Fin_Nifty_Option_Chain_Data';
import MidcapNiftyOptionChainData from '@/models/Midcap_Nifty_50_Option_Chain_Data';

// Connect to DB
connectToMongo();

export async function GET() {
  try {
    const collections = [
      { model: NiftyOptionChainData, name: 'Nifty_50_Option_Chain_Data' },
      { model: BankNiftyOptionChainData, name: 'Bank_Nifty_Option_Chain_Data' },
      { model: FinniftyOptionChainData, name: 'Fin_Nifty_Option_Chain_Data' },
      { model: MidcapNiftyOptionChainData, name: 'Midcap_Nifty_50_Option_Chain_Data' },
    ];

    const results = [];

    for (const { model, name } of collections) {
      const res = await model.deleteMany({});
      console.log(`🧹 Cleared ${res.deletedCount} documents from ${name}`);
      results.push({ collection: name, deletedCount: res.deletedCount });
    }

    return NextResponse.json({
      success: true,
      message: 'All relevant collections cleared successfully.',
      results
    });
  } catch (error) {
    console.error("❌ Error clearing collections:", error.message);
    return NextResponse.json({ success: false, error: error.message });
  }
}
