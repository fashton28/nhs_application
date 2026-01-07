"use client";

import { useState, useEffect, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const deleteMutation = useMutation(api.functions.serviceHours.deleteSubmission);

  const isLoading = token && submission === undefined;
  const canEdit = submission?.status === "pending" || submission?.status === "revision_requested";
  const canDelete = submission?.status === "pending";

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
          description: "Your submission is awaiting review by an administrator.",
        };
      case "approved":
        return {
          className: "bg-green-100 text-green-700",
          icon: <CheckCircle className="h-4 w-4 mr-1" />,
          label: "Approved",
          description: "These hours have been approved and added to your total.",
        };
      case "denied":
        return {
          className: "bg-red-100 text-red-700",
          icon: <XCircle className="h-4 w-4 mr-1" />,
          label: "Denied",
          description: "This submission was not approved. See the feedback below.",
        };
      case "revision_requested":
        return {
          className: "bg-orange-100 text-orange-700",
          icon: <AlertCircle className="h-4 w-4 mr-1" />,
          label: "Revision Needed",
          description: "Please review the feedback and update your submission.",
        };
      default:
        return {
          className: "bg-gray-100 text-gray-700",
          icon: null,
          label: status,
          description: "",
        };
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    setIsDeleting(true);
    try {
      await deleteMutation({
        token,
        submissionId: id as Id<"serviceSubmissions">,
      });
      router.push("/submissions");
    } catch (err) {
      console.error("Delete error:", err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
            <Link href="/submissions">
              <Button variant="outline">Back to Submissions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusBadge = getStatusBadge(submission.status);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Back Link */}
      <Link
        href="/submissions"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Submissions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submission Details</h1>
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

      {/* Status Message */}
      <Card className={`mb-4 ${statusBadge.className.replace("text-", "border-").replace("100", "200")} bg-opacity-50`}>
        <CardContent className="p-4">
          <p className="text-sm">{statusBadge.description}</p>
        </CardContent>
      </Card>

      {/* Review Feedback (if any) */}
      {submission.reviewNotes && (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-orange-800">Reviewer Feedback</CardTitle>
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
            <span>{submission.supervisorEmail}</span>
          </div>
          {submission.supervisorPhone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{submission.supervisorPhone}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {(canEdit || canDelete) && (
        <Card>
          <CardContent className="p-4">
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete this submission? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Submission"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                {canEdit && (
                  <Link href={`/submissions/${id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Submission
                    </Button>
                  </Link>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
