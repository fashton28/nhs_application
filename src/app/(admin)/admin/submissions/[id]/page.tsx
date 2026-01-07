"use client";

import { useState, useEffect, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Calendar,
  User,
  Mail,
  Phone,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState<"approve" | "deny" | "revision" | null>(null);

  // Load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("nhs_auth_token");
    setToken(storedToken);
  }, []);

  const submission = useQuery(
    api.functions.serviceHours.getSubmissionById,
    token
      ? {
          token,
          submissionId: id as Id<"serviceSubmissions">,
        }
      : "skip"
  );

  const reviewMutation = useMutation(api.functions.serviceHours.reviewSubmission);

  const isLoading = token && submission === undefined;
  const canReview = submission?.status === "pending" || submission?.status === "revision_requested";

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

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          className: "bg-yellow-100 text-yellow-700",
          icon: <Clock className="h-4 w-4 mr-1" />,
          label: "Pending Review",
        };
      case "approved":
        return {
          className: "bg-green-100 text-green-700",
          icon: <CheckCircle className="h-4 w-4 mr-1" />,
          label: "Approved",
        };
      case "denied":
        return {
          className: "bg-red-100 text-red-700",
          icon: <XCircle className="h-4 w-4 mr-1" />,
          label: "Denied",
        };
      case "revision_requested":
        return {
          className: "bg-orange-100 text-orange-700",
          icon: <AlertCircle className="h-4 w-4 mr-1" />,
          label: "Revision Requested",
        };
      default:
        return {
          className: "bg-gray-100 text-gray-700",
          icon: null,
          label: status,
        };
    }
  };

  const handleReview = async (decision: "approved" | "denied" | "revision_requested") => {
    if (!token || !submission) return;

    // Require notes for deny/revision
    if ((decision === "denied" || decision === "revision_requested") && !reviewNotes.trim()) {
      setError("Please provide feedback for the student.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await reviewMutation({
        token,
        submissionId: id as Id<"serviceSubmissions">,
        decision,
        notes: reviewNotes.trim() || undefined,
      });

      router.push("/admin/submissions");
    } catch (err) {
      console.error("Review error:", err);
      setError(err instanceof Error ? err.message : "Failed to submit review");
      setIsSubmitting(false);
      setShowConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Submission not found</h3>
            <p className="text-gray-500 mb-4">
              This submission may have been deleted or you don&apos;t have permission to view it.
            </p>
            <Link href="/admin/submissions">
              <Button variant="outline">Back to Submissions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusBadge = getStatusBadge(submission.status);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Back Link */}
      <Link
        href="/admin/submissions"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Submissions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Submission</h1>
          <p className="text-gray-500 mt-1">
            Submitted {formatTimestamp(submission.createdAt)}
          </p>
        </div>
        <Badge variant="secondary" className={`${statusBadge.className} text-sm px-3 py-1`}>
          <span className="flex items-center">
            {statusBadge.icon}
            {statusBadge.label}
          </span>
        </Badge>
      </div>

      {/* Student Info (if admin viewing) */}
      {submission.studentInfo && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{submission.studentInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{submission.studentInfo.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Grade</p>
                <p className="font-medium">
                  {submission.studentInfo.grade ? `Grade ${submission.studentInfo.grade}` : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Details */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Service Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Organization</p>
            <p className="font-medium text-lg">{submission.organizationName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{formatDate(submission.serviceDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hours</p>
              <p className="font-medium text-lg text-blue-600">{submission.totalHours} hours</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Start Time</p>
              <p className="font-medium">{formatTime(submission.startTime)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Time</p>
              <p className="font-medium">{formatTime(submission.endTime)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-gray-700 whitespace-pre-wrap">{submission.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Supervisor Info */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Supervisor Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span>{submission.supervisorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <a href={`mailto:${submission.supervisorEmail}`} className="text-blue-600 hover:underline">
              {submission.supervisorEmail}
            </a>
          </div>
          {submission.supervisorPhone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <a href={`tel:${submission.supervisorPhone}`} className="text-blue-600 hover:underline">
                {submission.supervisorPhone}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Review Notes (if any) */}
      {submission.reviewNotes && submission.status !== "pending" && (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-orange-800">Previous Review Feedback</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-orange-700">{submission.reviewNotes}</p>
            {submission.reviewedAt && (
              <p className="text-sm text-orange-600 mt-2">
                Reviewed on {formatTimestamp(submission.reviewedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resubmission Notice */}
      {submission.resubmissionCount > 0 && (
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700">
              This submission has been resubmitted {submission.resubmissionCount} time(s).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review Actions */}
      {canReview && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Review Decision</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div>
              <Label htmlFor="notes">Feedback / Notes (required for deny or revision)</Label>
              <Textarea
                id="notes"
                placeholder="Add feedback for the student..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirm && (
              <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                <p className="font-medium">
                  {showConfirm === "approve" && "Approve this submission?"}
                  {showConfirm === "deny" && "Deny this submission?"}
                  {showConfirm === "revision" && "Request revision for this submission?"}
                </p>
                <p className="text-sm text-gray-600">
                  {showConfirm === "approve" &&
                    `This will add ${submission.totalHours} hours to the student's approved total.`}
                  {showConfirm === "deny" &&
                    "The student will be notified and the hours will not count."}
                  {showConfirm === "revision" &&
                    "The student will be asked to update and resubmit."}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={showConfirm === "approve" ? "default" : "destructive"}
                    onClick={() =>
                      handleReview(
                        showConfirm === "approve"
                          ? "approved"
                          : showConfirm === "deny"
                          ? "denied"
                          : "revision_requested"
                      )
                    }
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Confirm"}
                  </Button>
                </div>
              </div>
            )}

            {!showConfirm && (
              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowConfirm("approve")}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  onClick={() => setShowConfirm("revision")}
                  disabled={isSubmitting}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Request Revision
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowConfirm("deny")}
                  disabled={isSubmitting}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Deny
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Already Reviewed Notice */}
      {!canReview && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4 text-center">
            <p className="text-gray-600">
              This submission has already been {submission.status.replace("_", " ")}.
            </p>
            {submission.reviewedAt && (
              <p className="text-sm text-gray-500 mt-1">
                Reviewed on {formatTimestamp(submission.reviewedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
