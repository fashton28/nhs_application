import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { getUserFromToken, requireAdmin } from "../lib/permissions";

// Get the current authenticated user with their profile
export const getMe = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return null;
    }

    let profile = null;
    if (user.profileId) {
      profile = await ctx.db.get(user.profileId);
    }

    // Get unread notification count
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        profileId: user.profileId,
      },
      profile,
      unreadNotificationCount: unreadNotifications.length,
    };
  },
});

// Create a profile for the current user
export const createProfile = mutation({
  args: {
    token: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    grade: v.union(
      v.literal(9),
      v.literal(10),
      v.literal(11),
      v.literal(12)
    ),
    studentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (user.profileId) {
      throw new Error("Profile already exists");
    }

    // Create the profile
    const profileId = await ctx.db.insert("profiles", {
      userId: user._id,
      firstName: args.firstName,
      lastName: args.lastName,
      grade: args.grade,
      studentId: args.studentId,
      verificationStatus: "pending",
      totalApprovedHours: 0,
      totalPendingHours: 0,
      meetingsAttended: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update user with profile reference
    await ctx.db.patch(user._id, {
      profileId,
    });

    return profileId;
  },
});

// Update profile
export const updateProfile = mutation({
  args: {
    token: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    grade: v.optional(v.union(
      v.literal(9),
      v.literal(10),
      v.literal(11),
      v.literal(12)
    )),
    studentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (!user.profileId) {
      throw new Error("Profile not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.grade !== undefined) updates.grade = args.grade;
    if (args.studentId !== undefined) updates.studentId = args.studentId;

    await ctx.db.patch(user.profileId, updates);
  },
});

// ============ ADMIN FUNCTIONS ============

// List all students with their profiles (admin only)
export const listAllStudents = query({
  args: {
    token: v.optional(v.string()),
    verificationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected")
    )),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];

    const admin = await getUserFromToken(ctx, args.token);
    if (!admin || admin.role !== "admin") return [];

    // Get all profiles
    let profiles;
    if (args.verificationStatus) {
      profiles = await ctx.db
        .query("profiles")
        .withIndex("by_verificationStatus", (q) =>
          q.eq("verificationStatus", args.verificationStatus!)
        )
        .collect();
    } else {
      profiles = await ctx.db.query("profiles").collect();
    }

    // Enrich with user info
    const enrichedProfiles = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          email: user?.email,
          role: user?.role,
          isActive: user?.isActive,
        };
      })
    );

    // Apply search filter if provided
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      return enrichedProfiles.filter(
        (p) =>
          p.firstName.toLowerCase().includes(searchLower) ||
          p.lastName.toLowerCase().includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower)
      );
    }

    return enrichedProfiles;
  },
});

// List pending profiles for verification (admin only)
export const listPendingProfiles = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];

    const admin = await getUserFromToken(ctx, args.token);
    if (!admin || admin.role !== "admin") return [];

    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_verificationStatus", (q) =>
        q.eq("verificationStatus", "pending")
      )
      .collect();

    // Enrich with user info
    const enrichedProfiles = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          email: user?.email,
        };
      })
    );

    return enrichedProfiles;
  },
});

// Verify a student profile (admin only)
export const verifyProfile = mutation({
  args: {
    token: v.string(),
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.verificationStatus === "verified") {
      throw new Error("Profile is already verified");
    }

    // Update profile status
    await ctx.db.patch(args.profileId, {
      verificationStatus: "verified",
      verifiedAt: Date.now(),
      verifiedBy: admin._id,
      rejectionReason: undefined,
      updatedAt: Date.now(),
    });

    // Create notification for the student
    await ctx.db.insert("notifications", {
      userId: profile.userId,
      type: "profile_verified",
      title: "Profile Verified",
      message: "Your NHS profile has been verified. You can now submit service hours.",
      isRead: false,
      emailSent: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Reject a student profile (admin only)
export const rejectProfile = mutation({
  args: {
    token: v.string(),
    profileId: v.id("profiles"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);

    if (!args.reason || args.reason.trim().length === 0) {
      throw new Error("Rejection reason is required");
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    // Update profile status
    await ctx.db.patch(args.profileId, {
      verificationStatus: "rejected",
      rejectionReason: args.reason,
      verifiedBy: admin._id,
      updatedAt: Date.now(),
    });

    // Create notification for the student
    await ctx.db.insert("notifications", {
      userId: profile.userId,
      type: "profile_rejected",
      title: "Profile Verification Issue",
      message: `Your profile verification was not approved. Reason: ${args.reason}`,
      isRead: false,
      emailSent: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get a single student's details (admin only)
export const getStudentDetails = query({
  args: {
    token: v.optional(v.string()),
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const admin = await getUserFromToken(ctx, args.token);
    if (!admin || admin.role !== "admin") return null;

    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    const user = await ctx.db.get(profile.userId);

    // Get recent submissions
    const submissions = await ctx.db
      .query("serviceSubmissions")
      .withIndex("by_studentId", (q) => q.eq("studentId", profile.userId))
      .order("desc")
      .take(10);

    // Get attendance records
    const attendance = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_studentId", (q) => q.eq("studentId", profile.userId))
      .order("desc")
      .take(10);

    return {
      profile,
      user: user ? {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      } : null,
      recentSubmissions: submissions,
      recentAttendance: attendance,
    };
  },
});
