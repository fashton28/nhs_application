import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============ USER & AUTH ============
  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal("student"),
      v.literal("officer"),
      v.literal("admin")
    )),
    profileId: v.optional(v.id("profiles")),
    isActive: v.optional(v.boolean()),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  })
    .index("by_email", ["email"]),

  // Sessions for auth
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  profiles: defineTable({
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    grade: v.union(
      v.literal(9),
      v.literal(10),
      v.literal(11),
      v.literal(12)
    ),
    studentId: v.optional(v.string()),
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected")
    ),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id("users")),
    rejectionReason: v.optional(v.string()),
    totalApprovedHours: v.number(),
    totalPendingHours: v.number(),
    meetingsAttended: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_verificationStatus", ["verificationStatus"])
    .index("by_grade", ["grade"])
    .index("by_lastName", ["lastName"]),

  // ============ SERVICE HOURS ============

  serviceSubmissions: defineTable({
    studentId: v.id("users"),
    profileId: v.id("profiles"),
    organizationName: v.string(),
    serviceDate: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    totalHours: v.number(),
    description: v.string(),
    supervisorName: v.string(),
    supervisorEmail: v.string(),
    supervisorPhone: v.optional(v.string()),
    evidenceFileId: v.optional(v.id("_storage")),
    evidenceFileName: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("denied"),
      v.literal("revision_requested")
    ),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),
    previousSubmissionId: v.optional(v.id("serviceSubmissions")),
    resubmissionCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_studentId", ["studentId"])
    .index("by_status", ["status"])
    .index("by_studentId_status", ["studentId", "status"])
    .index("by_serviceDate", ["serviceDate"])
    .index("by_createdAt", ["createdAt"])
    .index("by_reviewedBy", ["reviewedBy"]),

  // ============ ATTENDANCE ============

  meetings: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    location: v.string(),
    scheduledDate: v.string(),
    scheduledStartTime: v.string(),
    scheduledEndTime: v.string(),
    checkInStatus: v.union(
      v.literal("not_started"),
      v.literal("open"),
      v.literal("closed")
    ),
    checkInOpenedAt: v.optional(v.number()),
    checkInClosedAt: v.optional(v.number()),
    currentCheckInCode: v.optional(v.string()),
    codeGeneratedAt: v.optional(v.number()),
    codeExpiresAt: v.optional(v.number()),
    attendeeCount: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_scheduledDate", ["scheduledDate"])
    .index("by_checkInStatus", ["checkInStatus"])
    .index("by_createdAt", ["createdAt"]),

  attendanceRecords: defineTable({
    meetingId: v.id("meetings"),
    studentId: v.id("users"),
    profileId: v.id("profiles"),
    checkInTimestamp: v.number(),
    verificationMethod: v.union(
      v.literal("rotating_code"),
      v.literal("manual_admin"),
      v.literal("retroactive")
    ),
    codeUsed: v.optional(v.string()),
    status: v.union(
      v.literal("present"),
      v.literal("excused"),
      v.literal("invalidated")
    ),
    manuallyVerifiedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    deviceHash: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_meetingId", ["meetingId"])
    .index("by_studentId", ["studentId"])
    .index("by_meetingId_studentId", ["meetingId", "studentId"])
    .index("by_status", ["status"]),

  // ============ OPPORTUNITIES ============

  opportunities: defineTable({
    title: v.string(),
    description: v.string(),
    organizationName: v.string(),
    location: v.optional(v.string()),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    externalLink: v.optional(v.string()),
    tags: v.array(v.string()),
    estimatedHours: v.optional(v.number()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isOngoing: v.boolean(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_isActive", ["isActive"])
    .index("by_createdAt", ["createdAt"]),

  // ============ NOTIFICATIONS ============

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("submission_received"),
      v.literal("submission_approved"),
      v.literal("submission_denied"),
      v.literal("submission_revision_requested"),
      v.literal("meeting_reminder"),
      v.literal("meeting_checkin_open"),
      v.literal("new_opportunity"),
      v.literal("announcement"),
      v.literal("profile_verified"),
      v.literal("profile_rejected")
    ),
    title: v.string(),
    message: v.string(),
    relatedSubmissionId: v.optional(v.id("serviceSubmissions")),
    relatedMeetingId: v.optional(v.id("meetings")),
    relatedOpportunityId: v.optional(v.id("opportunities")),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    emailSent: v.boolean(),
    emailSentAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"])
    .index("by_createdAt", ["createdAt"]),

  // ============ AUDIT ============

  auditLogs: defineTable({
    actorId: v.id("users"),
    actorRole: v.string(),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    previousValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_actorId", ["actorId"])
    .index("by_entityType_entityId", ["entityType", "entityId"])
    .index("by_action", ["action"])
    .index("by_createdAt", ["createdAt"]),
});
