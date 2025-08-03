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
      const priceText = spans.eq(0).text().trim() + spans.eq(1).text().trim();
      const price = parseFloat(priceText.replace(/,/g, ""));
      return isNaN(price) ? 0 : price;
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

    const nowIST = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const current = new Date(nowIST);

    const dateStr = current.toISOString().split("T")[0]; // "2025-08-03"
    const timeStr = current.toLocaleTimeString("en-US", {
      hour12: false,
      timeZone: "Asia/Kolkata",
    }); // "09:15:00"

    // Find existing doc for this date
    const existingDoc = await indexDatabase.findOne({ date: dateStr });

    const lastPrice = existingDoc?.data?.at(-1)?.price || 0;
    const volume = Math.max(0, livePrice - lastPrice);

    const newEntry = { timestamp: timeStr, price: livePrice, volume };
    const latestDoc = await indexDatabase.findOne().sort({ date: -1 });

    if (latestDoc) {
      // Push new entry to existing document
      latestDoc.data.push(newEntry);
      await latestDoc.save();
      return latestDoc;
    } else {
      // Create new document for today's date
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
