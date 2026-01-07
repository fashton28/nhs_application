import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import {
  getUserFromToken,
  requireAdmin,
  requireVerifiedStudent,
} from "../lib/permissions";

// Generate a random 6-character alphanumeric code
function generateCheckInCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like 0/O, 1/I
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============ MEETING QUERIES ============

// List all meetings (any authenticated user)
export const listMeetings = query({
  args: {
    token: v.optional(v.string()),
    upcoming: v.optional(v.boolean()),
    past: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];

    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    const meetings = await ctx.db
      .query("meetings")
      .order("desc")
      .collect();

    const today = new Date().toISOString().split("T")[0];

    // Filter based on upcoming/past
    if (args.upcoming) {
      return meetings.filter((m) => m.scheduledDate >= today);
    }
    if (args.past) {
      return meetings.filter((m) => m.scheduledDate < today);
    }

    return meetings;
  },
});

// Get a single meeting
export const getMeeting = query({
  args: {
    token: v.optional(v.string()),
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) return null;

    // Get creator info
    const creator = await ctx.db.get(meeting.createdBy);

    // For admins, include the check-in code
    const includeCode = user.role === "admin";

    return {
      ...meeting,
      creatorName: creator?.name || "Unknown",
      currentCheckInCode: includeCode ? meeting.currentCheckInCode : undefined,
      codeExpiresAt: includeCode ? meeting.codeExpiresAt : undefined,
    };
  },
});

// Get meeting attendance list (admin only)
export const getMeetingAttendance = query({
  args: {
    token: v.optional(v.string()),
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const user = await getUserFromToken(ctx, args.token);
    if (!user || user.role !== "admin") return null;

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) return null;

    // Get all attendance records for this meeting
    const records = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_meetingId", (q) => q.eq("meetingId", args.meetingId))
      .collect();

    // Enrich with student info
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        const profile = await ctx.db.get(record.profileId);
        const student = await ctx.db.get(record.studentId);
        return {
          ...record,
          studentName: profile ? `${profile.firstName} ${profile.lastName}` : "Unknown",
          studentEmail: student?.email,
          studentGrade: profile?.grade,
        };
      })
    );

    // Get total verified students count
    const verifiedProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_verificationStatus", (q) => q.eq("verificationStatus", "verified"))
      .collect();

    return {
      meeting,
      records: enrichedRecords,
      presentCount: records.filter((r) => r.status === "present").length,
      excusedCount: records.filter((r) => r.status === "excused").length,
      totalStudents: verifiedProfiles.length,
    };
  },
});

// Check if student has checked in to a meeting
export const getMyAttendance = query({
  args: {
    token: v.optional(v.string()),
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    const record = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_meetingId_studentId", (q) =>
        q.eq("meetingId", args.meetingId).eq("studentId", user._id)
      )
      .unique();

    return record;
  },
});

// Get active meeting with open check-in (for student check-in page)
export const getActiveMeetingForCheckIn = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    // Find meeting with open check-in
    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_checkInStatus", (q) => q.eq("checkInStatus", "open"))
      .collect();

    if (meetings.length === 0) return null;

    // Return the most recent one (in case multiple are open somehow)
    const meeting = meetings[0];

    // Check if student already checked in
    const existingRecord = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_meetingId_studentId", (q) =>
        q.eq("meetingId", meeting._id).eq("studentId", user._id)
      )
      .unique();

    return {
      ...meeting,
      alreadyCheckedIn: !!existingRecord,
      checkInTime: existingRecord?.checkInTimestamp,
    };
  },
});

// Get student's attendance stats
export const getAttendanceStats = query({
  args: {
    token: v.optional(v.string()),
    studentId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    // If studentId provided and user is admin, get that student's stats
    // Otherwise get current user's stats
    const targetUserId = args.studentId && user.role === "admin" ? args.studentId : user._id;

    const records = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_studentId", (q) => q.eq("studentId", targetUserId))
      .collect();

    const totalMeetings = await ctx.db.query("meetings").collect();
    const pastMeetings = totalMeetings.filter(
      (m) => m.scheduledDate < new Date().toISOString().split("T")[0]
    );

    const attended = records.filter((r) => r.status === "present").length;
    const excused = records.filter((r) => r.status === "excused").length;

    return {
      attended,
      excused,
      total: pastMeetings.length,
      percentage: pastMeetings.length > 0 ? Math.round((attended / pastMeetings.length) * 100) : 0,
    };
  },
});

// ============ MEETING MUTATIONS (Admin only) ============

