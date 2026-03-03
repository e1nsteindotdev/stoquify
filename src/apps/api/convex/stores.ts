import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { authedMutation, authedQuery } from "./customeFunction";

export const create = authedMutation({
  resource: "stores",
  action: "create",
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

    const store = await ctx.db.insert("stores", {
      name: args.name,
      organizationId: user.organizationId,
    });

    return store;
  },
});

// List stores by organization
export const list = authedQuery({
  resource: "stores",
  action: "read",
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const [userId] = identity.subject.split("|");
    const user = await ctx.db.get(userId as Id<"users">);
    if (!user?.organizationId) return [];

    console.log(user?.organizationId);
    return await ctx.db
      .query("stores")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", user.organizationId),
      )
      .collect();
  },
});
