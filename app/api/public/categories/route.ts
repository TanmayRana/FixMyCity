import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Department from "@/lib/models/Department";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    const departments = await Department.find({ isActive: true })
      .select({ categories: 1 })
      .lean();

    // console.log(departments);

    const set = new Set<string>();
    for (const d of departments) {
      if (Array.isArray(d.categories)) {
        for (const c of d.categories) {
          if (typeof c === "string" && c.trim()) set.add(c);
        }
      }
    }

    let categories = Array.from(set).sort((a, b) => a.localeCompare(b));
    if (categories.length === 0) {
      // Fallback to Complaint model enum when departments don't define categories
      categories = [
        "Public Works",
        "Water & Sewage",
        "Transportation",
        "Parks & Recreation",
        "Building & Safety",
        "Environmental Services",
        "Public Health",
        "Street Lighting",
        "Waste Management",
        "Traffic Management",
      ];
    }
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Public categories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