// Create a new meeting
export const createMeeting = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.string(),
    scheduledDate: v.string(),
    scheduledStartTime: v.string(),
    scheduledEndTime: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);

    // Validate required fields
    if (!args.title.trim()) {
      throw new Error("Title is required");
    }
    if (!args.location.trim()) {
      throw new Error("Location is required");
    }

    const meetingId = await ctx.db.insert("meetings", {
      title: args.title.trim(),
      description: args.description?.trim(),
      location: args.location.trim(),
      scheduledDate: args.scheduledDate,
      scheduledStartTime: args.scheduledStartTime,
      scheduledEndTime: args.scheduledEndTime,
      checkInStatus: "not_started",
      attendeeCount: 0,
      createdBy: admin._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return meetingId;
  },
});

// Update a meeting
export const updateMeeting = mutation({
  args: {
    token: v.string(),
    meetingId: v.id("meetings"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    scheduledDate: v.optional(v.string()),
    scheduledStartTime: v.optional(v.string()),
    scheduledEndTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.title !== undefined) updates.title = args.title.trim();
    if (args.description !== undefined) updates.description = args.description?.trim();
    if (args.location !== undefined) updates.location = args.location.trim();
    if (args.scheduledDate !== undefined) updates.scheduledDate = args.scheduledDate;
    if (args.scheduledStartTime !== undefined) updates.scheduledStartTime = args.scheduledStartTime;
    if (args.scheduledEndTime !== undefined) updates.scheduledEndTime = args.scheduledEndTime;

    await ctx.db.patch(args.meetingId, updates);

    return { success: true };
  },
});

// Delete a meeting
export const deleteMeeting = mutation({
  args: {
    token: v.string(),
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    // Don't allow deleting if check-in has started
    if (meeting.checkInStatus !== "not_started") {
      throw new Error("Cannot delete a meeting that has started check-in");
    }

    await ctx.db.delete(args.meetingId);

    return { success: true };
  },
});

// ============ CHECK-IN CONTROL (Admin only) ============

// Open check-in for a meeting (generates first code)
export const openCheckIn = mutation({
  args: {
    token: v.string(),
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    if (meeting.checkInStatus === "open") {
      throw new Error("Check-in is already open");
    }

    if (meeting.checkInStatus === "closed") {
      throw new Error("Check-in has already been closed for this meeting");
    }

    const code = generateCheckInCode();
    const now = Date.now();
    const expiresAt = now + 60 * 1000; // 60 seconds

    await ctx.db.patch(args.meetingId, {
      checkInStatus: "open",
      checkInOpenedAt: now,
      currentCheckInCode: code,
      codeGeneratedAt: now,
      codeExpiresAt: expiresAt,
      updatedAt: now,
    });

    return { code, expiresAt };
  },
});

// Refresh the check-in code (generates new code)
export const refreshCheckInCode = mutation({
  args: {
    token: v.string(),
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    if (meeting.checkInStatus !== "open") {
      throw new Error("Check-in is not open");
    }

    const code = generateCheckInCode();
    const now = Date.now();
    const expiresAt = now + 60 * 1000; // 60 seconds

    await ctx.db.patch(args.meetingId, {
      currentCheckInCode: code,
      codeGeneratedAt: now,
      codeExpiresAt: expiresAt,
      updatedAt: now,
    });

    return { code, expiresAt };
  },
});

