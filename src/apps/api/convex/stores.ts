import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create new store (founder/admin only)
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user?.organizationId) {
      throw new Error("No organization found");
    }

    if (!user.role || user.role === "staff") {
      throw new Error("Not authorized");
    }

    const store = await ctx.db.insert("stores", {
      name: args.name,
      organizationId: user.organizationId,
    });

    return store;
  },
});

// List stores by organization
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const [userId] = identity.subject.split("|")
    const user = await ctx.db.get(userId as Id<'users'>)
    if (!user?.organizationId) return [];

    return await ctx.db
      .query("stores")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", user.organizationId),
      )
      .collect();
  },
});


