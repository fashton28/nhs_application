"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

type StatusFilter = "all" | "pending" | "approved" | "denied" | "revision_requested";

export default function SubmissionsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("nhs_auth_token");
    setToken(storedToken);
  }, []);

  // Query submissions with optional status filter
  const submissions = useQuery(
    api.functions.serviceHours.getMySubmissions,
    token
      ? {
          token,
          status: statusFilter === "all" ? undefined : statusFilter,
        }
      : "skip"
  );

  const isLoading = token && submissions === undefined;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          className: "bg-yellow-100 text-yellow-700",
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: "Pending",
        };
      case "approved":
        return {
          className: "bg-green-100 text-green-700",
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          label: "Approved",
        };
      case "denied":
        return {
          className: "bg-red-100 text-red-700",
          icon: <XCircle className="h-3 w-3 mr-1" />,
          label: "Denied",
        };
      case "revision_requested":
        return {
          className: "bg-orange-100 text-orange-700",
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          label: "Revision Needed",
        };
      default:
        return {
          className: "bg-gray-100 text-gray-700",
          icon: null,
          label: status,
        };
    }
  };

  const filters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "denied", label: "Denied" },
    { value: "revision_requested", label: "Needs Revision" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
        <p className="text-gray-500 mt-1">Track your service hour submissions</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <Badge
            key={filter.value}
            variant={statusFilter === filter.value ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-200" />
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
      {!isLoading && submissions && submissions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
            <p className="text-gray-500 mb-4">
              {statusFilter === "all"
                ? "Start logging your service hours to track your progress."
                : `No ${statusFilter.replace("_", " ")} submissions found.`}
            </p>
            {statusFilter === "all" && (
              <Link
                href="/submit-hours"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Hours
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submissions List */}
      {!isLoading && submissions && submissions.length > 0 && (
        <div className="space-y-3">
          {submissions.map((submission) => {
            const statusBadge = getStatusBadge(submission.status);
            return (
              <Link key={submission._id} href={`/submissions/${submission._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                          <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{submission.organizationName}</h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(submission.serviceDate)} • {submission.totalHours} hours
                          </p>
                          <p className="text-sm text-gray-400 mt-1 line-clamp-1">{submission.description}</p>
                          {submission.status === "revision_requested" && submission.reviewNotes && (
                            <p className="text-sm text-orange-600 mt-2">
                              Feedback: {submission.reviewNotes}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className={statusBadge.className}>
                        <span className="flex items-center">
                          {statusBadge.icon}
                          {statusBadge.label}
                        </span>
                      </Badge>
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
