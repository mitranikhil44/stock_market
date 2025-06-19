import mongoose from "mongoose";

// Suppress the warning by setting strictQuery to true
mongoose.set("strictQuery", true);

// Define the BankNiftyMarketPrice schema
const BankNiftyMarketPriceSchema = new mongoose.Schema({
  timestamp: { type: String, required: true },
  price: { type: Number, required: true },
  volume: { type: Number, required: true },
});

// Check if the model already exists to prevent recompilation errors
const Bank_Nifty_Market_Price =
  mongoose.models.Bank_Nifty_Market_Price || mongoose.model("Bank_Nifty_Market_Price", BankNiftyMarketPriceSchema);

export default Bank_Nifty_Market_Price;