// Close check-in for a meeting
export const closeCheckIn = mutation({
  args: {
    token: v.string(),
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    if (meeting.checkInStatus === "not_started") {
      throw new Error("Check-in has not started yet");
    }

    if (meeting.checkInStatus === "closed") {
      throw new Error("Check-in is already closed");
    }

    await ctx.db.patch(args.meetingId, {
      checkInStatus: "closed",
      checkInClosedAt: Date.now(),
      currentCheckInCode: undefined,
      codeExpiresAt: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============ STUDENT CHECK-IN ============

// Student check-in with code
export const checkIn = mutation({
  args: {
    token: v.string(),
    meetingId: v.id("meetings"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, profile } = await requireVerifiedStudent(ctx, args.token);

    if (!user.profileId) {
      throw new Error("Profile required to check in");
    }

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    // Check if check-in is open
    if (meeting.checkInStatus !== "open") {
      throw new Error("Check-in is not currently open for this meeting");
    }

    // Check if already checked in
    const existingRecord = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_meetingId_studentId", (q) =>
        q.eq("meetingId", args.meetingId).eq("studentId", user._id)
      )
      .unique();

    if (existingRecord) {
      throw new Error("You have already checked in to this meeting");
    }

    // Validate code
    const submittedCode = args.code.toUpperCase().trim();
    if (submittedCode !== meeting.currentCheckInCode) {
      throw new Error("Invalid check-in code");
    }

    // Check if code is expired
    if (meeting.codeExpiresAt && Date.now() > meeting.codeExpiresAt) {
      throw new Error("Check-in code has expired. Please use the current code.");
    }

    // Create attendance record
    await ctx.db.insert("attendanceRecords", {
      meetingId: args.meetingId,
      studentId: user._id,
      profileId: user.profileId,
      checkInTimestamp: Date.now(),
      verificationMethod: "rotating_code",
      codeUsed: submittedCode,
      status: "present",
      createdAt: Date.now(),
    });

    // Update meeting attendee count
    await ctx.db.patch(args.meetingId, {
      attendeeCount: meeting.attendeeCount + 1,
      updatedAt: Date.now(),
    });

    // Update profile meetings attended
    const studentProfile = await ctx.db.get(user.profileId);
    if (studentProfile) {
      await ctx.db.patch(user.profileId, {
        meetingsAttended: (studentProfile.meetingsAttended || 0) + 1,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// ============ MANUAL ATTENDANCE (Admin only) ============

// Manually add attendance for a student
export const manualCheckIn = mutation({
  args: {
    token: v.string(),
    meetingId: v.id("meetings"),
    studentId: v.id("users"),
    status: v.union(v.literal("present"), v.literal("excused")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    const student = await ctx.db.get(args.studentId);
    if (!student || !student.profileId) {
      throw new Error("Student not found or has no profile");
    }

    // Check if record already exists
    const existingRecord = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_meetingId_studentId", (q) =>
        q.eq("meetingId", args.meetingId).eq("studentId", args.studentId)
      )
      .unique();

    if (existingRecord) {
      // Update existing record
      await ctx.db.patch(existingRecord._id, {
        status: args.status,
        manuallyVerifiedBy: admin._id,
        notes: args.notes,
        verificationMethod: "manual_admin",
      });
    } else {
      // Create new record
      await ctx.db.insert("attendanceRecords", {
        meetingId: args.meetingId,
        studentId: args.studentId,
        profileId: student.profileId,
        checkInTimestamp: Date.now(),
        verificationMethod: "manual_admin",
        status: args.status,
        manuallyVerifiedBy: admin._id,
        notes: args.notes,
        createdAt: Date.now(),
      });

      // Update meeting attendee count only for new records
      if (args.status === "present") {
        await ctx.db.patch(args.meetingId, {
          attendeeCount: meeting.attendeeCount + 1,
          updatedAt: Date.now(),
        });

        // Update profile meetings attended
        const profile = await ctx.db.get(student.profileId);
        if (profile) {
          await ctx.db.patch(student.profileId, {
            meetingsAttended: (profile.meetingsAttended || 0) + 1,
            updatedAt: Date.now(),
          });
        }
      }
    }

    return { success: true };
  },
});

// Update attendance status (e.g., mark as excused)
export const updateAttendanceStatus = mutation({
  args: {
    token: v.string(),
    recordId: v.id("attendanceRecords"),
    status: v.union(v.literal("present"), v.literal("excused"), v.literal("invalidated")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);

    const record = await ctx.db.get(args.recordId);
    if (!record) {
      throw new Error("Attendance record not found");
    }

    const previousStatus = record.status;

    await ctx.db.patch(args.recordId, {
      status: args.status,
      manuallyVerifiedBy: admin._id,
      notes: args.notes,
    });

    // Update counts if status changed between present and non-present
    const meeting = await ctx.db.get(record.meetingId);
    const profile = await ctx.db.get(record.profileId);

    if (meeting) {
      if (previousStatus === "present" && args.status !== "present") {
        // Was present, now not - decrement
        await ctx.db.patch(record.meetingId, {
          attendeeCount: Math.max(0, meeting.attendeeCount - 1),
        });
        if (profile) {
          await ctx.db.patch(record.profileId, {
            meetingsAttended: Math.max(0, (profile.meetingsAttended || 0) - 1),
          });
        }
      } else if (previousStatus !== "present" && args.status === "present") {
        // Was not present, now is - increment
        await ctx.db.patch(record.meetingId, {
          attendeeCount: meeting.attendeeCount + 1,
        });
        if (profile) {
          await ctx.db.patch(record.profileId, {
            meetingsAttended: (profile.meetingsAttended || 0) + 1,
          });
        }
      }
    }

    return { success: true };
  },
});
