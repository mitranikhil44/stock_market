import axios from "axios";
import * as cheerio from "cheerio";

const getLivePrice = async (indexUrl) => {
  try {
    const res = await axios.get(
      `https://www.5paisa.com/share-market-today/${indexUrl}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
          Referer: "https://www.5paisa.com/",
        },
      }
    );
    const $ = cheerio.load(res.data);
    const spans = $("div.market--prc span");
    if (spans.length >= 2) {
      const txt = spans.eq(0).text().trim() + spans.eq(1).text().trim();
      const num = parseFloat(txt.replace(/,/g, ""));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  } catch (err) {
    console.error("Scraping error:", err.message);
    return 0;
  }
};

export default async function scalpGroupedMarketPrice(indexUrl, indexDatabase) {
  try {
    const livePrice = await getLivePrice(indexUrl);
    if (!livePrice) return null;

    // 1) Compute “now” in IST by adding UTC+5:30
    const nowUtcMs   = Date.now();
    const istOffset  = 5.5 * 60 * 60 * 1000;
    const nowIst     = new Date(nowUtcMs + istOffset);

    // 2) Build a YYYY-MM-DD string for the date field
    const year  = nowIst.getFullYear();
    const month = String(nowIst.getMonth() + 1).padStart(2, "0");
    const day   = String(nowIst.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;  

    // 3) Build the timestamp string for this entry
    const timeStr = nowIst.toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata",
      hour12:   false,
    }); // e.g. "15:30:00"

    // 4) Look for today’s document
    let existingDoc = await indexDatabase.findOne({ date: dateStr });

    // 5) Compute volume based on the last price in today's data (if any)
    const lastPrice = existingDoc?.data?.at(-1)?.price || 0;
    const volume    = Math.max(0, livePrice - lastPrice);

    const newEntry = { timestamp: timeStr, price: livePrice, volume };

    if (existingDoc) {
      // 6a) Append to today’s existing doc
      existingDoc.data.push(newEntry);
      await existingDoc.save();
      return existingDoc;
    } else {
      // 6b) Create a new doc for today
      const newDoc = await indexDatabase.create({
        date: dateStr,
        data: [newEntry],
      });
      return newDoc;
    }
  } catch (err) {
    console.error("Scalping DB error:", err);
    return null;
  }
}
