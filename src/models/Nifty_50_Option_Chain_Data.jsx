import mongoose from "mongoose";

// Suppress warning
mongoose.set("strictQuery", true);

// Define Schema
const Nifty50OptionChainSchema = new mongoose.Schema({
  timestamp: { type: String, required: true, unique: true },
  data: { type: Array, required: true },
});

// Compile Model
const Nifty_50_Option_Chain_Data =
  mongoose.models.Nifty_50_Option_Chain_Data ||
  mongoose.model("Nifty_50_Option_Chain_Data", Nifty50OptionChainSchema);

export default Nifty_50_Option_Chain_Data;
