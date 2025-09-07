import { connectToMongo } from "@/lib/mongodb";
import User from "@/models/Auth_User";
import Otp from "@/models/Otp";
import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // 🔹 Validation
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    await connectToMongo();

    // 🔹 Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "User already exists" }, { status: 400 });
    }

    // 🔹 OTP Generate
    const otp = crypto.randomInt(100000, 999999).toString();

    // Save OTP in DB (5 min expiry)
    await Otp.create({
      email,
      name,
      password, // plain password temporarily
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // 🔹 Brevo Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 🔹 Send Email
    await transporter.sendMail({
      from: `"MyApp" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Hello ${name},\n\nYour OTP is ${otp}. It will expire in 5 minutes.\n\nThank you!`,
    });

    return NextResponse.json({ success: true, message: "OTP sent to email" });

  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
