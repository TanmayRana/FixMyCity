import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Complaint from "@/lib/models/Complaint";
import User from "@/lib/models/User";
import Department from "@/lib/models/Department";
import { verifyTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = verifyTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let stats: any = {};

    if (user.role === "citizen") {
      // Citizen stats
      const totalComplaints = await Complaint.countDocuments({
        submittedBy: user.userId,
      });
      const inProgressComplaints = await Complaint.countDocuments({
        submittedBy: user.userId,
        status: "in-progress",
      });
      const resolvedComplaints = await Complaint.countDocuments({
        submittedBy: user.userId,
        status: "resolved",
      });
      const pendingComplaints = await Complaint.countDocuments({
        submittedBy: user.userId,
        status: "submitted",
      });

      stats = {
        totalComplaints,
        inProgressComplaints,
        resolvedComplaints,
        pendingComplaints,
        successRate:
          totalComplaints > 0
            ? Math.round((resolvedComplaints / totalComplaints) * 100)
            : 0,
      };
    } else if (user.role === "admin") {
      // Admin stats
      const totalComplaints = await Complaint.countDocuments({
        assignedTo: user.userId,
      });
      const inProgressComplaints = await Complaint.countDocuments({
        assignedTo: user.userId,
        status: "in-progress",
      });
      const resolvedComplaints = await Complaint.countDocuments({
        assignedTo: user.userId,
        status: "resolved",
      });
      const pendingComplaints = await Complaint.countDocuments({
        assignedTo: user.userId,
        status: "submitted",
      });

      stats = {
        totalComplaints,
        inProgressComplaints,
        resolvedComplaints,
        pendingComplaints,
        resolutionRate:
          totalComplaints > 0
            ? Math.round((resolvedComplaints / totalComplaints) * 100)
            : 0,
      };
    } else if (user.role === "super-admin") {
      // Super admin stats
      const totalComplaints = await Complaint.countDocuments();
      const totalUsers = await User.countDocuments({ isActive: true });
      const totalDepartments = await Department.countDocuments({
        isActive: true,
      });

      const complaintsByStatus = await Complaint.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const complaintsByPriority = await Complaint.aggregate([
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]);

      const complaintsByCategory = await Complaint.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]);

      const recentComplaints = await Complaint.find()
        .populate("submittedBy", "name email")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .limit(5);

      stats = {
        totalComplaints,
        totalUsers,
        totalDepartments,
        complaintsByStatus: complaintsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        complaintsByPriority: complaintsByPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        complaintsByCategory: complaintsByCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentComplaints,
      };
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
