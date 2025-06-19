import axios from "axios";
import * as cheerio from "cheerio";
import ExpiryDateModel from '@/models/Expiry_Date';

// Generic function to get live index price from 5paisa
export default async (indexUrl) => {
    try {
        let expiryData = await ExpiryDateModel.findOne({ indexName: indexUrl });
    
        const result = await axios.get(`https://www.moneycontrol.com/indices/fno/view-option-chain/${indexUrl}/${expiryData.expiryDate}`, {
          headers: { 
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.moneycontrol.com/'
          }
        });
        
        const $ = cheerio.load(response.data);
        const expiryDate = $( $('#sel_exp_date option').get(1) ).attr('value');
    
        if (!expiryDate) {
          console.error("❌ Failed to fetch expiry date.");
          return null;
        }
        
        await ExpiryDateModel.findOneAndUpdate(
          { indexName: indexUrl },
          { expiryDate },
          { upsert: true, new: true }
        );    
        
        return expiryDate;
      } catch (error) {
        console.error("❌ Error updating expiry date:", error);
        return null;
      }
};
