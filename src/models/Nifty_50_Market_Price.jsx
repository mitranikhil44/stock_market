import mongoose from "mongoose";

// Suppress the warning by setting strictQuery to true
mongoose.set("strictQuery", true);

// Define the NiftyMarketPrice schema
const Nifty50MarketPriceSchema = new mongoose.Schema({
  timestamp: { type: String, required: true },
  price: { type: Number, required: true },
  volume: { type: Number, required: true },
});

// Prevent recompilation issues in Next.js hot reloading
const Nifty_50_Market_Price =
  mongoose.models.Nifty_50_Market_Price ||
  mongoose.model("Nifty_50_Market_Price", Nifty50MarketPriceSchema);

export default Nifty_50_Market_Price;
