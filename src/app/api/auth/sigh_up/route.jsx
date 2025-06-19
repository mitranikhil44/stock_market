import { connectToMongo } from "@/lib/mongodb";
import User from "@/models/Auth_User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // ✅ Manual validation instead of express-validator
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    // Connect to MongoDB
    await connectToMongo();

    // Check if the user already exists in the database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "User already exists" }, { status: 400 });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user in the database
    const newUser = await User.create({ name, email, password: hashedPassword });

    // Generate a JWT token for the new user
    const token = jwt.sign({ id: newUser._id, isAdmin: newUser.isAdmin }, JWT_SECRET, { expiresIn: "1d" });

    return NextResponse.json({ success: true, authtoken: token });
  } catch (error) {
    console.error(error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
