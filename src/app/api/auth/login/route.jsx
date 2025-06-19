import { connectToMongo } from "@/lib/mongodb";
import User from "@/models/Auth_User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // ✅ Manual input validation instead of express-validator
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
    }

    // Connect to MongoDB
    await connectToMongo();

    // Check if user exists by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not registered. Please sign up." }, { status: 400 });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 400 });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: "1d" });

    return NextResponse.json({ success: true, authtoken: token });
  } catch (error) {
    console.error(error.message);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
