"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckSquare, Calendar, Plus, FileText, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentDashboard() {
  const { user, profile } = useAuth();

  // Get first name from profile or user
  const firstName = profile?.firstName || user?.name?.split(" ")[0] || "there";

  // Stats from profile (real data when profile exists)
  const stats = {
    approvedHours: profile?.totalApprovedHours || 0,
    pendingHours: profile?.totalPendingHours || 0,
    meetingsAttended: profile?.meetingsAttended || 0,
  };

  // Get greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {firstName}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s your NHS activity overview
        </p>
      </div>

      {/* Profile Setup Banner (if no profile yet) */}
      {!profile && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Complete Your Profile</h3>
                <p className="text-sm text-blue-700">Set up your profile to start tracking service hours</p>
              </div>
              <Link href="/profile">
                <Button size="sm">Set Up Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              {stats.approvedHours}
            </div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">
              Approved Hours
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">
              {stats.pendingHours}
            </div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">
              Pending Hours
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">
              {stats.meetingsAttended}
            </div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">
              Meetings
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <Link href="/submit-hours">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Submit Hours</div>
                <div className="text-xs text-gray-500">Log service time</div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/check-in">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <CheckSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Check In</div>
                <div className="text-xs text-gray-500">Meeting attendance</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Upcoming Events */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Upcoming</CardTitle>
            <Link href="/calendar">
              <Button variant="ghost" size="sm" className="text-blue-600">
                View Calendar
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No upcoming events</p>
            <p className="text-sm">Check back later for meetings and opportunities</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Submissions</CardTitle>
            <Link href="/submissions">
              <Button variant="ghost" size="sm" className="text-blue-600">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No submissions yet</p>
            <Link href="/submit-hours">
              <Button variant="link" className="text-blue-600">
                Submit your first service hours
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
