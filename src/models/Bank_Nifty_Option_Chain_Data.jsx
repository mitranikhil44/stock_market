import mongoose from "mongoose";

// Suppress the warning by setting strictQuery to true
mongoose.set("strictQuery", true);

// Define the BankNiftyOptionData schema
const BankNiftyOptionChainSchema = new mongoose.Schema({
  timestamp: { type: String, required: true, unique: true },
  data: { type: Array, required: true },
});

// Compile the schema into a model
const Bank_Nifty_Option_Chain_Data =
  mongoose.models.Bank_Nifty_Option_Chain_Data ||
  mongoose.model("Bank_Nifty_Option_Chain_Data", BankNiftyOptionChainSchema);

export default Bank_Nifty_Option_Chain_Data;
