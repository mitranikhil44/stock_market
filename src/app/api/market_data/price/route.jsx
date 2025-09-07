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
  "1y": 365*24*60*60*1000,
  "3y": 3*365*24*60*60*1000,
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

// Returns last market day (skip Sat/Sun)
function getLastMarketDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (d.getDay() === 0) d.setDate(d.getDate() - 2); // Sunday → Friday
  else if (d.getDay() === 6) d.setDate(d.getDate() - 1); // Saturday → Friday
  return d;
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

    // 🔹 Determine target date for 1d period
    const nowIstStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const nowIst = new Date(nowIstStr);

    let candidate = new Date(nowIst);

    // If before market open (09:15), use previous day
    if (nowIst.getHours() < 9 || (nowIst.getHours() === 9 && nowIst.getMinutes() < 15)) {
      candidate.setDate(candidate.getDate() - 1);
    }

    // Adjust for weekends
    const lastMarketDay = getLastMarketDay(candidate);
    const targetDateKey = formatDateKey(lastMarketDay);

    // 🔹 Sliding cutoff for non-1d periods
    const ms = PERIOD_MS[period] ?? PERIOD_MS["1d"];
    const cutoff = ms === Infinity ? 0 : Date.now() - ms;
    const isOneDay = period === "1d";

    // 🔹 Fetch all documents
    const docs = await Model.find({}).sort({ date: 1 }).lean();

    // 🔹 Filter & group
    const grouped = {};
    for (const doc of docs) {
      let docDate = typeof doc.date === "string" ? parseDateString(doc.date) : new Date(doc.date);
      const key = formatDateKey(docDate);

      if (isOneDay) {
        if (key !== targetDateKey) continue;
      } else {
        if (docDate.getTime() < cutoff) continue;
      }

      grouped[key] = (grouped[key] || []).concat(doc.data);
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
