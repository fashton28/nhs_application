import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import {
  getUserFromToken,
  requireAdmin,
  requireVerifiedStudent,
  requireAdminOrOfficer,
} from "../lib/permissions";

// Helper to calculate hours from time strings
function calculateHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  const diffMinutes = endMinutes - startMinutes;
  const hours = diffMinutes / 60;

  // Round to nearest 0.25
  return Math.round(hours * 4) / 4;
}

// ============ STUDENT FUNCTIONS ============

// Submit new service hours
export const submitServiceHours = mutation({
  args: {
    token: v.string(),
    organizationName: v.string(),
    serviceDate: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    description: v.string(),
    supervisorName: v.string(),
    supervisorEmail: v.string(),
    supervisorPhone: v.optional(v.string()),
    evidenceFileId: v.optional(v.id("_storage")),
    evidenceFileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require verified student profile to submit hours
    const { user, profile } = await requireVerifiedStudent(ctx, args.token);

    // Calculate total hours
    const totalHours = calculateHours(args.startTime, args.endTime);

    // Validate hours
    if (totalHours < 0.25) {
      throw new Error("Minimum submission is 0.25 hours (15 minutes)");
    }
    if (totalHours > 12) {
      throw new Error("Maximum submission is 12 hours per entry");
    }

    // Validate date is not in future
    const serviceDate = new Date(args.serviceDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (serviceDate > today) {
      throw new Error("Service date cannot be in the future");
    }

    // Validate description length
    if (args.description.length < 10) {
      throw new Error("Description must be at least 10 characters");
    }

    // Create the submission
    const submissionId = await ctx.db.insert("serviceSubmissions", {
      studentId: user._id,
      profileId: profile._id,
      organizationName: args.organizationName,
      serviceDate: args.serviceDate,
      startTime: args.startTime,
      endTime: args.endTime,
      totalHours,
      description: args.description,
      supervisorName: args.supervisorName,
      supervisorEmail: args.supervisorEmail,
      supervisorPhone: args.supervisorPhone,
      evidenceFileId: args.evidenceFileId,
      evidenceFileName: args.evidenceFileName,
      status: "pending",
      resubmissionCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update profile pending hours (profile is already verified from requireVerifiedStudent)
    await ctx.db.patch(profile._id, {
      totalPendingHours: (profile.totalPendingHours || 0) + totalHours,
      updatedAt: Date.now(),
    });

    return submissionId;
  },
});

// Get student's own submissions
export const getMySubmissions = query({
  args: {
    token: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("denied"),
      v.literal("revision_requested")
    )),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];

    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    // Store user ID for consistent comparison
    const userId = user._id;

    let submissions;
    if (args.status) {
      submissions = await ctx.db
        .query("serviceSubmissions")
        .withIndex("by_studentId_status", (q) =>
          q.eq("studentId", userId).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    } else {
      submissions = await ctx.db
        .query("serviceSubmissions")
        .withIndex("by_studentId", (q) => q.eq("studentId", userId))
        .order("desc")
        .collect();
    }

    // Safeguard filter to ensure data isolation - only return submissions owned by this user
    return submissions.filter(s => s.studentId === userId);
  },
});

// Get single submission by ID
export const getSubmissionById = query({
  args: {
    token: v.optional(v.string()),
    submissionId: v.id("serviceSubmissions"),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) return null;

    // Check access: owner or admin - return null to prevent info leakage
    if (submission.studentId !== user._id && user.role !== "admin") {
      return null;
    }

    // Get student info if admin is viewing
    let studentInfo = null;
    if (user.role === "admin" && submission.studentId !== user._id) {
      const student = await ctx.db.get(submission.studentId);
      const profile = submission.profileId ? await ctx.db.get(submission.profileId) : null;
      studentInfo = {
        name: profile ? `${profile.firstName} ${profile.lastName}` : student?.name,
        email: student?.email,
        grade: profile?.grade,
      };
    }

    return {
      ...submission,
      studentInfo,
    };
  },
});

// Update a pending submission
export const updateSubmission = mutation({
  args: {
    token: v.string(),
    submissionId: v.id("serviceSubmissions"),
    organizationName: v.optional(v.string()),
    serviceDate: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    description: v.optional(v.string()),
    supervisorName: v.optional(v.string()),
    supervisorEmail: v.optional(v.string()),
    supervisorPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Check ownership
    if (submission.studentId !== user._id) {
      throw new Error("Access denied");
    }

    // Check status
    if (submission.status !== "pending" && submission.status !== "revision_requested") {
      throw new Error("Cannot edit submission with status: " + submission.status);
    }

    // Build updates
    const updates: Record<string, any> = { updatedAt: Date.now() };

    if (args.organizationName !== undefined) updates.organizationName = args.organizationName;
    if (args.serviceDate !== undefined) updates.serviceDate = args.serviceDate;
    if (args.description !== undefined) updates.description = args.description;
    if (args.supervisorName !== undefined) updates.supervisorName = args.supervisorName;
    if (args.supervisorEmail !== undefined) updates.supervisorEmail = args.supervisorEmail;
    if (args.supervisorPhone !== undefined) updates.supervisorPhone = args.supervisorPhone;

    // Recalculate hours if time changed
    if (args.startTime !== undefined || args.endTime !== undefined) {
      const startTime = args.startTime || submission.startTime;
      const endTime = args.endTime || submission.endTime;
      const newHours = calculateHours(startTime, endTime);

      if (newHours < 0.25 || newHours > 12) {
        throw new Error("Hours must be between 0.25 and 12");
      }

      // Update profile pending hours
      if (user.profileId) {
        const profile = await ctx.db.get(user.profileId) as { totalPendingHours?: number } | null;
        if (profile) {
          const hoursDiff = newHours - submission.totalHours;
          await ctx.db.patch(user.profileId, {
            totalPendingHours: (profile.totalPendingHours || 0) + hoursDiff,
            updatedAt: Date.now(),
          });
        }
      }

      updates.startTime = startTime;
      updates.endTime = endTime;
      updates.totalHours = newHours;
    }

    // If revision_requested, change back to pending
    if (submission.status === "revision_requested") {
      updates.status = "pending";
      updates.resubmissionCount = submission.resubmissionCount + 1;
    }

    await ctx.db.patch(args.submissionId, updates);
  },
});

