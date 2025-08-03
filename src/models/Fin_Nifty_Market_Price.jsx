import mongoose from "mongoose";

// Suppress the warning by setting strictQuery to true
mongoose.set("strictQuery", true);

const EntrySchema = new mongoose.Schema({
  timestamp: { type: String, required: true },
  price: { type: Number, required: true },
  volume: { type: Number, required: true },
}, { _id: false });

// Define the FinNiftyMarketPrice schema
const FinNiftyMarketPriceSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true }, 
  data: [EntrySchema],
});
// Prevent recompilation issues during development
const Fin_Nifty_Market_Price =
  mongoose.models.Fin_Nifty_Market_Price ||
  mongoose.model("Fin_Nifty_Market_Price", FinNiftyMarketPriceSchema);

export default Fin_Nifty_Market_Price;
