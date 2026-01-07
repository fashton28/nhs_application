"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  ChevronRight,
  CheckCircle,
  XCircle,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";

type TabFilter = "upcoming" | "past" | "all";

export default function AdminMeetingsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tabFilter, setTabFilter] = useState<TabFilter>("upcoming");

  // Load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("nhs_auth_token");
    setToken(storedToken);
  }, []);

  // Query meetings
  const meetings = useQuery(
    api.functions.attendance.listMeetings,
    token
      ? {
          token,
          upcoming: tabFilter === "upcoming" ? true : undefined,
          past: tabFilter === "past" ? true : undefined,
        }
      : "skip"
  );

  const isLoading = token && meetings === undefined;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get check-in status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_started":
        return {
          className: "bg-gray-100 text-gray-700",
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: "Not Started",
        };
      case "open":
        return {
          className: "bg-green-100 text-green-700",
          icon: <PlayCircle className="h-3 w-3 mr-1" />,
          label: "Check-in Open",
        };
      case "closed":
        return {
          className: "bg-blue-100 text-blue-700",
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          label: "Completed",
        };
      default:
        return {
          className: "bg-gray-100 text-gray-700",
          icon: null,
          label: status,
        };
    }
  };

  const tabs: { value: TabFilter; label: string }[] = [
    { value: "upcoming", label: "Upcoming" },
    { value: "past", label: "Past" },
    { value: "all", label: "All" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-500 mt-1">Manage NHS meetings and attendance</p>
        </div>
        <Link href="/admin/meetings/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Meeting
          </Button>
        </Link>
      </div>

      {/* Tab Filters */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <Badge
            key={tab.value}
            variant={tabFilter === tab.value ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setTabFilter(tab.value)}
          >
            {tab.label}
          </Badge>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-32 bg-gray-200 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && meetings && meetings.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
            <p className="text-gray-500 mb-4">
              {tabFilter === "upcoming"
                ? "No upcoming meetings scheduled."
                : tabFilter === "past"
                ? "No past meetings found."
                : "No meetings have been created yet."}
            </p>
            <Link href="/admin/meetings/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Meeting
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Meetings List */}
      {!isLoading && meetings && meetings.length > 0 && (
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const statusBadge = getStatusBadge(meeting.checkInStatus);
            return (
              <Link key={meeting._id} href={`/admin/meetings/${meeting._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {/* Date Icon */}
                        <div className="flex flex-col items-center justify-center h-14 w-14 rounded-lg bg-blue-100 flex-shrink-0">
                          <span className="text-xs font-medium text-blue-600">
                            {new Date(meeting.scheduledDate).toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="text-xl font-bold text-blue-700">
                            {new Date(meeting.scheduledDate).getDate()}
                          </span>
                        </div>

                        {/* Info */}
                        <div>
                          <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(meeting.scheduledStartTime)} - {formatTime(meeting.scheduledEndTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {meeting.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {meeting.attendeeCount} attended
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status and Arrow */}
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={statusBadge.className}>
                          <span className="flex items-center">
                            {statusBadge.icon}
                            {statusBadge.label}
                          </span>
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
