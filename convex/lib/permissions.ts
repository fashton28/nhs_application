import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Type for user with role
interface UserWithRole {
  _id: Id<"users">;
  email?: string;
  name?: string;
  role?: "student" | "officer" | "admin";
  profileId?: Id<"profiles">;
  isActive?: boolean;
}

// Type for profile
interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  verificationStatus: "pending" | "verified" | "rejected";
  firstName: string;
  lastName: string;
  grade?: 9 | 10 | 11 | 12;
  totalApprovedHours?: number;
  totalPendingHours?: number;
  meetingsAttended?: number;
}

/**
 * Get user from session token
 * Returns null if token is invalid or expired
 */
export async function getUserFromToken(
  ctx: QueryCtx | MutationCtx,
  token: string | undefined
): Promise<UserWithRole | null> {
  if (!token) return null;

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .unique();

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  const user = await ctx.db.get(session.userId);
  if (!user || !user.isActive) {
    return null;
  }

  return user as UserWithRole;
}

/**
 * Require authenticated user
 * Throws if not authenticated
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx,
  token: string | undefined
): Promise<UserWithRole> {
  const user = await getUserFromToken(ctx, token);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

/**
 * Require admin role
 * Throws if not admin
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  token: string
): Promise<UserWithRole> {
  const user = await requireAuth(ctx, token);
  if (user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}

/**
 * Require admin or officer role
 * Used for shared permissions like managing opportunities
 */
export async function requireAdminOrOfficer(
  ctx: QueryCtx | MutationCtx,
  token: string
): Promise<UserWithRole> {
  const user = await requireAuth(ctx, token);
  if (user.role !== "admin" && user.role !== "officer") {
    throw new Error("Admin or officer access required");
  }
  return user;
}

/**
 * Require verified student profile
 * Used for actions that require profile verification (e.g., submitting hours)
 * Admins bypass verification requirement
 */
export async function requireVerifiedStudent(
  ctx: QueryCtx | MutationCtx,
  token: string
): Promise<{ user: UserWithRole; profile: Profile }> {
  const user = await requireAuth(ctx, token);

  // Admins don't need verification
  if (user.role === "admin") {
    // Return a minimal profile object for admins
    return {
      user,
      profile: {
        _id: user.profileId!,
        userId: user._id,
        verificationStatus: "verified",
        firstName: "",
        lastName: "",
      } as Profile,
    };
  }

  if (!user.profileId) {
    throw new Error("Please complete your profile first");
  }

  const profile = await ctx.db.get(user.profileId);
  if (!profile) {
    throw new Error("Profile not found");
  }

  if (profile.verificationStatus !== "verified") {
    throw new Error("Your profile must be verified before performing this action");
  }

  return { user, profile: profile as Profile };
}

/**
 * Require owner or admin
 * Used for actions on user's own resources that admins can also access
 */
export async function requireOwnerOrAdmin(
  ctx: QueryCtx | MutationCtx,
  token: string,
  ownerId: Id<"users">
): Promise<UserWithRole> {
  const user = await requireAuth(ctx, token);
  if (user._id !== ownerId && user.role !== "admin") {
    throw new Error("Access denied");
  }
  return user;
}

/**
 * Check if user has a specific role
 */
export function hasRole(
  user: UserWithRole,
  roles: ("student" | "officer" | "admin")[]
): boolean {
  return user.role ? roles.includes(user.role) : false;
}

/**
 * Check if user can view all submissions (admin or officer)
 */
export function canViewAllSubmissions(user: UserWithRole): boolean {
  return hasRole(user, ["admin", "officer"]);
}

/**
 * Check if user can approve submissions (admin only)
 */
export function canApproveSubmissions(user: UserWithRole): boolean {
  return hasRole(user, ["admin"]);
}

/**
 * Check if user can manage opportunities (admin or officer)
 */
export function canManageOpportunities(user: UserWithRole): boolean {
  return hasRole(user, ["admin", "officer"]);
}

/**
 * Check if user can manage meetings (admin only)
 */
export function canManageMeetings(user: UserWithRole): boolean {
  return hasRole(user, ["admin"]);
}

/**
 * Check if user can verify profiles (admin only)
 */
export function canVerifyProfiles(user: UserWithRole): boolean {
  return hasRole(user, ["admin"]);
}
