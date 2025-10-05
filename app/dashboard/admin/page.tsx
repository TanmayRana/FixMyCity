"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/navbar";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Camera,
  User,
  Calendar,
  MessageSquare,
  Eye,
  Edit,
  Bell,
  BarChart3,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { apiClient, ApiClientError } from "@/lib/apiClient";

interface Complaint {
  id: string;
  title: string;
  category: string;
  status: "new" | "in-progress" | "resolved";
  priority: "low" | "medium" | "high" | "critical";
  submittedDate: string;
  citizenName: string;
  citizenEmail: string;
  citizenPhone: string;
  location: string;
  description: string;
  photos: string[];
  remarks: string[];
  assignedTo?: string;
  estimatedResolution?: string;
}

interface DepartmentStats {
  totalComplaints: number;
  newComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  avgResolutionTime: number;
}

export default function DepartmentAdminDashboard() {
  const [userName, setUserName] = useState("Admin");
  const [userDepartment, setUserDepartment] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newRemark, setNewRemark] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const [departmentStats, setDepartmentStats] = useState<DepartmentStats>({
    totalComplaints: 0,
    newComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    avgResolutionTime: 0,
  });

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Helper to detect if a string looks like a Mongo ObjectId
  const isLikelyObjectId = (val?: string | null) => !!val && /^[a-fA-F0-9]{24}$/.test(val);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("📊 Admin Dashboard - Fetching data...");

      const res = await apiClient.get("/api/complaints?limit=100");
      const json = await res.json();
      console.log("📊 Admin Dashboard - Complaints API Response:", json);

      const list = (json.data || []).map((c: any) => ({
        id: c._id,
        title: c.title,
        category: c.category,
        status: (c.status === "submitted" ? "new" : c.status) as any,
        priority: c.priority,
        submittedDate: new Date(c.createdAt).toISOString().slice(0, 10),
        citizenName: c.submittedBy?.name || "Citizen",
        citizenEmail: c.submittedBy?.email || "",
        citizenPhone: "",
        location: c.location,
        description: c.description,
        photos: c.images || [],
        remarks: c.remarks || [],
        assignedTo: c.assignedTo?.name || "",
        estimatedResolution: c.resolutionDate
          ? new Date(c.resolutionDate).toISOString().slice(0, 10)
          : "",
      }));

      console.log("📊 Admin Dashboard - Processed complaints:", list.length);
      setComplaints(list);

      // Derive department name from complaints (category) if available
      const deptName = list[0]?.category || "";
      if (deptName) {
        setUserDepartment((prev) => {
          // If current value looks like an ObjectId or is empty, replace it with readable name
          if (!prev || isLikelyObjectId(prev)) return deptName;
          return prev;
        });
      }

      // Calculate dynamic statistics
      const total = list.length;
      const newCount = list.filter(
        (c: Complaint) => c.status === "new"
      ).length;
      const inProg = list.filter(
        (c: Complaint) => c.status === "in-progress"
      ).length;
      const resolved = list.filter(
        (c: Complaint) => c.status === "resolved"
      ).length;

      // Calculate average resolution time
      const resolvedComplaints = list.filter(
        (c: Complaint) => c.status === "resolved"
      );
      let avgResolutionTime = 0;
      if (resolvedComplaints.length > 0) {
        const totalDays = resolvedComplaints.reduce(
          (sum: number, c: Complaint) => {
            const submitted = new Date(c.submittedDate);
            const resolved = new Date(
              c.estimatedResolution || c.submittedDate
            );
            return (
              sum +
              Math.ceil(
                (resolved.getTime() - submitted.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );
          },
          0
        );
        avgResolutionTime = Math.round(totalDays / resolvedComplaints.length);
      }

      const stats = {
        totalComplaints: total,
        newComplaints: newCount,
        inProgressComplaints: inProg,
        resolvedComplaints: resolved,
        avgResolutionTime: avgResolutionTime,
      };

      console.log("📊 Admin Dashboard - Calculated statistics:", stats);
      setDepartmentStats(stats);
    } catch (error) {
      console.error("❌ Admin Dashboard - Error:", error);
      
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          toast.error("Session expired. Please log in again.");
        } else if (error.status >= 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error(error.message || "Failed to load complaints");
        }
      } else {
        toast.error("Network error. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  const didFetchRef = useRef(false);

  useEffect(() => {
    // Initialize identity from localStorage
    try {
      const storedName = localStorage.getItem('userName');
      const storedDept = localStorage.getItem('userDepartment');
      if (storedName) setUserName(storedName);
      if (storedDept) {
        setUserDepartment((prev) => {
          // Allow later overwrite if this is an ObjectId; keep if it's already a readable name
          if (!prev) return storedDept;
          return prev;
        });
      }
    } catch {}
    // Ensure one-time fetch, even under React StrictMode double effect calling
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "critical":
        return "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Bell className="h-4 w-4" />;
      case "in-progress":
        return <Clock className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setIsDetailsOpen(true);
  };

  const  handleUpdateStatus = () => {
    if (!selectedComplaint || !newStatus) return;

    (async () => {
      try {
        const res = await apiClient.patch(
          "/api/complaints",
          { id: selectedComplaint.id, status: newStatus },
        );
        console.log("res", res);

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Failed to update" }));
          throw new ApiClientError(err.error || "Failed to update complaint", res.status);
        }

        const json = await res.json();
        const updated = json.data;

        // Update local list
        setComplaints((prev) =>
          prev.map((c) => (c.id === selectedComplaint.id ? { ...c, status: updated.status as any } : c))
        );
        toast.success("Complaint status updated successfully");
        setIsDetailsOpen(false);
      } catch (error) {
        if (error instanceof ApiClientError) {
          toast.error(error.message);
        } else {
          toast.error("An error occurred while updating the complaint");
        }
      }
    })();
  };

  const handleAddRemark = () => {
    if (!selectedComplaint || !newRemark.trim()) return;

    (async () => {
      try {
        const res = await apiClient.patch(
          "/api/complaints",
          { id: selectedComplaint.id, remark: newRemark.trim() },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Failed to add remark" }));
          throw new ApiClientError(err.error || "Failed to add remark", res.status);
        }

        const json = await res.json();
        const updated = json.data;

        // Update local list and selectedComplaint from server result
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === selectedComplaint.id
              ? { ...c, remarks: updated.remarks || [] }
              : c
          )
        );
        setSelectedComplaint((prev) =>
          prev ? { ...prev, remarks: updated.remarks || [] } : prev
        );
        setNewRemark("");
        toast.success("Remark added successfully");
      } catch (error) {
        if (error instanceof ApiClientError) {
          toast.error(error.message);
        } else {
          toast.error("An error occurred while adding the remark");
        }
      }
    })();
  };


  

  const filterComplaintsByStatus = (status: string) => {
    if (status === "all") return complaints;
    return complaints.filter((c) => c.status === status);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar userName={userName} userRole="admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {userDepartment} Department
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Complaint management and resolution dashboard
              </p>
              {lastUpdated && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <Button
              onClick={fetchDashboardData}
              variant="outline"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <BarChart3
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>{isLoading ? "Refreshing..." : "Refresh Data"}</span>
            </Button>
          </div>
        </div>

        {/* Department Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {isLoading ? (
                      <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                    ) : (
                      departmentStats.totalComplaints
                    )}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    New
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {isLoading ? (
                      <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                    ) : (
                      departmentStats.newComplaints
                    )}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {isLoading ? (
                      <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                    ) : (
                      departmentStats.inProgressComplaints
                    )}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Resolved
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {isLoading ? (
                      <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                    ) : (
                      departmentStats.resolvedComplaints
                    )}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Avg Resolution
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {isLoading ? (
                      <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                    ) : (
                      `${departmentStats.avgResolutionTime}d`
                    )}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Status Indicator */}
        {/* <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500"
              }`}
            ></div>
            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              {isLoading ? "Loading Data..." : "Live Data"}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              • Auto-refreshes every 30 seconds
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              • Dynamic statistics
            </span>
            {lastUpdated && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                • Last sync: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div> */}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="new">
              New ({departmentStats.newComplaints})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({departmentStats.inProgressComplaints})
            </TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest complaint updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-yellow-100 dark:bg-yellow-900 p-1 rounded-full">
                        <Bell className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          New complaint received
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Broken Streetlight on Main Street
                        </p>
                        <p className="text-xs text-gray-400">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 dark:bg-blue-900 p-1 rounded-full">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status updated</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Pothole repair in progress
                        </p>
                        <p className="text-xs text-gray-400">5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 dark:bg-green-900 p-1 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Complaint resolved
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Traffic sign replacement completed
                        </p>
                        <p className="text-xs text-gray-400">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Department performance overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Resolution Rate
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {Math.round(
                          (departmentStats.resolvedComplaints /
                            departmentStats.totalComplaints) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (departmentStats.resolvedComplaints /
                              departmentStats.totalComplaints) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">This Month</p>
                        <p className="text-xl font-bold">42</p>
                        <p className="text-xs text-green-600">
                          +12% from last month
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Avg Response</p>
                        <p className="text-xl font-bold">2.1h</p>
                        <p className="text-xs text-blue-600">
                          -15min improvement
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Priority Complaints</CardTitle>
                <CardDescription>
                  High priority items requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complaints
                    .filter(
                      (c) => c.priority === "high" || c.priority === "critical"
                    )
                    .map((complaint) => (
                      <div
                        key={complaint.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <Badge
                            className={getPriorityColor(complaint.priority)}
                          >
                            {complaint.priority}
                          </Badge>
                          <div>
                            <p className="font-medium">{complaint.title}</p>
                            <p className="text-sm text-gray-500">
                              {complaint.location}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(complaint)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Complaints Tab */}
          <TabsContent value="new" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">New Complaints</h2>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filterComplaintsByStatus("new").map((complaint) => (
                <Card
                  key={complaint.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          {getStatusIcon(complaint.status)}
                          <span>{complaint.title}</span>
                        </CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <User className="h-4 w-4 mr-1" />
                          {complaint.citizenName} •
                          <MapPin className="h-4 w-4 ml-2 mr-1" />
                          {complaint.location}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status.replace("-", " ")}
                        </Badge>
                        <Badge className={getPriorityColor(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {complaint.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {complaint.submittedDate}
                        </span>
                        {complaint.photos.length > 0 && (
                          <span className="flex items-center">
                            <Camera className="h-4 w-4 mr-1" />
                            {complaint.photos.length} photos
                          </span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(complaint)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* In Progress Tab */}
          <TabsContent value="in-progress" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">In Progress Complaints</h2>
            </div>

            <div className="space-y-4">
              {filterComplaintsByStatus("in-progress").map((complaint) => (
                <Card
                  key={complaint.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          {getStatusIcon(complaint.status)}
                          <span>{complaint.title}</span>
                        </CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <User className="h-4 w-4 mr-1" />
                          {complaint.citizenName} •
                          <MapPin className="h-4 w-4 ml-2 mr-1" />
                          {complaint.location}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status.replace("-", " ")}
                        </Badge>
                        <Badge className={getPriorityColor(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {complaint.description}
                    </p>
                    {complaint.assignedTo && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                        Assigned to: {complaint.assignedTo}
                      </p>
                    )}
                    {complaint.estimatedResolution && (
                      <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                        Estimated completion: {complaint.estimatedResolution}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {complaint.submittedDate}
                        </span>
                        {complaint.remarks.length > 0 && (
                          <span className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {complaint.remarks.length} updates
                          </span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(complaint)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Update
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Resolved Tab */}
          <TabsContent value="resolved" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Resolved Complaints</h2>
            </div>

            <div className="space-y-4">
              {filterComplaintsByStatus("resolved").map((complaint) => (
                <Card
                  key={complaint.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          {getStatusIcon(complaint.status)}
                          <span>{complaint.title}</span>
                        </CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <User className="h-4 w-4 mr-1" />
                          {complaint.citizenName} •
                          <MapPin className="h-4 w-4 ml-2 mr-1" />
                          {complaint.location}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(complaint.status)}>
                        {complaint.status.replace("-", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {complaint.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Resolved: {complaint.estimatedResolution}
                        </span>
                        <span className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completed
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(complaint)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View History
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Complaint Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>Complaint Details</span>
                {selectedComplaint && (
                  <Badge className={getStatusColor(selectedComplaint.status)}>
                    {selectedComplaint.status.replace("-", " ")}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Complaint ID: {selectedComplaint?.id}
              </DialogDescription>
            </DialogHeader>

            {selectedComplaint && (
              <div className="space-y-6">
                {/* Citizen Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Citizen Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Name
                        </p>
                        <p>{selectedComplaint.citizenName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Email
                        </p>
                        <p>{selectedComplaint.citizenEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Phone
                        </p>
                        <p>{selectedComplaint.citizenPhone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Submitted
                        </p>
                        <p>{selectedComplaint.submittedDate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Complaint Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Complaint Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Title
                        </p>
                        <p className="font-medium">{selectedComplaint.title}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Category
                        </p>
                        <p>{selectedComplaint.category}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Priority
                        </p>
                        <Badge
                          className={getPriorityColor(
                            selectedComplaint.priority
                          )}
                        >
                          {selectedComplaint.priority}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Location
                        </p>
                        <p>{selectedComplaint.location}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Description
                        </p>
                        <p>{selectedComplaint.description}</p>
                      </div>
                      {selectedComplaint.photos.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Photos
                          </p>
                          <div className="flex space-x-2">
                            {selectedComplaint.photos.map((photo, index) => (
                              <div
                                key={index}
                                className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg"
                              >
                                <Camera className="h-8 w-8 text-gray-400" />
                                <p className="text-xs mt-1">{photo}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Status Update */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Update Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="in-progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleUpdateStatus}>
                        Update Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Remarks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Remarks & Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedComplaint.remarks.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-2">
                            Previous Remarks
                          </p>
                          <div className="space-y-2">
                            {selectedComplaint.remarks.map((remark, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
                              >
                                <p className="text-sm">{remark}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="newRemark">Add New Remark</Label>
                        <Textarea
                          id="newRemark"
                          value={newRemark}
                          onChange={(e) => setNewRemark(e.target.value)}
                          placeholder="Add update or remark about this complaint..."
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleAddRemark}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Add Remark
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
