import mongoose from "mongoose";

// Suppress the warning by setting strictQuery to true
mongoose.set("strictQuery", true);

// Define the FinNiftyOptionData schema
const FinNiftyOptionChainSchema = new mongoose.Schema({
  timestamp: { type: String, required: true, unique: true },
  data: { type: Array, required: true },
});

// Compile the schema into a model
const Fin_Nifty_Option_Chain_Data =
  mongoose.models.Fin_Nifty_Option_Chain_Data ||
  mongoose.model("Fin_Nifty_Option_Chain_Data", FinNiftyOptionChainSchema);

export default Fin_Nifty_Option_Chain_Data;
