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

    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      );
    }

    // Find user by email and role
    const user = await User.findOne({ email, role, isActive: true });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
