"use client"

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Users, Shield, BarChart3, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RoleSelection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5" />
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">FixMyCity</h1>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Choose Your Access Level
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Select your role to access the appropriate login portal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Citizen Card */}
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-blue-100 dark:bg-blue-900 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl">Citizen</CardTitle>
                <CardDescription className="text-base">
                  Report civic issues and track their resolution
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                  <li>• Submit complaints with photos</li>
                  <li>• Track complaint status</li>
                  <li>• Receive real-time updates</li>
                  <li>• View resolution history</li>
                </ul>
                <div className="space-y-2 ">
                  <Link href="/auth/citizen/login" className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Login as Citizen
                    </Button>
                  </Link>
                  <Link href="/auth/citizen/signup" className="w-full">
                    <Button variant="outline" className="w-full mt-3">
                      Sign Up as Citizen
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Department Admin Card */}
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-green-100 dark:bg-green-900 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                  <Shield className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl">Department Admin</CardTitle>
                <CardDescription className="text-base">
                  Manage and resolve assigned complaints
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                  <li>• Receive assigned complaints</li>
                  <li>• Update complaint status</li>
                  <li>• Coordinate resolution</li>
                  <li>• Communicate with citizens</li>
                </ul>
                <div className="space-y-2">
                  <Link href="/auth/admin/login" className="w-full">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Login as Admin
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Admin accounts are created by Super Admin
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Super Admin Card */}
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-orange-100 dark:bg-orange-900 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                  <BarChart3 className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-2xl">Super Admin</CardTitle>
                <CardDescription className="text-base">
                  System oversight and management
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                  <li>• Monitor system performance</li>
                  <li>• Manage departments</li>
                  <li>• Generate reports</li>
                  <li>• Oversee complaint routing</li>
                </ul>
                <div className="space-y-2">
                  <Link href="/auth/super-admin/login" className="w-full">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      Login as Super Admin
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Restricted access for system administrators
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-300">
              Need help? <Link href="/#contact" className="text-blue-600 dark:text-blue-400 hover:underline">Contact Support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}