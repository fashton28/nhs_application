import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { getUserFromToken, requireAdminOrOfficer } from "../lib/permissions";

// ============ QUERIES ============

// List all active opportunities (any authenticated user)
export const listOpportunities = query({
  args: {
    token: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isOngoing: v.optional(v.boolean()),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];

    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    // Get opportunities based on active status
    let opportunities;
    if (args.includeArchived) {
      opportunities = await ctx.db.query("opportunities").order("desc").collect();
    } else {
      opportunities = await ctx.db
        .query("opportunities")
        .withIndex("by_isActive", (q) => q.eq("isActive", true))
        .order("desc")
        .collect();
    }

    // Filter by tags if provided
    if (args.tags && args.tags.length > 0) {
      opportunities = opportunities.filter((opp) =>
        args.tags!.some((tag) => opp.tags.includes(tag))
      );
    }

    // Filter by ongoing if provided
    if (args.isOngoing !== undefined) {
      opportunities = opportunities.filter((opp) => opp.isOngoing === args.isOngoing);
    }

    return opportunities;
  },
});

// Get a single opportunity
export const getOpportunity = query({
  args: {
    token: v.optional(v.string()),
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) return null;

    // Get creator info
    const creator = await ctx.db.get(opportunity.createdBy);

    return {
      ...opportunity,
      creatorName: creator?.name || "Unknown",
    };
  },
});

// Get all unique tags from opportunities (for filtering UI)
export const getOpportunityTags = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];

    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    const opportunities = await ctx.db.query("opportunities").collect();

    // Extract unique tags
    const tagsSet = new Set<string>();
    opportunities.forEach((opp) => {
      opp.tags.forEach((tag) => tagsSet.add(tag));
    });

    return Array.from(tagsSet).sort();
  },
});

// ============ MUTATIONS (Admin or Officer) ============

// Create a new opportunity
export const createOpportunity = mutation({
  args: {
    token: v.string(),
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
  },
  handler: async (ctx, args) => {
    const user = await requireAdminOrOfficer(ctx, args.token);

    // Validate required fields
    if (!args.title.trim()) {
      throw new Error("Title is required");
    }
    if (!args.description.trim()) {
      throw new Error("Description is required");
    }
    if (!args.organizationName.trim()) {
      throw new Error("Organization name is required");
    }

    const opportunityId = await ctx.db.insert("opportunities", {
      title: args.title.trim(),
      description: args.description.trim(),
      organizationName: args.organizationName.trim(),
      location: args.location?.trim(),
      contactName: args.contactName?.trim(),
      contactEmail: args.contactEmail?.trim(),
      contactPhone: args.contactPhone?.trim(),
      externalLink: args.externalLink?.trim(),
      tags: args.tags,
      estimatedHours: args.estimatedHours,
      startDate: args.startDate,
      endDate: args.endDate,
      isOngoing: args.isOngoing,
      isActive: true,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return opportunityId;
  },
});

// Update an opportunity
export const updateOpportunity = mutation({
  args: {
    token: v.string(),
    opportunityId: v.id("opportunities"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    location: v.optional(v.string()),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    externalLink: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    estimatedHours: v.optional(v.number()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isOngoing: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdminOrOfficer(ctx, args.token);

    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.title !== undefined) updates.title = args.title.trim();
    if (args.description !== undefined) updates.description = args.description.trim();
    if (args.organizationName !== undefined) updates.organizationName = args.organizationName.trim();
    if (args.location !== undefined) updates.location = args.location.trim();
    if (args.contactName !== undefined) updates.contactName = args.contactName.trim();
    if (args.contactEmail !== undefined) updates.contactEmail = args.contactEmail.trim();
    if (args.contactPhone !== undefined) updates.contactPhone = args.contactPhone.trim();
    if (args.externalLink !== undefined) updates.externalLink = args.externalLink.trim();
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.estimatedHours !== undefined) updates.estimatedHours = args.estimatedHours;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.isOngoing !== undefined) updates.isOngoing = args.isOngoing;

    await ctx.db.patch(args.opportunityId, updates);

    return { success: true };
  },
});

// Archive an opportunity (soft delete)
export const archiveOpportunity = mutation({
  args: {
    token: v.string(),
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    await requireAdminOrOfficer(ctx, args.token);

    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    await ctx.db.patch(args.opportunityId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Restore an archived opportunity
export const restoreOpportunity = mutation({
  args: {
    token: v.string(),
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    await requireAdminOrOfficer(ctx, args.token);

    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    await ctx.db.patch(args.opportunityId, {
      isActive: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete an opportunity permanently (admin only for now)
export const deleteOpportunity = mutation({
  args: {
    token: v.string(),
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    await requireAdminOrOfficer(ctx, args.token);

    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    // Only allow deletion of archived opportunities
    if (opportunity.isActive) {
      throw new Error("Archive the opportunity before deleting");
    }

    await ctx.db.delete(args.opportunityId);

    return { success: true };
  },
});
