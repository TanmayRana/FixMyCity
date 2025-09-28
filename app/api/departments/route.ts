import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Department from "@/lib/models/Department";
import Complaint from "@/lib/models/Complaint";
import User from "@/lib/models/User";
import { verifyAccessToken } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Middleware to verify JWT token
const verifyToken = (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    return verifyAccessToken(token) as any;
  } catch {
    return null;
  }
};

// GET /api/departments - Get all departments
export async function GET(request: NextRequest) {
  try {
    // console.log("🏢 GET /api/departments - Starting request");
    await connectDB();

    const user = verifyToken(request);
    // console.log(
    //   "🔐 User verification:",
    //   user ? { role: user.role, userId: user.userId } : "No user"
    // );

    if (!user) {
      // console.log("❌ Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super admin can view all departments
    if (user.role !== "super-admin") {
      // console.log("❌ Forbidden access - user role:", user.role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // console.log("📋 Fetching departments from database");
    const departments = await Department.find({ isActive: true })
      .populate("head", "name email")
      .populate("members", "name email")
      .sort({ name: 1 })
      .lean();

    // console.log("📊 Found departments:", departments.length);

    if (departments.length === 0) {
      // console.log("⚠️ No departments found");
      return NextResponse.json({
        success: true,
        data: [],
        message: "No departments found",
      });
    }

    const deptNames = departments.map((d: any) => d.name);
    // console.log("🏷️ Department names:", deptNames);

    // First, let's check what department values exist in complaints
    // console.log("🔍 Checking all unique department values in complaints...");
    const allDeptValues = await Complaint.distinct("department");
    // console.log("📋 All department values in complaints:", allDeptValues);

    // Check if there are any complaints at all
    const totalComplaints = await Complaint.countDocuments();
    // console.log("📊 Total complaints in database:", totalComplaints);

    // Log if no complaints exist (for debugging)
    if (totalComplaints === 0) {
      console.log(
        "⚠️ No complaints found in database. Statistics will show zeros."
      );
    }

    // Create dynamic mapping of categories to departments based on department categories
    const categoryToDeptMapping: Record<string, string> = {};

    // Build mapping from department categories
    for (const dept of departments) {
      if (dept.categories && Array.isArray(dept.categories)) {
        for (const category of dept.categories) {
          categoryToDeptMapping[category] = dept.name;
        }
      }
    }

    // console.log(
    //   "🔄 Dynamic category to department mapping:",
    //   categoryToDeptMapping
    // );

    // console.log("📈 Fetching complaint counts for departments");

    // Get all complaints and map them to departments
    const allComplaints = await Complaint.find({}).lean();
    // console.log("📊 All complaints found:", allComplaints.length);

    if (allComplaints.length === 0) {
      console.log("⚠️ No complaints found in database");
    }

    // Process complaints and map to departments
    const counts: any[] = [];
    const complaintStats: Record<
      string,
      { total: number; resolved: number; pending: number }
    > = {};

    for (const complaint of allComplaints) {
      try {
        let departmentName = complaint.department;

        // If no department field, try to map from category
        if (!departmentName && complaint.category) {
          // First try direct mapping from department categories
          departmentName = categoryToDeptMapping[complaint.category];

          // If no direct mapping, try to match category name with department name
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

          // If still no match, use the category name as department name
          if (!departmentName) {
            departmentName = complaint.category;
          }

          console.log(
            `🔄 Mapped complaint category "${complaint.category}" to department "${departmentName}"`
          );
        }

        // Only count if department name matches one of our departments
        if (departmentName && deptNames.includes(departmentName)) {
          if (!complaintStats[departmentName]) {
            complaintStats[departmentName] = {
              total: 0,
              resolved: 0,
              pending: 0,
            };
          }

          complaintStats[departmentName].total++;

          if (
            complaint.status === "resolved" ||
            complaint.status === "closed"
          ) {
            complaintStats[departmentName].resolved++;
          }

          if (
            complaint.status === "submitted" ||
            complaint.status === "in-progress"
          ) {
            complaintStats[departmentName].pending++;
          }

          // Add to counts array for compatibility
          const existingCount = counts.find(
            (c) =>
              c._id.dept === departmentName && c._id.status === complaint.status
          );

          if (existingCount) {
            existingCount.count++;
          } else {
            counts.push({
              _id: { dept: departmentName, status: complaint.status },
              count: 1,
            });
          }
        } else {
          console.log(
            `⚠️ Complaint "${complaint.title}" not mapped to any department. Department: "${departmentName}", Category: "${complaint.category}"`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error processing complaint "${complaint.title}":`,
          error
        );
      }
    }

    // console.log("📊 Processed complaint statistics:", complaintStats);
    // console.log("📊 Complaint counts by department and status:", counts);

    // Use the processed complaint statistics
    const byDept = complaintStats;
    // console.log("📋 Final department statistics:", byDept);

    const data = departments.map((d: any) => {
      // Try exact match first
      let deptStats = byDept[d.name] || { total: 0, resolved: 0, pending: 0 };

      // If no exact match, try case-insensitive match
      if (deptStats.total === 0) {
        const matchingKey = Object.keys(byDept).find(
          (key) => key.toLowerCase().trim() === d.name.toLowerCase().trim()
        );
        if (matchingKey) {
          deptStats = byDept[matchingKey];
          console.log(
            `🔄 Found case-insensitive match for "${d.name}": "${matchingKey}"`
          );
        }
      }

      // console.log(`📊 Department "${d.name}" stats:`, deptStats);

      return {
        _id: d._id,
        name: d.name,
        description: d.description,
        head: d.head,
        members: d.members || [],
        categories: d.categories || [],
        isActive: d.isActive,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        totalComplaints: deptStats.total,
        resolvedComplaints: deptStats.resolved,
        pendingComplaints: deptStats.pending,
      };
    });

    // console.log(
    //   "✅ Successfully processed departments data:",
    //   data.length,
    //   "departments"
    // );
    // console.log("📊 Final data sample:", data[0] || "No data");

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      metadata: {
        totalComplaintsInDB: totalComplaints,
        departmentNamesInDB: deptNames,
        complaintDepartmentValues: allDeptValues,
        processedComplaints: Object.keys(complaintStats).length,
        categoryToDeptMapping: categoryToDeptMapping,
        departmentCategories: departments.map((d) => ({
          name: d.name,
          categories: d.categories || [],
        })),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Get departments error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST /api/departments - Create new department
export async function POST(request: NextRequest) {
  try {
    // console.log("🏢 POST /api/departments - Creating new department");
    await connectDB();

    const user = verifyToken(request);
    // console.log(
    //   "🔐 User verification:",
    //   user ? { role: user.role, userId: user.userId } : "No user"
    // );

    if (!user) {
      console.log("❌ Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super admin can create departments
    if (user.role !== "super-admin") {
      console.log("❌ Forbidden access - user role:", user.role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, head, members, categories } =
      await request.json();
    // console.log("📝 Department data received:", {
    //   name,
    //   description,
    //   head,
    //   members,
    //   categories,
    // });

    // Validation
    if (!name || !description || !head) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Name, description, and head are required" },
        { status: 400 }
      );
    }

    // Check if department already exists
    // console.log("🔍 Checking if department already exists:", name);
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      console.log("❌ Department already exists:", name);
      return NextResponse.json(
        { error: "Department with this name already exists" },
        { status: 409 }
      );
    }

    // Verify head user exists and is an admin
    // console.log("👤 Verifying head user:", head);
    const headUser = await User.findById(head);
    if (!headUser || headUser.role !== "admin") {
      console.log(
        "❌ Invalid head user:",
        headUser ? headUser.role : "User not found"
      );
      return NextResponse.json(
        { error: "Head must be an admin user" },
        { status: 400 }
      );
    }

    // console.log("✅ Creating new department");
    const department = new Department({
      name: name.trim(),
      description: description.trim(),
      head,
      members: members || [],
      categories: categories || [],
    });

    await department.save();
    // console.log("💾 Department saved with ID:", department._id);

    // Update head user's department
    await User.findByIdAndUpdate(head, { department: department._id });
    // console.log("👤 Updated head user's department reference");

    await department.populate("head", "name email");
    await department.populate("members", "name email");
    // console.log("🔗 Populated department references");

    const responseData = {
      _id: department._id,
      name: department.name,
      description: department.description,
      head: department.head,
      members: department.members,
      categories: department.categories,
      isActive: department.isActive,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
      totalComplaints: 0,
      resolvedComplaints: 0,
      pendingComplaints: 0,
    };

    // console.log("✅ Department created successfully:", responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
      message: "Department created successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Create department error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
