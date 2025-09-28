import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import {
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, password, role, phone, address } =
      await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      address,
    });

    await user.save();

    // Issue access and refresh tokens
    const accessToken = signAccessToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
      department: user.department,
    });
    const refreshToken = signRefreshToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });
    setRefreshCookie(refreshToken);

    // Return user data without password
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      address: user.address,
    };

    return NextResponse.json({
      success: true,
      token: accessToken,
      user: userData,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
