import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customeFunction";

// Founder creates organization + first store + founder membership
export const create = authedMutation({
  resource: "organizations",
  action: "create",
  args: {
    organizationName: v.string(),
    storeName: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user document
    const user = await ctx.db.get(ctx.userId);

    if (!user) {
      throw new Error(
        "User must exist before creating organization. Use signup flow instead.",
      );
    }

    // Create organization
    const org = await ctx.db.insert("organizations", {
      name: args.organizationName,
      owner: user._id,
    });

    // Create first store
    const store = await ctx.db.insert("stores", {
      name: args.storeName,
      organizationId: org,
    });

    // Update user with org
    await ctx.db.patch(user._id, {
      organizationId: org,
    });

    return { organizationId: org, storeId: store };
  },
});

// Get current user's organization
export const getMyOrganization = authedQuery({
  resource: "organizations",
  action: "read",
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);

    if (!user?.organizationId) return null;

    const org = await ctx.db.get(user.organizationId);
    return org;
  },
});

// Get user's role
export const getMyRole = authedQuery({
  resource: "organizations",
  action: "read",
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);

    return user?.role || null;
  },
});
