import { NextResponse } from 'next/server';
import { connectToMongo } from '@/lib/mongodb';

// ✅ Make sure these paths match your actual filenames
import BankNiftyOptionData from '@/models/Bank_Nifty_Option_Chain_Data';
import FinNiftyOptionData from '@/models/Fin_Nifty_Option_Chain_Data';
import NiftyOptionData from '@/models/Nifty_50_Option_Chain_Data';
import MidcapNiftyOptionData from '@/models/Midcap_Nifty_50_Option_Chain_Data';


// Map common symbols/aliases to models
const modelMap = {
  // primary keys
  nifty_50: NiftyOptionData,
  bank_nifty: BankNiftyOptionData,
  fin_nifty: FinNiftyOptionData,
  midcap_nifty_50: MidcapNiftyOptionData,

  // your existing aliases (optional)
  nifty_bank: BankNiftyOptionData,
  nifty_financial: FinNiftyOptionData,
  nifty_midcap_50: MidcapNiftyOptionData,
};

function buildProjection(fieldsParam) {
  if (!fieldsParam) return {};
  const proj = {};
  for (const f of fieldsParam.split(',').map(s => s.trim()).filter(Boolean)) {
    proj[f] = 1;
  }
  return proj;
}

// Always return oldest->newest for charting
async function fetchSeries(Model, { limit, sortOrder, projection }) {
  // Try sorting by createdAt if schema has timestamps; fallback to _id
  const sort = { createdAt: 1, _id: 1 };
  const q = Model.find({}, projection).sort(sort);
  if (limit && Number(limit) > 0) q.limit(Number(limit));
  const docs = await q.lean();
  // If user asked for desc, reverse at the end
  return sortOrder === 'desc' ? docs.slice().reverse() : docs;
}

export async function GET(req) {
  try {
    await connectToMongo();

    const { searchParams } = new URL(req.url);

    // ?symbol=nifty_50 | bank_nifty | fin_nifty | midcap_nifty_50
    // or omit to fetch ALL
    const symbol = searchParams.get('symbol');

    // ?limit=500 (optional)
    const limit = searchParams.get('limit');

    // ?sort=asc|desc  (default asc for charts)
    const sortOrder = (searchParams.get('sort') || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

    // ?fields=timestamp,price,volume  (optional projection)
    const projection = buildProjection(searchParams.get('fields'));

    // ?format=flat  -> returns a single flattened array with `index` field
    const format = (searchParams.get('format') || 'grouped').toLowerCase();

    if (symbol) {
      const Model = modelMap[symbol];
      if (!Model) {
        return NextResponse.json(
          { success: false, error: `Unknown symbol '${symbol}'.` },
          { status: 400 }
        );
      }
      const data = await fetchSeries(Model, { limit, sortOrder, projection });
      return NextResponse.json({ success: true, symbol, data });
    }

    // Fetch ALL in parallel
    const [nifty50, bank, fin, midcap] = await Promise.all([
      fetchSeries(NiftyOptionData, { limit, sortOrder, projection }),
      fetchSeries(BankNiftyOptionData, { limit, sortOrder, projection }),
      fetchSeries(FinNiftyOptionData, { limit, sortOrder, projection }),
      fetchSeries(MidcapNiftyOptionData, { limit, sortOrder, projection }),
    ]);

    if (format === 'flat') {
      // Single array with `index` label on each row
      const tagged = [
        ...nifty50.map(r => ({ ...r, index: 'nifty_50' })),
        ...bank.map(r => ({ ...r, index: 'bank_nifty' })),
        ...fin.map(r => ({ ...r, index: 'fin_nifty' })),
        ...midcap.map(r => ({ ...r, index: 'midcap_nifty_50' })),
      ];
      return NextResponse.json({ success: true, format: 'flat', data: tagged });
    }

    // Grouped (object with keys)
    return NextResponse.json({
      success: true,
      format: 'grouped',
      data: {
        nifty_50: nifty50,
        bank_nifty: bank,
        fin_nifty: fin,
        midcap_nifty_50: midcap,
      },
    });
  } catch (error) {
    console.error('[option_chain] GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
