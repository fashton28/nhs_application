"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Users,
  Calendar,
  ChevronRight,
  CheckCircle2,
  XCircle,
  UserCheck,
  Play,
} from "lucide-react";

const mockUpcomingMeetings = [
  {
    id: "1",
    title: "General Assembly",
    date: "Jan 15",
    time: "3:30 PM",
    location: "Room 204",
    checkInStatus: "not_started" as const,
  },
  {
    id: "2",
    title: "Officer Meeting",
    date: "Jan 18",
    time: "2:00 PM",
    location: "Room 102",
    checkInStatus: "not_started" as const,
  },
];

const mockRecentActivity = [
  {
    id: "1",
    action: "Sarah Johnson submitted 3 hours",
    time: "5 min ago",
    type: "submission" as const,
  },
  {
    id: "2",
    action: "Mike Roberts checked in to meeting",
    time: "15 min ago",
    type: "attendance" as const,
  },
  {
    id: "3",
    action: "New student Emily Chen registered",
    time: "1 hour ago",
    type: "registration" as const,
  },
  {
    id: "4",
    action: "You approved 2 hours for Alex Kim",
    time: "2 hours ago",
    type: "approval" as const,
  },
];

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  // Load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("nhs_auth_token");
    setToken(storedToken);
  }, []);

  // Query admin stats
  const stats = useQuery(
    api.functions.serviceHours.getAdminStats,
    token ? { token } : "skip"
  );

  // Get display name
  const firstName = profile
    ? profile.firstName
    : user?.name?.split(" ")[0] || "Admin";

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your NHS chapter
        </p>
      </div>

      {/* Needs Attention */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <Link href="/admin/submissions?status=pending">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {stats?.pendingSubmissions ?? 0}
                  </div>
                  <div className="text-sm text-yellow-600">Pending Hours</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/students?status=pending">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-700">
                    {stats?.unverifiedStudents ?? 0}
                  </div>
                  <div className="text-sm text-orange-600">Unverified Students</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <Link href="/admin/submissions?status=pending">
          <Button className="w-full h-auto py-3" variant="default">
            <Clock className="h-4 w-4 mr-2" />
            Review Hours
          </Button>
        </Link>
        <Link href="/admin/students?status=pending">
          <Button className="w-full h-auto py-3" variant="outline">
            <UserCheck className="h-4 w-4 mr-2" />
            Verify Students
          </Button>
        </Link>
      </div>

      {/* This Month Stats */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">This Month</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">
                  {stats?.approvedHoursThisMonth ?? 0}
                </div>
                <div className="text-xs text-gray-500">Hours Approved</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">
                  {stats?.deniedThisMonth ?? 0}
                </div>
                <div className="text-xs text-gray-500">Submissions Denied</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Upcoming Meetings</CardTitle>
            <Link href="/admin/meetings">
              <Button variant="ghost" size="sm" className="text-blue-600">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {mockUpcomingMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{meeting.title}</div>
                    <div className="text-sm text-gray-500">
                      {meeting.date} at {meeting.time} • {meeting.location}
                    </div>
                  </div>
                </div>
                <Link href={`/admin/meetings/${meeting.id}`}>
                  <Button size="sm" variant="outline">
                    <Play className="h-4 w-4 mr-1" />
                    Start Check-In
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {mockRecentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 py-2"
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    activity.type === "submission"
                      ? "bg-yellow-500"
                      : activity.type === "attendance"
                      ? "bg-green-500"
                      : activity.type === "registration"
                      ? "bg-blue-500"
                      : "bg-purple-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
