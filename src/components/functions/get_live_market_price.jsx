import axios from "axios";
import * as cheerio from "cheerio";

// Generic function to get live index price from 5paisa
const getBankNiftyPrice = async (indexUrl) => {
  try {
    const response = await axios.get(`https://www.5paisa.com/share-market-today/${indexUrl}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
        Referer: "https://www.5paisa.com/",
      },
    });

    const $ = cheerio.load(response.data);
    const priceSpans = $("div.market--prc span");

    if (priceSpans.length >= 2) {
      const price =
        priceSpans.eq(0).text().trim() + priceSpans.eq(1).text().trim();
      const numericPrice = parseFloat(price.replace(/,/g, ""));

      if (!isNaN(numericPrice)) {
        return numericPrice;
      }
    }

    console.warn("⚠️ Finnifty data not found or invalid.");
    return 0;
  } catch (error) {
    console.error("❌ Error fetching Finnifty price:", error.message);
    return 0;
  }
};

export default async (indexUrl, indexDatabase) => {
  try {
    const livePrice = await getBankNiftyPrice(indexUrl);
    
    if (!livePrice || livePrice === 0) {
      console.warn("⚠️ Live price is invalid, skipping database update.");
      return null;
    }

    const lastMarketData = await indexDatabase.find().sort({ _id: -1 }).limit(1).exec();
    const lastPrice = lastMarketData.length > 0 ? parseFloat(lastMarketData[0].price) : 0;
    const newVolume = isNaN(lastPrice) ? 0 : Math.max(0, livePrice - lastPrice); // Ensure volume is valid

    const newMarketPrice = await indexDatabase.create({
      timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }),
      price: livePrice,
      volume: newVolume,
    });

    return newMarketPrice;
  } catch (error) {
    console.error('❌ Error updating Bank Nifty market price:', error);
    return null;
  }
};