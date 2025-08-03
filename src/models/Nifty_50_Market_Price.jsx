import mongoose from "mongoose";
mongoose.set("strictQuery", true);

const EntrySchema = new mongoose.Schema({
  timestamp: { type: String, required: true },
  price: { type: Number, required: true },
  volume: { type: Number, required: true },
}, { _id: false });

const Nifty50MarketPrice = new mongoose.Schema({
  date: { type: String, required: true, index: true }, 
  data: [EntrySchema],
});

// Use the same model name across Nifty, BankNifty, etc.
const Nifty_50_Market_Price =
  mongoose.models.Nifty_50_Market_Price ||
  mongoose.model("Nifty_50_Market_Price", Nifty50MarketPrice);

export default Nifty_50_Market_Price;
