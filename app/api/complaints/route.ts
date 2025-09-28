import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Complaint from "@/lib/models/Complaint";
import User from "@/lib/models/User";
import { verifyTokenFromRequest } from "@/lib/auth";
import { complaintSchema, complaintUpdateSchema } from "@/lib/validations/complaint";
import Department from "@/lib/models/Department";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/complaints - Get all complaints
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = verifyTokenFromRequest(request);
    // console.log("user", user);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // console.log("category", category);
    

    // Build query based on user role
    let query: any = {};

    if (user.role === "citizen") {
      query.submittedBy = user.userId;
    } else if (user.role === "admin") {
      // query.assignedTo = user.userId;
      const findUser = await User.findById(user.userId);
      if (!findUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      // query.category = findUser.department;
      // console.log("findUser", findUser.department);
      const findCategory = await Department.findOne({ _id: findUser.department });
      if (!findCategory) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      query.category = findCategory.name;
      // console.log("findCategory", findCategory);
      
    }
    // Super admin can see all complaints

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // console.log("query", query);

    const complaints = await Complaint.find(query)
      .populate("submittedBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Complaint.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: complaints,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get complaints error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


// PATCH /api/complaints - Update complaint (status, assignedTo, etc.)
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const user = verifyTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateInput } = body || {};
    if (!id) {
      return NextResponse.json({ error: "Complaint id is required" }, { status: 400 });
    }

    // Validate allowed fields
    const parsed = complaintUpdateSchema.safeParse(updateInput);
    if (!parsed.success) {
      const message = parsed.error.errors.map(e => e.message).join(", ");
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Authorization: citizens cannot update; only admin or super-admin
    if (user.role !== "admin" && user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If admin, ensure the complaint belongs to their department (by category name)
    let scopeFilter: any = { _id: id };
    if (user.role === "admin") {
      const adminUser = await User.findById(user.userId).select("department");
      if (!adminUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      // Department is a ref; resolve to name as complaint.category stores the name (string enum)
      const dept = await Department.findById(adminUser.department).select("name");
      if (!dept) {
        return NextResponse.json({ error: "Department not found" }, { status: 404 });
      }
      scopeFilter.category = dept.name;
    }

    // Build atomic update (combine $set and optional $push for remark)
    const update: any = { $set: {} as any };
    if (parsed.data.status) update.$set.status = parsed.data.status;
    if (parsed.data.assignedTo) update.$set.assignedTo = parsed.data.assignedTo;
    if (parsed.data.department) update.$set.department = parsed.data.department;
    if (parsed.data.resolution) update.$set.resolution = parsed.data.resolution;
    if (parsed.data.resolutionDate) update.$set.resolutionDate = parsed.data.resolutionDate as any;
    if (parsed.data.remark) {
      const remarkEntry = `${new Date().toLocaleDateString()}: ${parsed.data.remark}`;
      update.$push = { remarks: remarkEntry };
    }

    // Clean up empty $set
    if (Object.keys(update.$set).length === 0) delete update.$set;

    const complaint = await Complaint.findOneAndUpdate(scopeFilter, update, { new: true })
      .populate("submittedBy", "name email")
      .populate("assignedTo", "name email");

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: complaint });
  } catch (error) {
    console.error("Update complaint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/complaints - Create new complaint
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = verifyTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    // Validate input with Zod
    const parse = complaintSchema.safeParse(body);
    if (!parse.success) {
      const message = parse.error.errors.map(e => e.message).join(", ");
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const { title, description, category, priority, location, coordinates, images } = parse.data;
 
    const complaint = new Complaint({
      title,
      description,
      category,
      priority,
      location,
      coordinates,
      images: images || [],
      remark: [],
      submittedBy: user.userId,
    });

    await complaint.save();

    // Populate the submittedBy field
    await complaint.populate("submittedBy", "name email");

    return NextResponse.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Create complaint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
