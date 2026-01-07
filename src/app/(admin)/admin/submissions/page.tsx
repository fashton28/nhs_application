"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

type StatusFilter = "pending" | "approved" | "denied" | "revision_requested";

export default function AdminSubmissionsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("nhs_auth_token");
    setToken(storedToken);
  }, []);

  // Query submissions with status filter
  const submissions = useQuery(
    api.functions.serviceHours.getPendingSubmissions,
    token
      ? {
          token,
          status: statusFilter,
        }
      : "skip"
  );

  const isLoading = token && submissions === undefined;

  // Filter submissions by search query
  const filteredSubmissions = submissions?.filter((submission) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      submission.studentName?.toLowerCase().includes(query) ||
      submission.organizationName.toLowerCase().includes(query) ||
      submission.studentEmail?.toLowerCase().includes(query)
    );
  });

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

  const filters: { value: StatusFilter; label: string; count?: number }[] = [
    { value: "pending", label: "Pending" },
    { value: "revision_requested", label: "Needs Revision" },
    { value: "approved", label: "Approved" },
    { value: "denied", label: "Denied" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Submissions</h1>
        <p className="text-gray-500 mt-1">Review and approve student service hours</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by student name or organization..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
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
      {!isLoading && filteredSubmissions && filteredSubmissions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {statusFilter.replace("_", " ")} submissions
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? "No submissions match your search criteria."
                : statusFilter === "pending"
                ? "All caught up! No submissions need review right now."
                : `No submissions with status "${statusFilter.replace("_", " ")}".`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submissions List */}
      {!isLoading && filteredSubmissions && filteredSubmissions.length > 0 && (
        <div className="space-y-3">
          {filteredSubmissions.map((submission) => {
            const statusBadge = getStatusBadge(submission.status);
            return (
              <Link key={submission._id} href={`/admin/submissions/${submission._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                          <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {submission.studentName}
                            </h3>
                            {submission.studentGrade && (
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                Grade {submission.studentGrade}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {submission.organizationName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(submission.serviceDate)} • {submission.totalHours} hours
                          </p>
                          <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                            {submission.description}
                          </p>
                          {submission.resubmissionCount > 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                              Resubmitted {submission.resubmissionCount} time(s)
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary" className={statusBadge.className}>
                          <span className="flex items-center">
                            {statusBadge.icon}
                            {statusBadge.label}
                          </span>
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
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
