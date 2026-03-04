import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { nanoid } from "nanoid";
import { getAuthUserId } from "@convex-dev/auth/server";

const permissions = v.array(
  v.object({
    storeId: v.optional(v.id("stores")),
    resource: v.string(),
    action: v.union(v.literal("write"), v.literal("read"), v.literal("*")),
  }),
);

export const invite = mutation({
  args: {
    email: v.optional(v.string()),
    role: v.union(v.literal("founder"), v.literal("admin"), v.literal("staff")),
    organizationId: v.id("organizations"),
    permissions,
  },
  handler: async (ctx, args) => {
    const token = nanoid(32);
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;

    const magicLinkId = await ctx.db.insert("magicLinks", {
      email: args.email,
      token,
      role: args.role,
      permissions: args.permissions,
      organizationId: args.organizationId,
      expiresAt,
      usedAt: undefined,
    });

    return { _id: magicLinkId, token, expiresAt };
  },
});

export const getPendingByOrganization = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) return [];

    const user = await ctx.db
      .query("users")
      .filter((e) => e.eq(e.field("_id"), userId))
      .unique();

    const orgId = user?.organizationId;

    if (!orgId) return [];

    const hasPermission = user.permissions?.some(
      (p) =>
        (p.resource === "employees" || p.resource === "*") &&
        (p.action === "read" || p.action === "*"),
    );

    if (!hasPermission) return [];

    const invites = await ctx.db
      .query("magicLinks")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", user.organizationId),
      )
      .filter((q) => q.eq(q.field("usedAt"), undefined))
      .collect();

    return invites;
  },
});

export const getById = query({
  args: {
    magicLinkId: v.id("magicLinks"),
  },
  handler: async (ctx, args) => {
    const magicLink = await ctx.db.get(args.magicLinkId);

    if (!magicLink) {
      return null;
    }

    if (magicLink.usedAt) {
      return { ...magicLink, error: "already_used" };
    }

    if (Date.now() > magicLink.expiresAt) {
      return { ...magicLink, error: "expired" };
    }

    return magicLink;
  },
});

export const update = mutation({
  args: {
    invitationId: v.id("magicLinks"),
    permissions,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user?.organizationId || !user.role || user.role === "staff") {
      throw new Error("Not authorized");
    }

    const invite = await ctx.db.get(args.invitationId);
    if (!invite || invite.organizationId !== user.organizationId) {
      throw new Error("Invitation not found");
    }

    if (invite.usedAt) {
      throw new Error("Cannot update used invitation");
    }

    await ctx.db.patch(args.invitationId, {
      permissions: args.permissions,
    });

    return { _id: args.invitationId };
  },
});

export const revoke = mutation({
  args: {
    invitationId: v.id("magicLinks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user?.organizationId || !user.role || user.role === "staff") {
      throw new Error("Not authorized");
    }

    const invite = await ctx.db.get(args.invitationId);
    if (!invite || invite.organizationId !== user.organizationId) {
      throw new Error("Invitation not found");
    }

    await ctx.db.delete(args.invitationId);
  },
});

export const verifyMagicLink = internalMutation({
  args: {
    magicLinkId: v.id("magicLinks"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { magicLinkId, name, phone, password } = args;
    const magicLink = await ctx.db.get(magicLinkId);
    if (!magicLink) {
      throw new Error("Invalid magic link");
    }

    if (magicLink.usedAt) {
      throw new Error("Magic link already used");
    }

    if (Date.now() > magicLink.expiresAt) {
      throw new Error("Magic link expired");
    }

    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", magicLink.email ?? ""))
      .unique();

    if (!user && magicLink.email) {
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("phone"), phone))
        .unique();
    }

    const userId = magicLink.organizationId;

    if (!name || !phone) {
      throw new Error("Name and phone are required");
    }

    if (!user) {
      console.log("Creating new user with:", {
        name,
        email: magicLink.email,
        phone,
        organizationId: magicLink.organizationId,
        role: magicLink.role,
      });

      const newUserId = await ctx.db.insert("users", {
        name: name,
        email: magicLink.email ?? undefined,
        phone: phone,
        organizationId: magicLink.organizationId,
        role: magicLink.role,
        permissions: magicLink.permissions,
      });
      user = await ctx.db.get(newUserId);
    } else {
      console.log("Updating existing user:", user._id);
      await ctx.db.patch(user._id, {
        organizationId: magicLink.organizationId,
        role: magicLink.role,
        permissions: magicLink.permissions,
      });
      user = await ctx.db.get(user._id);
    }

    if (!user) throw new Error("Failed to get user");

    await ctx.db.patch(magicLink._id, { usedAt: Date.now() });

    console.log("Returning user:", user._id);

    return {
      userId: user._id,
      email: magicLink.email,
      name: user.name,
    };
  },
});
