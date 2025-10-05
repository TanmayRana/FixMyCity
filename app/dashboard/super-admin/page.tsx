"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  BarChart3,
  Users,
  Building2,
  FileText,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Download,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiClient";

interface Department {
  id: string;
  name: string;
  adminName: string;
  adminEmail: string;
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  status: "active" | "inactive";
}

interface Complaint {
  id: string;
  title: string;
  category: string;
  department: string;
  status: "submitted" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  submittedDate: string; // YYYY-MM-DD
  citizenName: string;
  location: string;
  resolutionDate?: string; // YYYY-MM-DD (optional)
}

interface SystemStats {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  totalDepartments: number;
  totalCitizens: number;
  totalAdmins: number;
  avgResolutionTime: number;
}

export default function SuperAdminDashboard() {
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("30");

  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    totalDepartments: 0,
    totalCitizens: 0,
    totalAdmins: 0,
    avgResolutionTime: 0,
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Complaints tab state (dynamic)
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState<boolean>(false);
  const [complaintsFilters, setComplaintsFilters] = useState<{ status: string; department: string }>(
    { status: "all", department: "all" }
  );

  const [newDepartment, setNewDepartment] = useState({
    name: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });

  // Basic Settings tab state (persisted)
  const [defaultTheme, setDefaultTheme] = useState<string>("system");
  const [autoAssignRule, setAutoAssignRule] = useState<string>("category");
  const [notificationFreq, setNotificationFreq] = useState<string>("immediate");

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, deptsRes] = await Promise.all([
        apiFetch("/api/dashboard/stats"),
        apiFetch("/api/departments"),
      ]);

      if (statsRes.ok) {
        const json = await statsRes.json();
        const data = json.data || {};
        console.log("📊 System Stats Data:", data);
        setSystemStats({
          totalComplaints: Number(data.totalComplaints || 0),
          resolvedComplaints: Number(
            (data.complaintsByStatus?.resolved || 0) +
              (data.complaintsByStatus?.closed || 0)
          ),
          pendingComplaints: Number(
            (data.complaintsByStatus?.["submitted"] || 0) +
              (data.complaintsByStatus?.["in-progress"] || 0)
          ),
          totalDepartments: Number(data.totalDepartments || 0),
          totalCitizens: Number(data.totalUsers || 0),
          totalAdmins: 0,
          avgResolutionTime: 0,
        });
      } else if (statsRes.status === 401) {
        toast.error("Unauthorized");
      }

      if (deptsRes.ok) {
        const json = await deptsRes.json();
        console.log("🏢 Departments API Response:", json);
        console.log("📊 Departments Data:", json.data);
        console.log("📈 Departments Count:", json.count);
        console.log("🔍 API Metadata:", json.metadata);

        if (json.data && Array.isArray(json.data)) {
          const list = json.data.map((d: any, idx: number) => ({
            id: d._id || String(idx + 1),
            name: d.name || "Unknown Department",
            adminName: d.head?.name || "No Admin",
            adminEmail: d.head?.email || "No Email",
            totalComplaints: Number(d.totalComplaints || 0),
            resolvedComplaints: Number(d.resolvedComplaints || 0),
            pendingComplaints: Number(d.pendingComplaints || 0),
            status: d.isActive ? "active" : "inactive",
          }));
          console.log("✅ Processed departments list:", list);
          setDepartments(list);

          // Show helpful information if no complaints
          if (json.metadata?.totalComplaintsInDB === 0) {
            console.log(
              "ℹ️ No complaints in database. Create complaints to see statistics."
            );
          } else if (json.metadata?.processedComplaints === 0) {
            console.log("ℹ️ No complaints could be mapped to departments.");
            console.log(
              "Department names in DB:",
              json.metadata.departmentNamesInDB
            );
            console.log(
              "Department values in complaints:",
              json.metadata.complaintDepartmentValues
            );
            console.log(
              "Category to Department mapping:",
              json.metadata.categoryToDeptMapping
            );
            console.log(
              "Department Categories:",
              json.metadata.departmentCategories
            );
          } else {
            console.log(
              `✅ Successfully processed ${json.metadata.processedComplaints} department(s) with complaints.`
            );
          }
        } else {
          console.log("⚠️ No departments data received");
          setDepartments([]);
        }
      } else {
        console.error(
          "❌ Departments API error:",
          deptsRes.status,
          deptsRes.statusText
        );
        const errorData = await deptsRes.json().catch(() => ({}));
        console.error("❌ Error details:", errorData);
        toast.error(
          `Failed to load departments: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  };

  // Fetch complaints for super-admin with filters
  const fetchComplaints = useCallback(async () => {
    try {
      setComplaintsLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (complaintsFilters.status !== "all") params.set("status", complaintsFilters.status);
      if (complaintsFilters.department !== "all") params.set("category", complaintsFilters.department);

      const res = await apiFetch(`/api/complaints?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to load complaints");
        setComplaints([]);
        return;
      }
      const json = await res.json();
      const list: Complaint[] = (json.data || []).map((c: any) => ({
        id: c._id,
        title: c.title,
        category: c.category,
        department: c.category, // category doubles as department name in our model
        status: c.status,
        priority: c.priority,
        submittedDate: new Date(c.createdAt).toISOString().slice(0, 10),
        citizenName: c.submittedBy?.name || "Citizen",
        location: c.location,
        resolutionDate: c.resolutionDate ? new Date(c.resolutionDate).toISOString().slice(0, 10) : undefined,
      }));
      setComplaints(list);
    } catch (e) {
      toast.error("Failed to load complaints");
      setComplaints([]);
    } finally {
      setComplaintsLoading(false);
    }
  }, [complaintsFilters]);

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    console.log("storedUserName", storedUserName);
    if (storedUserName) {
      setUserName(storedUserName);
    }
    // Load persisted settings
    try {
      const t = localStorage.getItem("sa_defaultTheme");
      const a = localStorage.getItem("sa_autoAssignRule");
      const n = localStorage.getItem("sa_notificationFreq");
      if (t) setDefaultTheme(t);
      if (a) setAutoAssignRule(a);
      if (n) setNotificationFreq(n);
    } catch {}
    fetchDashboardData();
    fetchComplaints();

    // Auto-refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchComplaints();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchComplaints]);

  // Refetch complaints when filters change
  useEffect(() => {
    fetchComplaints();
  }, [complaintsFilters, fetchComplaints]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
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

  const handleAddDepartment = async () => {
    if (
      !newDepartment.name ||
      !newDepartment.adminName ||
      !newDepartment.adminEmail
    )
      return;
    try {
      // First create the admin user
      const adminRes = await apiFetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDepartment.adminName,
          email: newDepartment.adminEmail,
          password:
            newDepartment.adminPassword ||
            Math.random().toString(36).slice(2, 10),
          department: newDepartment.name,
        }),
      });
      if (!adminRes.ok) {
        const err = await adminRes.json();
        toast.error(err.error || "Failed to create admin");
        return;
      }

      const adminJson = await adminRes.json();
      const adminUser = adminJson.user;

      // Then create the department with that admin as head
      const deptRes = await apiFetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDepartment.name,
          description: `${newDepartment.name} department`,
          head: adminUser._id,
          members: [],
          categories: [],
        }),
      });
      if (!deptRes.ok) {
        const err = await deptRes.json();
        toast.error(err.error || "Failed to create department");
        return;
      }

      // Refresh dashboard data
      await fetchDashboardData();
      setNewDepartment({
        name: "",
        adminName: "",
        adminEmail: "",
        adminPassword: "",
      });
      setIsAddDeptOpen(false);
      toast.success("Department created");
    } catch (e) {
      toast.error("Network error");
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.department) return;
    try {
      const res = await apiFetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          password:
            newAdmin.password || Math.random().toString(36).slice(2, 10),
          department: newAdmin.department,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create admin");
        return;
      }
      setNewAdmin({ name: "", email: "", password: "", department: "" });
      setIsAddAdminOpen(false);
      toast.success("Department admin created successfully");
    } catch (e) {
      toast.error("Network error");
    }
  };

  const generateReport = () => {
    const list = complaintsWithinDays(Number(selectedTimeframe));
    if (!list.length) {
      toast.info("No complaints in selected timeframe to export");
      return;
    }
    const headers = [
      "ID",
      "Title",
      "Category",
      "Department",
      "Status",
      "Priority",
      "SubmittedDate",
      "ResolutionDate",
      "CitizenName",
      "Location",
    ];
    const rows = list.map((c) => [
      c.id,
      c.title?.replace(/\n|\r|,/g, " ") || "",
      c.category,
      c.department,
      c.status,
      c.priority,
      c.submittedDate,
      c.resolutionDate || "",
      c.citizenName?.replace(/\n|\r|,/g, " ") || "",
      c.location?.replace(/\n|\r|,/g, " ") || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `fixmycity_report_${selectedTimeframe}d_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report generated and downloaded successfully");
  };

  // Derived data for Reports tab from complaints
  const complaintsWithinDays = (days: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return complaints.filter((c) => new Date(c.submittedDate) >= cutoff);
  };
  const priorityDistribution = (list: Complaint[]) => {
    const total = list.length || 1;
    const counts: Record<Complaint["priority"], number> = { low: 0, medium: 0, high: 0, critical: 0 };
    list.forEach((c) => { counts[c.priority] += 1; });
    return {
      low: Math.round((counts.low / total) * 100),
      medium: Math.round((counts.medium / total) * 100),
      high: Math.round((counts.high / total) * 100),
      critical: Math.round((counts.critical / total) * 100),
    };
  };
  const reportsList = complaintsWithinDays(Number(selectedTimeframe));
  const dist = priorityDistribution(reportsList);
  // Trends by date (submitted)
  const trends = (() => {
    const map = new Map<string, number>();
    reportsList.forEach((c) => {
      const d = c.submittedDate;
      map.set(d, (map.get(d) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  })();
  // Department comparison (resolved rate)
  const deptStats = (() => {
    const map = new Map<string, { total: number; resolved: number }>();
    reportsList.forEach((c) => {
      const key = c.department || c.category;
      const curr = map.get(key) || { total: 0, resolved: 0 };
      curr.total += 1;
      if (c.status === "resolved" || c.status === "closed") curr.resolved += 1;
      map.set(key, curr);
    });
    return Array.from(map.entries())
      .map(([department, v]) => ({
        department,
        total: v.total,
        resolved: v.resolved,
        rate: v.total ? Math.round((v.resolved / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  })();
  // Resolution time by category (average days)
  const resolutionByCategory = (() => {
    const map = new Map<string, { sumDays: number; n: number }>();
    reportsList.forEach((c) => {
      if (c.resolutionDate) {
        const start = new Date(c.submittedDate).getTime();
        const end = new Date(c.resolutionDate).getTime();
        const days = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        const key = c.category;
        const curr = map.get(key) || { sumDays: 0, n: 0 };
        curr.sumDays += days;
        curr.n += 1;
        map.set(key, curr);
      }
    });
    return Array.from(map.entries())
      .map(([category, v]) => ({ category, days: v.n ? +(v.sumDays / v.n).toFixed(1) : 0 }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 8);
  })();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar userName={userName} userRole="super-admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Super Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                System oversight and management control panel
              </p>
              {lastUpdated && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={fetchDashboardData}
                variant="outline"
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <Settings
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>{isLoading ? "Refreshing..." : "Refresh Data"}</span>
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const testRes = await apiFetch("/api/departments/test");
                    if (testRes.ok) {
                      const testData = await testRes.json();
                      console.log("🧪 API Test Results:", testData);
                      toast.success(
                        "API test completed - check console for details"
                      );
                    } else {
                      toast.error("API test failed");
                    }
                  } catch (e) {
                    toast.error("API test error");
                  }
                }}
                variant="secondary"
                size="sm"
              >
                Test API
              </Button>
            </div>
          </div>
        </div>

        {/* Data Status Indicator */}
        {/* <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              Live Data
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              • Auto-refreshes every 30 seconds
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              • Dynamic category mapping
            </span>
            {lastUpdated && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                • Last sync: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div> */}

        {/* System Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total Complaints
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {systemStats.totalComplaints}
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
                    Resolved
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {systemStats.resolvedComplaints}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {Math.round(
                      (systemStats.resolvedComplaints /
                        systemStats.totalComplaints) *
                        100
                    )}
                    % success rate
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
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {systemStats.pendingComplaints}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Needs attention
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
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
                    {systemStats.avgResolutionTime}d
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Days average
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Department Performance</CardTitle>
                  <CardDescription>
                    Resolution rates by department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                          </div>
                          <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mb-2"></div>
                            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : departments.length > 0 ? (
                    <div className="space-y-4">
                      {departments.map((dept) => (
                        <div
                          key={dept.id}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{dept.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {dept.resolvedComplaints}/{dept.totalComplaints}{" "}
                              resolved
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {dept.totalComplaints > 0
                                ? Math.round(
                                    (dept.resolvedComplaints /
                                      dept.totalComplaints) *
                                      100
                                  )
                                : 0}
                              %
                            </p>
                            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${
                                    dept.totalComplaints > 0
                                      ? (dept.resolvedComplaints /
                                          dept.totalComplaints) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No departments found</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Platform statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center"
                        >
                          <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                          <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Active Departments
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          {systemStats.totalDepartments}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Registered Citizens
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          {systemStats.totalCitizens}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Total Complaints
                        </span>
                        <span className="text-2xl font-bold text-orange-600">
                          {systemStats.totalComplaints}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Resolution Rate
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          {systemStats.totalComplaints > 0
                            ? Math.round(
                                (systemStats.resolvedComplaints /
                                  systemStats.totalComplaints) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Department Management</h2>
              <div className="space-x-2">
                <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Department Admin</DialogTitle>
                      <DialogDescription>
                        Add a new department administrator account
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="adminName">Full Name</Label>
                        <Input
                          id="adminName"
                          value={newAdmin.name}
                          onChange={(e) =>
                            setNewAdmin({ ...newAdmin, name: e.target.value })
                          }
                          placeholder="Enter admin name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminEmail">Email</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          value={newAdmin.email}
                          onChange={(e) =>
                            setNewAdmin({ ...newAdmin, email: e.target.value })
                          }
                          placeholder="admin@department.gov"
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminPassword">Password</Label>
                        <Input
                          id="adminPassword"
                          type="password"
                          value={newAdmin.password}
                          onChange={(e) =>
                            setNewAdmin({
                              ...newAdmin,
                              password: e.target.value,
                            })
                          }
                          placeholder="Create secure password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminDept">Department</Label>
                        <Select
                          onValueChange={(value) =>
                            setNewAdmin({ ...newAdmin, department: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.name}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddAdmin} className="w-full">
                        Create Admin Account
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Department</DialogTitle>
                      <DialogDescription>
                        Create a new department with an admin
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="deptName">Department Name</Label>
                        <Input
                          id="deptName"
                          value={newDepartment.name}
                          onChange={(e) =>
                            setNewDepartment({
                              ...newDepartment,
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g., Environmental Services"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deptAdminName">Admin Name</Label>
                        <Input
                          id="deptAdminName"
                          value={newDepartment.adminName}
                          onChange={(e) =>
                            setNewDepartment({
                              ...newDepartment,
                              adminName: e.target.value,
                            })
                          }
                          placeholder="Department admin name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deptAdminEmail">Admin Email</Label>
                        <Input
                          id="deptAdminEmail"
                          type="email"
                          value={newDepartment.adminEmail}
                          onChange={(e) =>
                            setNewDepartment({
                              ...newDepartment,
                              adminEmail: e.target.value,
                            })
                          }
                          placeholder="admin@newdept.gov"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deptAdminPassword">
                          Admin Password
                        </Label>
                        <Input
                          id="deptAdminPassword"
                          type="password"
                          value={newDepartment.adminPassword}
                          onChange={(e) =>
                            setNewDepartment({
                              ...newDepartment,
                              adminPassword: e.target.value,
                            })
                          }
                          placeholder="Create secure password"
                        />
                      </div>
                      <Button onClick={handleAddDepartment} className="w-full">
                        Create Department
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-6">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="animate-pulse h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="animate-pulse h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="text-center">
                            <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-2"></div>
                            <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : departments.length > 0 ? (
                departments.map((dept) => (
                  <Card key={dept.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <Building2 className="h-5 w-5" />
                            <span>{dept.name}</span>
                            <Badge
                              className={
                                dept.status === "active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }
                            >
                              {dept.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Admin: {dept.adminName} ({dept.adminEmail})
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {dept.totalComplaints}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Total
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {dept.resolvedComplaints}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Resolved
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">
                            {dept.pendingComplaints}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Pending
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <span>Resolution Rate</span>
                          <span>
                            {dept.totalComplaints > 0
                              ? Math.round(
                                  (dept.resolvedComplaints /
                                    dept.totalComplaints) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                dept.totalComplaints > 0
                                  ? (dept.resolvedComplaints /
                                      dept.totalComplaints) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No Departments Found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Get started by creating your first department
                    </p>
                    <Button onClick={() => setIsAddDeptOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Department
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">System-wide Complaints</h2>
              <div className="flex space-x-2">
                <Select
                  value={complaintsFilters.status}
                  onValueChange={(v) => setComplaintsFilters((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={complaintsFilters.department}
                  onValueChange={(v) => setComplaintsFilters((p) => ({ ...p, department: v }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {complaintsLoading && (
                <Card>
                  <CardContent className="p-6">
                    <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="animate-pulse h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </CardContent>
                </Card>
              )}
              {!complaintsLoading && complaints.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">No complaints found</CardContent>
                </Card>
              )}
              {!complaintsLoading && complaints.map((complaint) => (
                <Card key={complaint.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {complaint.title}
                        </CardTitle>
                        <CardDescription>
                          {complaint.citizenName} • {complaint.location} •{" "}
                          {complaint.submittedDate}
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
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Department: {complaint.department}</span>
                        <span>Category: {complaint.category}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Reports & Analytics</h2>
              <div className="flex space-x-2">
                <Select
                  value={selectedTimeframe}
                  onValueChange={setSelectedTimeframe}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 3 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={generateReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Complaint Trends</CardTitle>
                  <CardDescription>Complaints over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {trends.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-gray-500">No data in selected range</div>
                  ) : (
                    <div className="space-y-2">
                      {trends.map((t) => (
                        <div key={t.date} className="flex items-center space-x-3">
                          <div className="w-28 text-sm text-gray-600 dark:text-gray-400">{t.date}</div>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, t.count * 10)}%` }}></div>
                          </div>
                          <div className="w-8 text-right text-sm">{t.count}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Department Comparison</CardTitle>
                  <CardDescription>
                    Performance metrics by department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {deptStats.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-gray-500">No department data</div>
                  ) : (
                    <div className="space-y-3">
                      {deptStats.map((d) => (
                        <div key={d.department} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{d.department}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{d.resolved}/{d.total} resolved</p>
                          </div>
                          <div className="w-40 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${d.rate}%` }}></div>
                          </div>
                          <div className="w-10 text-right text-sm">{d.rate}%</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resolution Time Analysis</CardTitle>
                  <CardDescription>
                    Average resolution times by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {resolutionByCategory.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-gray-500">No resolved complaints in range</div>
                  ) : (
                    <div className="space-y-3">
                      {resolutionByCategory.map((r) => (
                        <div key={r.category} className="flex justify-between items-center">
                          <span>{r.category}</span>
                          <span className="font-medium">{r.days} days</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Priority Distribution</CardTitle>
                  <CardDescription>
                    Complaints by priority level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Critical</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${dist.critical}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{dist.critical}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>High</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full"
                            style={{ width: `${dist.high}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{dist.high}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Medium</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${dist.medium}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{dist.medium}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Low</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gray-600 h-2 rounded-full"
                            style={{ width: `${dist.low}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{dist.low}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">System Settings</h2>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Platform Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Default Theme</Label>
                    <Select
                      value={defaultTheme}
                      onValueChange={(v) => {
                        setDefaultTheme(v);
                        try { localStorage.setItem("sa_defaultTheme", v); } catch {}
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Auto-assignment Rules</Label>
                    <Select
                      value={autoAssignRule}
                      onValueChange={(v) => {
                        setAutoAssignRule(v);
                        try { localStorage.setItem("sa_autoAssignRule", v); } catch {}
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="category">By Category</SelectItem>
                        <SelectItem value="location">By Location</SelectItem>
                        <SelectItem value="workload">By Workload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notification Frequency</Label>
                    <Select
                      value={notificationFreq}
                      onValueChange={(v) => {
                        setNotificationFreq(v);
                        try { localStorage.setItem("sa_notificationFreq", v); } catch {}
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Maintenance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Backup System Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Clear System Cache
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    System Health Check
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Emergency Maintenance Mode
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
