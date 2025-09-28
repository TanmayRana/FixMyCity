"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/navbar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Camera,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiClient, ApiClientError } from '@/lib/apiClient';

interface Complaint {
  id: string;
  title: string;
  category: string;
  status: 'submitted' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  submittedDate: string;
  location: string;
  description: string;
}

export default function CitizenDashboard() {
  const [userName, setUserName] = useState('');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    }
    fetchComplaints();
    fetchStats();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await apiClient.get('/api/complaints?limit=100');
      const json = await res.json();
      const list: Complaint[] = (json.data || []).map((c: any) => ({
        id: c._id,
        title: c.title,
        category: c.category,
        status: c.status as Complaint['status'],
        priority: c.priority,
        submittedDate: new Date(c.createdAt).toISOString().slice(0, 10),
        location: c.location,
        description: c.description,
      }));
      setComplaints(list);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) toast.error('Session expired. Please log in again.');
        else toast.error(error.message || 'Failed to load complaints');
      } else {
        toast.error('Network error while loading complaints');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/api/dashboard/stats');
      const data = await res.json();
      setStats(data.data || stats);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) toast.error('Session expired. Please log in again.');
        else toast.error(error.message || 'Failed to load stats');
      } else {
        toast.error('Network error while loading stats');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-4 w-4" />;
      case 'in-progress':
        return <AlertTriangle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar userName={userName} userRole="citizen" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {userName}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage your civic complaints and track their resolution
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Complaints</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {loading ? '...' : stats.totalComplaints}
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {loading ? '...' : stats.inProgressComplaints}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {loading ? '...' : stats.resolvedComplaints}
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {loading ? '...' : `${stats.successRate}%`}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="all" className="w-full">
              <div className="flex justify-between items-center mb-6">
                <TabsList className="grid w-full max-w-md grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="submitted">Pending</TabsTrigger>
                  <TabsTrigger value="in-progress">Active</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
                
                <Link href="/complaint/submit">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Submit Complaint
                  </Button>
                </Link>
              </div>

              <TabsContent value="all">
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{complaint.title}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {complaint.location}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className={getStatusColor(complaint.status)}>
                              {getStatusIcon(complaint.status)}
                              <span className="ml-1 capitalize">{complaint.status.replace('-', ' ')}</span>
                            </Badge>
                            <Badge className={getPriorityColor(complaint.priority)}>
                              {complaint.priority} priority
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{complaint.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>Category: {complaint.category}</span>
                            <span>Submitted: {complaint.submittedDate}</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(complaint)}>
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {['submitted', 'in-progress', 'resolved'].map((status) => (
                <TabsContent key={status} value={status}>
                  <div className="space-y-4">
                    {complaints
                      .filter((complaint) => complaint.status === status)
                      .map((complaint) => (
                        <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{complaint.title}</CardTitle>
                                <CardDescription className="flex items-center mt-1">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {complaint.location}
                                </CardDescription>
                              </div>
                              <Badge className={getPriorityColor(complaint.priority)}>
                                {complaint.priority} priority
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">{complaint.description}</p>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <span>Category: {complaint.category}</span>
                                <span>Submitted: {complaint.submittedDate}</span>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(complaint)}>
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="mr-2 h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/complaint/submit" className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    Submit New Complaint
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="mr-2 h-4 w-4" />
                  View Complaint Map
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  My Statistics
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 dark:bg-green-900 p-1 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Pothole on Elm Avenue</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Marked as resolved</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-900 p-1 rounded-full">
                      <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Streetlight on Main St</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Work in progress</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
            <DialogDescription>
              {selectedComplaint ? selectedComplaint.title : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Category: </span>
                <span>{selectedComplaint.category}</span>
              </div>
              <div>
                <span className="font-medium">Status: </span>
                <span className="capitalize">{selectedComplaint.status.replace('-', ' ')}</span>
              </div>
              <div>
                <span className="font-medium">Priority: </span>
                <span className="capitalize">{selectedComplaint.priority}</span>
              </div>
              <div>
                <span className="font-medium">Location: </span>
                <span>{selectedComplaint.location}</span>
              </div>
              <div>
                <span className="font-medium">Submitted: </span>
                <span>{selectedComplaint.submittedDate}</span>
              </div>
              <div>
                <span className="font-medium">Description: </span>
                <p className="mt-1 text-gray-700 dark:text-gray-300">{selectedComplaint.description}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}