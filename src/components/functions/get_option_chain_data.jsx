import axios from "axios";
import * as cheerio from "cheerio";
import ExpiryDateModel from "@/models/Expiry_Date";
import updated_expiry_date from "./updated_expiry_date";

// Function to fetch Option Chain data
export default async (indexUrl, indexDatabase) => {
  try {
    // 🔹 Get expiry from DB or scrape it
    let expiryData = await ExpiryDateModel.findOne({ indexName: indexUrl });
    if (!expiryData) {
      expiryData = { expiryDate: await updated_expiry_date(indexUrl) };
    }

    // 🔹 Fetch page using expiry from DB
    const result = await axios.get(
      `https://www.moneycontrol.com/indices/fno/view-option-chain/${indexUrl}/${expiryData.expiryDate}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Referer: "https://www.moneycontrol.com/",
        },
      }
    );

    const $ = cheerio.load(result.data);

    // 🔹 Find the latest expiry date from dropdown
    const newExpiry = $("#sel_exp_date option").first().attr("value");

    // 🔹 Check expiry mismatch
    const isUpdated = expiryData?.expiryDate !== newExpiry;

    if (isUpdated) {
      // Update expiry in DB but skip saving option chain this time
      await ExpiryDateModel.findOneAndUpdate(
        { indexName: indexUrl },
        { expiryDate: newExpiry, lastUpdated: new Date() },
        { upsert: true }
      );

      console.log(`🔄 ${indexUrl}: Expiry updated → ${newExpiry}`);
      console.log(`⚠️ Skipping option chain save because expiry just updated.`);
      return null;
    }

    // 🔹 If expiry is already valid, parse option chain table
    const tableRows = $(".table_optionchain table tbody tr");

    const optionData = tableRows
      .map((i, element) => {
        const cells = $(element).find("td");
        return {
          CallOI: cells.eq(0).text().trim(),
          CallChgOI: cells.eq(1).text().trim(),
          CallVol: cells.eq(2).text().trim(),
          CallChgLTP: cells.eq(3).text().trim(),
          CallLTP: cells.eq(4).text().trim(),
          StrikePrice: cells.eq(5).text().trim(),
          PutLTP: cells.eq(6).text().trim(),
          PutChgLTP: cells.eq(7).text().trim(),
          PutVol: cells.eq(8).text().trim(),
          PutChgOI: cells.eq(9).text().trim(),
          PutOI: cells.eq(10).text().trim(),
        };
      })
      .get();

    if (!optionData.length) {
      console.log(`⚠️ ${indexUrl}: No option chain data found (maybe holiday/invalid expiry).`);
      return null;
    }

    // 🔹 Prepare final object
    const scrapedData = {
      timestamp: new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
      data: optionData,
    };

    // 🔹 Avoid duplicate inserts
    const existingData = await indexDatabase.findOne({
      timestamp: scrapedData.timestamp,
    });
    if (existingData) {
      console.log(`⚠️ ${indexUrl}: Duplicate data detected. Skipping insert.`);
      return existingData;
    }

    // 🔹 Save to DB
    const savedData = await indexDatabase.create(scrapedData);
    console.log(`✅ ${indexUrl}: Option chain data saved → ${scrapedData.timestamp}`);
    return savedData;

  } catch (error) {
    console.error(`❌ Error fetching option chain for ${indexUrl}:`, error.message);
    return null;
  }
};
