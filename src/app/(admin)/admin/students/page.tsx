"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  UserCheck,
  UserX,
  GraduationCap,
} from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";

type StatusFilter = "all" | "pending" | "verified" | "rejected";

interface StudentProfile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  firstName: string;
  lastName: string;
  grade: 9 | 10 | 11 | 12;
  studentId?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  totalApprovedHours: number;
  totalPendingHours: number;
  meetingsAttended: number;
  email?: string;
  createdAt: number;
}

export default function AdminStudentsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("nhs_auth_token");
    setToken(storedToken);
  }, []);

  // Mutations
  const verifyProfile = useMutation(api.functions.users.verifyProfile);
  const rejectProfile = useMutation(api.functions.users.rejectProfile);

  // Query students with status filter
  const students = useQuery(
    api.functions.users.listAllStudents,
    token
      ? {
          token,
          verificationStatus: statusFilter === "all" ? undefined : statusFilter,
          search: searchQuery || undefined,
        }
      : "skip"
  ) as StudentProfile[] | undefined;

  const isLoading = token && students === undefined;

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          className: "bg-yellow-100 text-yellow-700",
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: "Pending",
        };
      case "verified":
        return {
          className: "bg-green-100 text-green-700",
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          label: "Verified",
        };
      case "rejected":
        return {
          className: "bg-red-100 text-red-700",
          icon: <XCircle className="h-3 w-3 mr-1" />,
          label: "Rejected",
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
    { value: "pending", label: "Pending" },
    { value: "verified", label: "Verified" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
  ];

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle verify profile
  const handleVerify = async () => {
    if (!selectedProfile || !token) return;

    setIsSubmitting(true);
    try {
      await verifyProfile({
        token,
        profileId: selectedProfile._id,
      });
      setVerifyDialogOpen(false);
      setSelectedProfile(null);
    } catch (error) {
      console.error("Failed to verify profile:", error);
      alert("Failed to verify profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject profile
  const handleReject = async () => {
    if (!selectedProfile || !token || !rejectionReason.trim()) return;

    setIsSubmitting(true);
    try {
      await rejectProfile({
        token,
        profileId: selectedProfile._id,
        reason: rejectionReason.trim(),
      });
      setRejectDialogOpen(false);
      setSelectedProfile(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Failed to reject profile:", error);
      alert("Failed to reject profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open verify dialog
  const openVerifyDialog = (profile: StudentProfile) => {
    setSelectedProfile(profile);
    setVerifyDialogOpen(true);
  };

  // Open reject dialog
  const openRejectDialog = (profile: StudentProfile) => {
    setSelectedProfile(profile);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-500 mt-1">Manage student profiles and verification</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
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
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200" />
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
      {!isLoading && students && students.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-500">
              {statusFilter === "pending"
                ? "No students pending verification."
                : searchQuery
                ? "No students match your search."
                : "No students in this category."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      {!isLoading && students && students.length > 0 && (
        <div className="space-y-3">
          {students.map((student) => {
            const statusBadge = getStatusBadge(student.verificationStatus);
            return (
              <Card key={student._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                        <span className="text-lg font-semibold text-blue-600">
                          {student.firstName[0]}{student.lastName[0]}
                        </span>
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{student.email}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            Grade {student.grade}
                          </span>
                          {student.studentId && (
                            <span>ID: {student.studentId}</span>
                          )}
                          <span>Joined {formatDate(student.createdAt)}</span>
                        </div>
                        {student.verificationStatus === "rejected" && student.rejectionReason && (
                          <p className="text-sm text-red-600 mt-1">
                            Reason: {student.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center gap-3">
                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-4 text-sm text-gray-500 mr-4">
                        <span>{student.totalApprovedHours} hrs approved</span>
                        <span>{student.meetingsAttended} meetings</span>
                      </div>

                      {/* Status Badge */}
                      <Badge variant="secondary" className={statusBadge.className}>
                        <span className="flex items-center">
                          {statusBadge.icon}
                          {statusBadge.label}
                        </span>
                      </Badge>

                      {/* Action Buttons */}
                      {student.verificationStatus === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => openVerifyDialog(student)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => openRejectDialog(student)}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {student.verificationStatus === "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => openVerifyDialog(student)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Student Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to verify {selectedProfile?.firstName} {selectedProfile?.lastName}&apos;s profile?
              They will be able to submit service hours once verified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Verifying..." : "Verify Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Student Profile</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedProfile?.firstName} {selectedProfile?.lastName}&apos;s profile.
              The student will be notified with this reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
              variant="destructive"
            >
              {isSubmitting ? "Rejecting..." : "Reject Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
