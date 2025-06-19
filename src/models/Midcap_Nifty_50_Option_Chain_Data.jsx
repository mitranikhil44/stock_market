import mongoose from "mongoose";

// Suppress warning
mongoose.set("strictQuery", true);

// Define Schema
const MidcapNifty50OptionChainSchema = new mongoose.Schema({
  timestamp: { type: String, required: true, unique: true },
  data: { type: Array, required: true },
});

// Compile Model
const Midcap_Nifty_50_Option_Chain_Data =
  mongoose.models.Midcap_Nifty_50_Option_Chain_Data ||
  mongoose.model("Midcap_Nifty_50_Option_Chain_Data", MidcapNifty50OptionChainSchema);

export default Midcap_Nifty_50_Option_Chain_Data;
