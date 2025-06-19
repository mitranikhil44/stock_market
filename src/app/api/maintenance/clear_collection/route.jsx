import { NextResponse } from 'next/server';
import { connectToMongo } from '@/lib/mongodb';

import NiftyOptionChainData from '@/models/Nifty_50_Option_Chain_Data';
import NiftyMarketPrice from '@/models/Nifty_50_Market_Price';
import BankNiftyOptionChainData from '@/models/Bank_Nifty_Option_Chain_Data';
import BankNiftyMarketPrice from '@/models/Bank_Nifty_Market_Price';
import FinniftyOptionChainData from '@/models/Fin_Nifty_Option_Chain_Data';
import FinniftyMarketPrice from '@/models/Fin_Nifty_Market_Price';
import MidcapNiftyOptionChainData from '@/models/Midcap_Nifty_50_Option_Chain_Data';
import MidcapNiftyMarketPrice from '@/models/Midcap_Nifty_50_Market_Price';

// Connect to DB
connectToMongo();

export async function POST() {
  try {
    const collections = [
      { model: NiftyOptionChainData, name: 'Nifty_50_Option_Chain_Data' },
      { model: NiftyMarketPrice, name: 'Nifty_50_Market_Price' },
      { model: BankNiftyOptionChainData, name: 'Bank_Nifty_Option_Chain_Data' },
      { model: BankNiftyMarketPrice, name: 'Bank_Nifty_Market_Price' },
      { model: FinniftyOptionChainData, name: 'Fin_Nifty_Option_Chain_Data' },
      { model: FinniftyMarketPrice, name: 'Fin_Nifty_Market_Price' },
      { model: MidcapNiftyOptionChainData, name: 'Midcap_Nifty_50_Option_Chain_Data' },
      { model: MidcapNiftyMarketPrice, name: 'Midcap_Nifty_50_Market_Price' }
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
