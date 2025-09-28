import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Department from "@/lib/models/Department";
import Complaint from "@/lib/models/Complaint";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/departments/test - Test endpoint to verify API functionality
export async function GET(request: NextRequest) {
  try {
    // console.log("🧪 Testing /api/departments endpoint");
    await connectDB();

    // Test database connection
    const departmentCount = await Department.countDocuments();
    const complaintCount = await Complaint.countDocuments();

    // Test department query
    const departments = await Department.find({ isActive: true })
      .populate("head", "name email")
      .limit(5)
      .lean();

    // Test dynamic category mapping
    const categoryToDeptMapping: Record<string, string> = {};
    for (const dept of departments) {
      if (dept.categories && Array.isArray(dept.categories)) {
        for (const category of dept.categories) {
          categoryToDeptMapping[category] = dept.name;
        }
      }
    }

    // Test complaint processing
    const allComplaints = await Complaint.find({}).lean();
    const processedComplaints = [];

    for (const complaint of allComplaints) {
      let departmentName = complaint.department;

      if (!departmentName && complaint.category) {
        departmentName = categoryToDeptMapping[complaint.category];

        if (!departmentName) {
          const matchingDept = departments.find(
            (dept) =>
              dept.name.toLowerCase().trim() ===
              complaint.category.toLowerCase().trim()
          );
          if (matchingDept) {
            departmentName = matchingDept.name;
          }
        }

        if (!departmentName) {
          departmentName = complaint.category;
        }
      }

      processedComplaints.push({
        id: complaint._id,
        title: complaint.title,
        category: complaint.category,
        department: complaint.department,
        mappedDepartment: departmentName,
        status: complaint.status,
      });
    }

    const testResults = {
      databaseConnection: "✅ Connected",
      departmentCount,
      complaintCount,
      sampleDepartments: departments,
      categoryToDeptMapping,
      processedComplaints,
      complaintStats: await Complaint.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      timestamp: new Date().toISOString(),
    };

    // console.log("🧪 Test results:", testResults);

    return NextResponse.json({
      success: true,
      message: "API test completed successfully",
      data: testResults,
    });
  } catch (error) {
    console.error("❌ API test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
