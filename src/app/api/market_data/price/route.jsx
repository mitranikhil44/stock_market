import { NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongodb";
import NiftyMarketPrice        from "@/models/Nifty_50_Market_Price";
import BankNiftyMarketPrice    from "@/models/Bank_Nifty_Market_Price";
import FinNiftyMarketPrice     from "@/models/Fin_Nifty_Market_Price";
import MidcapNiftyMarketPrice  from "@/models/Midcap_Nifty_50_Market_Price";

const modelMap = {
  nifty_50:        NiftyMarketPrice,
  bank_nifty:      BankNiftyMarketPrice,
  fin_nifty:       FinNiftyMarketPrice,
  midcap_nifty_50: MidcapNiftyMarketPrice,
};

const PERIOD_MS = {
  "1d": 1*24*60*60*1000,
  "1w": 7*24*60*60*1000,
  "1m": 30*24*60*60*1000,
  "3m": 90*24*60*60*1000,
  "1y":365*24*60*60*1000,
  "3y":3*365*24*60*60*1000,
  all: Infinity,
};

// Format a JS Date → "D-M-YYYY" in IST
function formatDateKey(date) {
  return date
    .toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" })
    .replace(/\//g, "-")
    .replace(/\b0(\d)\b/g, "$1");
}

// Parse "DD-MM-YYYY" → Date
function parseDateString(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export async function GET(req) {
  try {
    await connectToMongo();

    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");
    const period = searchParams.get("period") || "1d";

    const Model = modelMap[symbol];
    if (!Model) {
      return NextResponse.json(
        { success: false, error: `Unknown symbol '${symbol}'` },
        { status: 400 }
      );
    }

    // 1) Determine “targetDateKey” for 1d
    const nowIstStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const nowIst    = new Date(nowIstStr);
    const todayKey  = formatDateKey(nowIst);
    // if before 09:15, roll back to yesterday
    const isBeforeOpen =
      nowIst.getHours() < 9 ||
      (nowIst.getHours() === 9 && nowIst.getMinutes() < 15);
    const targetDateKey = isBeforeOpen
      ? formatDateKey(new Date(nowIst.getTime() - 24*60*60*1000))
      : todayKey;

    // 2) sliding cutoff for non-1d periods
    const ms     = PERIOD_MS[period] ?? PERIOD_MS["1d"];
    const cutoff = ms === Infinity ? 0 : Date.now() - ms;
    const isOneDay = period === "1d";

    // 3) fetch all per-date docs
    const docs = await Model.find({}).sort({ date: 1 }).lean();

    // 4) filter & group
    const grouped = {};
    for (const doc of docs) {
      // normalize date field
      let docDate = typeof doc.date === "string"
        ? parseDateString(doc.date)
        : new Date(doc.date);
      const key = formatDateKey(docDate);

      if (isOneDay) {
        // only include targetDateKey
        if (key !== targetDateKey) continue;
      } else {
        // sliding-window
        if (docDate.getTime() < cutoff) continue;
      }

      grouped[key] = (grouped[key]||[]).concat(doc.data);
    }

    return NextResponse.json({ success: true, data: grouped });
  } catch (err) {
    console.error("[price route] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
