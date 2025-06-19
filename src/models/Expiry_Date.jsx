import mongoose from 'mongoose';

const ExpiryDateSchema = new mongoose.Schema({
  indexName: {
    type: String,
    required: true,
    enum: ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'], 
  },
  expiryDate: {
    type: String, 
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.models.ExpiryDate || mongoose.model('ExpiryDate', ExpiryDateSchema);
