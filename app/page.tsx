/* eslint-disable react/no-unescaped-entities */
"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  MapPin, 
  Camera, 
  Bell, 
  Shield, 
  Users, 
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">FixMyCity</h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-8">
                  <a href="#home" className="text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">Home</a>
                  <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">How it Works</a>
                  <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">About Us</a>
                  <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">Contact</a>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/auth/role-selection">
                <Button variant="outline">Login/SignUp</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            Civic Engagement Platform
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            FixMyCity
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            A Unified Civic Grievance Redressal Platform
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Empowering citizens to report civic issues, enabling efficient departmental response, 
            and ensuring transparent resolution tracking for a better community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/role-selection">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Simple steps to report civic issues and track their resolution
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Submit Complaint</CardTitle>
                <CardDescription>
                  Report civic issues with photos, location, and detailed description
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Camera className="h-4 w-4" />
                  <MapPin className="h-4 w-4" />
                  <FileText className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-green-100 dark:bg-green-900 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>
                  Real-time updates on complaint status and department actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Bell className="h-4 w-4" />
                  <Clock className="h-4 w-4" />
                  <BarChart3 className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-orange-100 dark:bg-orange-900 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Get Resolution</CardTitle>
                <CardDescription>
                  Receive confirmation when issues are resolved by departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4" />
                  <Bell className="h-4 w-4" />
                  <Users className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Platform Access
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Different access levels for citizens, department administrators, and system supervisors
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Citizens</CardTitle>
                    <CardDescription>Report and track civic issues</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Submit complaints with photos</li>
                  <li>• Track complaint status</li>
                  <li>• Receive updates and notifications</li>
                  <li>• View resolution history</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle>Department Admin</CardTitle>
                    <CardDescription>Manage and resolve complaints</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Receive assigned complaints</li>
                  <li>• Update complaint status</li>
                  <li>• Coordinate resolution efforts</li>
                  <li>• Communicate with citizens</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle>Super Admin</CardTitle>
                    <CardDescription>System oversight and management</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Monitor system performance</li>
                  <li>• Manage departments</li>
                  <li>• Generate reports</li>
                  <li>• Oversee complaint routing</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            About FixMyCity
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            FixMyCity is a comprehensive civic engagement platform designed to bridge the gap between 
            citizens and government departments. Our mission is to create transparent, efficient, and 
            accountable civic services through technology-enabled complaint management and resolution tracking.
          </p>
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Our Vision</h3>
              <p className="text-gray-600 dark:text-gray-300">
                To create smart, responsive cities where every citizen's voice is heard and 
                every civic issue is addressed promptly and transparently.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Our Mission</h3>
              <p className="text-gray-600 dark:text-gray-300">
                To empower citizens with tools to report civic issues while providing 
                administrators with efficient systems to manage and resolve complaints.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Contact Us
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
            Have questions or suggestions? We'd love to hear from you.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  123 Civic Center Drive<br />
                  Government Complex<br />
                  Your City, State 12345
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Support</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  support@fixmycity.gov<br />
                  1-800-FIX-CITY<br />
                  24/7 Support Available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Hours</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Monday - Friday: 8AM - 6PM<br />
                  Saturday: 9AM - 2PM<br />
                  Sunday: Closed
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">FixMyCity</h3>
              <p className="text-gray-300">
                Making cities better, one complaint at a time.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Complaint Management</li>
                <li>Status Tracking</li>
                <li>Department Coordination</li>
                <li>Resolution Reporting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Accessibility</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 FixMyCity. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}