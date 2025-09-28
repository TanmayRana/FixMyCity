import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Department from "@/lib/models/Department";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    const departments = await Department.find({ isActive: true })
      .select({ _id: 1, name: 1 })
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error("Public departments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
