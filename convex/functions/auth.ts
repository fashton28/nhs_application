import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Simple hash function (for demo - in production use bcrypt via an action)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Add salt and convert to hex-like string
  return "hash_" + Math.abs(hash).toString(16) + "_" + password.length;
}

// Generate a simple session token
function generateToken(): string {
  return "sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Sign up a new user
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.optional(v.union(
      v.literal("student"),
      v.literal("officer"),
      v.literal("admin")
    )),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      throw new Error("Email already in use");
    }

    // Create the user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      passwordHash: simpleHash(args.password),
      role: args.role || "student",
      isActive: true,
      createdAt: Date.now(),
    });

    // Create a session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { userId, token };
  },
});

// Sign in an existing user
export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check password
    if (user.passwordHash !== simpleHash(args.password)) {
      throw new Error("Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Create a new session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Update last login
    await ctx.db.patch(user._id, {
      lastLoginAt: Date.now(),
    });

    return { userId: user._id, token };
  },
});

// Sign out - invalidate session
export const signOut = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Get current user from session token
export const getCurrentUser = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) {
      return null;
    }

    const token = args.token;

    // Find session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      // Session expired - return null (cleanup happens in mutation)
      return null;
    }

    // Get user
    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      return null;
    }

    // Get profile if exists
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
        role: user.role || "student",
        isActive: user.isActive ?? true,
        profileId: user.profileId,
        createdAt: user.createdAt,
      },
      profile,
      unreadNotificationCount: unreadNotifications.length,
    };
  },
});
