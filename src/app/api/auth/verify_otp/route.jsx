import { connectToMongo } from "@/lib/mongodb";
import User from "@/models/Auth_User";
import Otp from "@/models/Otp";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: "Email and OTP are required" }, { status: 400 });
    }

    await connectToMongo();

    // 🔹 Find OTP entry
    const otpEntry = await Otp.findOne({ email, otp });
    if (!otpEntry) {
      return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 });
    }

    if (otpEntry.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: "OTP expired" }, { status: 400 });
    }

    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(otpEntry.password, 10);

    // 🔹 Create user
    const newUser = await User.create({
      name: otpEntry.name,
      email: otpEntry.email,
      password: hashedPassword,
    });

    // 🔹 Delete OTP entry
    await Otp.deleteOne({ _id: otpEntry._id });

    // 🔹 JWT Token
    const token = jwt.sign({ id: newUser._id, isAdmin: newUser.isAdmin }, JWT_SECRET, { expiresIn: "1d" });

    return NextResponse.json({ success: true, authtoken: token });

  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
