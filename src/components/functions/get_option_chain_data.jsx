import axios from "axios";
import * as cheerio from "cheerio";
import ExpiryDateModel from '@/models/Expiry_Date';
import updated_expiry_date from './updated_expiry_date';

// Function to fetch Nifty option chain data
export default async (indexUrl, indexDatabase) => {
    try {
      let expiryData = await ExpiryDateModel.findOne({ indexName: indexUrl });
      if (!expiryData) {
        expiryData = { expiryDate: await updated_expiry_date(indexUrl) };
      }
  
      const result = await axios.get(`https://www.moneycontrol.com/indices/fno/view-option-chain/${indexUrl}/${expiryData.expiryDate}`, {
        headers: { 
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://www.moneycontrol.com/'
        }
      });
  
      const $ = cheerio.load(result.data);
      const tableRows = $('.table_optionchain table tbody tr');
  
      // Extract option data
      const optionData = tableRows.map((i, element) => {
        const cells = $(element).find('td');
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
      }).get();
  
      const scrapedData = {
        timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }),
        data: optionData
      };
  
      if (!optionData.length) {
        console.log("⚠️ No data found. Skipping insert.");
        return null;
      }
  
      const existingData = await indexDatabase.findOne({ timestamp: scrapedData.timestamp });
      if (existingData) {
        console.log("⚠️ Duplicate data detected. Skipping insert.");
        return existingData;
      }
  
      const savedData = await indexDatabase.create(scrapedData);
      return savedData;
    } catch (error) {
      console.error("❌ Error fetching Nifty option chain data:", error);
      return null;
    }
  };