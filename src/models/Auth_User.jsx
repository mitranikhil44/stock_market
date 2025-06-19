import mongoose from "mongoose";

mongoose.set("strictQuery", true);

const AuthUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, 
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: { type: Boolean, default: false },
});

// Check if the model is already defined before creating a new one
const User = mongoose.models.Users || mongoose.model("Users", AuthUserSchema);

export default User;
