import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Founder creates organization + first store + founder membership
export const create = mutation({
  args: {
    organizationName: v.string(),
    storeName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    if (!identity.email) throw new Error("Email required");

    // Get or create user document
    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    let finalUser = user;
    if (!finalUser) {
      throw new Error(
        "User must exist before creating organization. Use signup flow instead.",
      );
    }

    // Create organization
    const org = await ctx.db.insert("organizations", {
      name: args.organizationName,
      owner: finalUser._id,
    });

    // Create first store
    const store = await ctx.db.insert("stores", {
      name: args.storeName,
      organizationId: org,
    });

    // Update user with org
    await ctx.db.patch(finalUser._id, {
      organizationId: org,
    });

    return { organizationId: org, storeId: store };
  },
});

// Get current user's organization
export const getMyOrganization = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user?.organizationId) return null;

    const org = await ctx.db.get(user.organizationId);
    return org;
  },
});

// Get user's role
export const getMyRole = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    return user?.role || null;
  },
});
