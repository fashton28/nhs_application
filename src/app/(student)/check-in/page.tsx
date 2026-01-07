"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calendar, Clock, MapPin, AlertCircle } from "lucide-react";

export default function CheckInPage() {
  const [token, setToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("nhs_auth_token");
    setToken(storedToken);
  }, []);

  // Query for active meeting with open check-in
  const activeMeeting = useQuery(
    api.functions.attendance.getActiveMeetingForCheckIn,
    token ? { token } : "skip"
  );

  // Check-in mutation
  const checkIn = useMutation(api.functions.attendance.checkIn);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeMeeting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await checkIn({
        token,
        meetingId: activeMeeting._id,
        code: code.toUpperCase().trim(),
      });
      // Success - the query will re-fetch and show already checked in state
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check in");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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

  // Loading state
  if (token && activeMeeting === undefined) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Checking for active meeting...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No active meeting
  if (!activeMeeting) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Active Check-In
            </h2>
            <p className="text-gray-500">
              There&apos;s no meeting with open check-in right now. Check back when your sponsor opens check-in.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already checked in
  if (activeMeeting.alreadyCheckedIn) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              You&apos;re checked in!
            </h2>
            <p className="text-gray-700 font-medium mb-1">{activeMeeting.title}</p>
            <p className="text-gray-500 text-sm">{formatDate(activeMeeting.scheduledDate)}</p>
            {activeMeeting.checkInTime && (
              <p className="text-gray-400 text-xs mt-2">
                Checked in at {new Date(activeMeeting.checkInTime).toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show check-in form
  return (
    <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mx-auto mb-2">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">{activeMeeting.title}</CardTitle>
          <CardDescription className="space-y-1">
            <span className="flex items-center justify-center gap-1">
              <MapPin className="h-3 w-3" />
              {activeMeeting.location}
            </span>
            <span className="flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(activeMeeting.scheduledStartTime)} - {formatTime(activeMeeting.scheduledEndTime)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                Enter the code shown by your sponsor
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null); // Clear error when typing
              }}
              placeholder="ABC123"
              className="text-center text-2xl tracking-widest font-mono h-14"
              maxLength={6}
              required
              autoFocus
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || code.length < 6}
            >
              {isSubmitting ? "Checking in..." : "Check In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
