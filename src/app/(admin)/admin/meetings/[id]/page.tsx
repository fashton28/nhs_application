"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  PlayCircle,
  StopCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Id } from "../../../../../../convex/_generated/dataModel";

export default function MeetingDetailPage() {
  const params = useParams();
  const meetingId = params.id as Id<"meetings">;

  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [confirmCloseDialog, setConfirmCloseDialog] = useState(false);

  // Load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("nhs_auth_token");
    setToken(storedToken);
  }, []);

  // Query meeting details
  const meeting = useQuery(
    api.functions.attendance.getMeeting,
    token ? { token, meetingId } : "skip"
  );

  // Query attendance
  const attendance = useQuery(
    api.functions.attendance.getMeetingAttendance,
    token ? { token, meetingId } : "skip"
  );

  // Mutations
  const openCheckIn = useMutation(api.functions.attendance.openCheckIn);
  const closeCheckIn = useMutation(api.functions.attendance.closeCheckIn);
  const refreshCode = useMutation(api.functions.attendance.refreshCheckInCode);

  // Calculate countdown
  useEffect(() => {
    if (!meeting?.codeExpiresAt) {
      setCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((meeting.codeExpiresAt! - Date.now()) / 1000));
      setCountdown(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [meeting?.codeExpiresAt]);

  // Auto-refresh code when it expires
  const handleAutoRefresh = useCallback(async () => {
    if (!token || !meeting || meeting.checkInStatus !== "open") return;
    if (countdown === 0 && meeting.codeExpiresAt && Date.now() > meeting.codeExpiresAt) {
      try {
        await refreshCode({ token, meetingId });
      } catch (err) {
        console.error("Failed to auto-refresh code:", err);
      }
    }
  }, [token, meeting, countdown, meetingId, refreshCode]);

  useEffect(() => {
    if (countdown === 0 && meeting?.checkInStatus === "open") {
      handleAutoRefresh();
    }
  }, [countdown, meeting?.checkInStatus, handleAutoRefresh]);

  // Handle open check-in
  const handleOpenCheckIn = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await openCheckIn({ token, meetingId });
    } catch (err) {
      alert("Failed to open check-in: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close check-in
  const handleCloseCheckIn = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await closeCheckIn({ token, meetingId });
      setConfirmCloseDialog(false);
    } catch (err) {
      alert("Failed to close check-in: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle manual refresh
  const handleRefreshCode = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await refreshCode({ token, meetingId });
    } catch (err) {
      alert("Failed to refresh code: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
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

  if (!meeting) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/meetings" className="flex items-center text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Meetings
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
            {meeting.description && (
              <p className="text-gray-500 mt-1">{meeting.description}</p>
            )}
          </div>
          <Badge
            variant="secondary"
            className={
              meeting.checkInStatus === "open"
                ? "bg-green-100 text-green-700"
                : meeting.checkInStatus === "closed"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }
          >
            {meeting.checkInStatus === "open"
              ? "Check-in Open"
              : meeting.checkInStatus === "closed"
              ? "Completed"
              : "Not Started"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meeting Info */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span>{formatDate(meeting.scheduledDate)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <span>
                {formatTime(meeting.scheduledStartTime)} - {formatTime(meeting.scheduledEndTime)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span>{meeting.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-400" />
              <span>
                {meeting.attendeeCount} / {attendance?.totalStudents || "?"} students checked in
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Check-in Control */}
        <Card>
          <CardHeader>
            <CardTitle>Check-in Control</CardTitle>
          </CardHeader>
          <CardContent>
            {meeting.checkInStatus === "not_started" && (
              <div className="text-center py-6">
                <PlayCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">Check-in has not started yet</p>
                <Button onClick={handleOpenCheckIn} disabled={isSubmitting}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Starting..." : "Start Check-in"}
                </Button>
              </div>
            )}

            {meeting.checkInStatus === "open" && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">Current Check-in Code</p>
                <div className="text-5xl font-mono font-bold tracking-widest text-blue-600 mb-2">
                  {meeting.currentCheckInCode || "------"}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                  <Clock className="h-4 w-4" />
                  <span>
                    {countdown > 0 ? `Expires in ${countdown}s` : "Refreshing..."}
                  </span>
                </div>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRefreshCode}
                    disabled={isSubmitting}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    New Code
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmCloseDialog(true)}
                    disabled={isSubmitting}
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    End Check-in
                  </Button>
                </div>
              </div>
            )}

            {meeting.checkInStatus === "closed" && (
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-gray-500">Check-in has been completed</p>
                <p className="text-sm text-gray-400 mt-2">
                  {meeting.attendeeCount} students checked in
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Attendance ({attendance?.records?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!attendance?.records || attendance.records.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No students have checked in yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendance.records.map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-sm font-semibold text-blue-600">
                        {record.studentName?.split(" ").map((n) => n[0]).join("") || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{record.studentName}</p>
                      <p className="text-sm text-gray-500">
                        Grade {record.studentGrade} • {record.studentEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {new Date(record.checkInTimestamp).toLocaleTimeString()}
                    </span>
                    <Badge
                      variant="secondary"
                      className={
                        record.status === "present"
                          ? "bg-green-100 text-green-700"
                          : record.status === "excused"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {record.status === "present" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : record.status === "excused" ? (
                        <Clock className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Close Dialog */}
      <Dialog open={confirmCloseDialog} onOpenChange={setConfirmCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Check-in?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end check-in for this meeting? Students will no longer be
              able to check in with a code after this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmCloseDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCloseCheckIn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Closing..." : "End Check-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
