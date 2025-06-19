import mongoose from "mongoose";

// Suppress the warning by setting strictQuery to true
mongoose.set("strictQuery", true);

// Define the NiftyMarketPrice schema
const MidcapNifty50MarketPriceSchema = new mongoose.Schema({
  timestamp: { type: String, required: true },
  price: { type: Number, required: true },
  volume: { type: Number, required: true },
});

// Prevent recompilation issues in Next.js hot reloading
const Midcap_Nifty_50_Market_Price =
  mongoose.models.Midcap_Nifty_50_Market_Price ||
  mongoose.model("Midcap_Nifty_50_Market_Price", MidcapNifty50MarketPriceSchema);

export default Midcap_Nifty_50_Market_Price;
