import React from 'react'
import updated_expiry_date from '@/components/functions/updated_expiry_date';
import ExpiryDateModel from '@/models/Expiry_Date';

const CheckAndUpdateExpiryDate = async (indexName) => {
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const currentDate = istNow.toISOString().split('T')[0];
  const currentTime = istNow.getHours() * 60 + istNow.getMinutes();
  const marketCloseTime = 15 * 60 + 30;

  let expiryData = await ExpiryDateModel.findOne({ indexName });

  if (!expiryData) {
    const newExpiry = await updated_expiry_date(indexName);
    expiryData = { expiryDate: newExpiry };
  }

  if (currentDate === expiryData.expiryDate && currentTime >= marketCloseTime) {
    console.log(`📌 ${indexName} market closing. Updating expiry date.`);
    const newExpiry = await updated_expiry_date(indexName);
    expiryData.expiryDate = newExpiry;
  }

  return expiryData;
};

export default CheckAndUpdateExpiryDate;