// Delete a pending submission
export const deleteSubmission = mutation({
  args: {
    token: v.string(),
    submissionId: v.id("serviceSubmissions"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Check ownership
    if (submission.studentId !== user._id) {
      throw new Error("Access denied");
    }

    // Check status - can only delete pending
    if (submission.status !== "pending") {
      throw new Error("Can only delete pending submissions");
    }

    // Update profile pending hours
    if (user.profileId) {
      const profile = await ctx.db.get(user.profileId) as { totalPendingHours?: number } | null;
      if (profile) {
        await ctx.db.patch(user.profileId, {
          totalPendingHours: Math.max(0, (profile.totalPendingHours || 0) - submission.totalHours),
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.delete(args.submissionId);
  },
});

// ============ ADMIN FUNCTIONS ============

// Get all submissions for admin review
export const getPendingSubmissions = query({
  args: {
    token: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("denied"),
      v.literal("revision_requested")
    )),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];

    const user = await getUserFromToken(ctx, args.token);
    if (!user || user.role !== "admin") return [];

    let submissions;
    if (args.status) {
      submissions = await ctx.db
        .query("serviceSubmissions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      // Default to pending
      submissions = await ctx.db
        .query("serviceSubmissions")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .order("desc")
        .collect();
    }

    // Enrich with student info
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        const student = await ctx.db.get(submission.studentId);
        const profile = submission.profileId ? await ctx.db.get(submission.profileId) : null;

        return {
          ...submission,
          studentName: profile ? `${profile.firstName} ${profile.lastName}` : student?.name || "Unknown",
          studentEmail: student?.email,
          studentGrade: profile?.grade,
        };
      })
    );

    return enrichedSubmissions;
  },
});

// Get admin dashboard stats
export const getAdminStats = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const user = await getUserFromToken(ctx, args.token);
    if (!user || user.role !== "admin") return null;

    // Count pending submissions
    const pendingSubmissions = await ctx.db
      .query("serviceSubmissions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Count unverified students
    const unverifiedProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_verificationStatus", (q) => q.eq("verificationStatus", "pending"))
      .collect();

    // Get this month's stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const allSubmissions = await ctx.db
      .query("serviceSubmissions")
      .collect();

    let approvedThisMonth = 0;
    let deniedThisMonth = 0;

    for (const sub of allSubmissions) {
      if (sub.reviewedAt && sub.reviewedAt >= startOfMonth) {
        if (sub.status === "approved") {
          approvedThisMonth += sub.totalHours;
        } else if (sub.status === "denied") {
          deniedThisMonth++;
        }
      }
    }

    return {
      pendingSubmissions: pendingSubmissions.length,
      unverifiedStudents: unverifiedProfiles.length,
      approvedHoursThisMonth: Math.round(approvedThisMonth * 10) / 10,
      deniedThisMonth,
    };
  },
});

// Review a submission (approve/deny/request revision)
export const reviewSubmission = mutation({
  args: {
    token: v.string(),
    submissionId: v.id("serviceSubmissions"),
    decision: v.union(
      v.literal("approved"),
      v.literal("denied"),
      v.literal("revision_requested")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Require notes for denial or revision request
    if ((args.decision === "denied" || args.decision === "revision_requested") && !args.notes) {
      throw new Error("Notes are required when denying or requesting revision");
    }

    // Get the student's profile
    const profile = submission.profileId
      ? (await ctx.db.get(submission.profileId) as { totalApprovedHours?: number; totalPendingHours?: number } | null)
      : null;

    // Update submission
    await ctx.db.patch(args.submissionId, {
      status: args.decision,
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
      reviewNotes: args.notes,
      updatedAt: Date.now(),
    });

    // Update profile hours based on decision
    if (profile) {
      if (args.decision === "approved") {
        await ctx.db.patch(submission.profileId!, {
          totalApprovedHours: (profile.totalApprovedHours || 0) + submission.totalHours,
          totalPendingHours: Math.max(0, (profile.totalPendingHours || 0) - submission.totalHours),
          updatedAt: Date.now(),
        });
      } else if (args.decision === "denied") {
        await ctx.db.patch(submission.profileId!, {
          totalPendingHours: Math.max(0, (profile.totalPendingHours || 0) - submission.totalHours),
          updatedAt: Date.now(),
        });
      }
      // For revision_requested, hours stay in pending
    }

    return { success: true };
  },
});
