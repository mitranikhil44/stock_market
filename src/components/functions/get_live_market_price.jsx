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

    const nowIst = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    const istDate = new Date(nowIst);

    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, "0");
    const day = String(istDate.getDate()).padStart(2, "0");
    const dateStr = `${day}-${month}-${year}`;

    const timeStr = istDate.toTimeString().split(" ")[0]; // "HH:MM:SS"

    const existingDoc = await indexDatabase.findOne({ date: dateStr });

    const lastPrice = existingDoc?.data?.at(-1)?.price || 0;
    const volume = Math.max(0, livePrice - lastPrice);

    const newEntry = {
      timestamp: timeStr,
      price: livePrice,
      volume,
    };

    if (existingDoc) {
      existingDoc.data.push(newEntry);
      await existingDoc.save();
      return existingDoc;
    } else {
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
