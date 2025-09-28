import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/auth";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import Department from "@/lib/models/Department";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const verifyToken = (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      return verifyAccessToken(token) as any;
    } catch {}
  }
  // Fallback to refresh token cookie to identify user if access token missing/expired
  try {
    const refresh = cookies().get("refresh_token")?.value;
    if (!refresh) return null;
    return verifyRefreshToken(refresh) as any;
  } catch {
    return null;
  }
};

// POST /api/admins - Create a department admin
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = verifyToken(request);
    // console.log(user);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, email, password, department } = await request.json();
    // console.log(name, email, password, "department=", department);
    
    if (!name || !email || !password || !department) {
      return NextResponse.json(
        { error: "Name, email, password, and department are required" },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const dept = await Department.findOne({ name: department });
    if (!dept) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }
    const adminUser = new User({
      name,
      email,
      password: hashed,
      role: "admin",
      department:dept._id,
      isActive: true,
    });
    await adminUser.save();
    
    dept.members.push(adminUser._id);
    await dept.save();

    return NextResponse.json({
      success: true,
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        department: adminUser.department,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
