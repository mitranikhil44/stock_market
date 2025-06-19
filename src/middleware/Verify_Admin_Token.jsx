import jwt from "jsonwebtoken";
import { connectToMongo } from "@/lib/mongodb";
import User from "@/models/Auth_User";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;

export async function verifyAdminUser(req) {
  try {
    // 🔹 Get the token from the headers
    const token = req.headers.get("Authorization");

    if (!token) {
      return NextResponse.json({ success: false, error: "Access denied. No token provided." }, { status: 401 });
    }

    // 🔹 Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.id) {
      return NextResponse.json({ success: false, error: "Invalid token." }, { status: 401 });
    }

    // 🔹 Connect to the database
    await connectToMongo();

    // 🔹 Fetch the user from the database
    const user = await User.findById(decoded.id);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ success: false, error: "Access denied. Admins only." }, { status: 403 });
    }

    // ✅ If user is admin, return success
    return null;
  } catch (error) {
    console.error("Auth Error:", error.message);
    return NextResponse.json({ success: false, error: "Invalid or expired token." }, { status: 401 });
  }
}
