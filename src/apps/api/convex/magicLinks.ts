import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { nanoid } from "nanoid";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24;

const permissions = v.array(
  v.object({
    storeId: v.optional(v.id("stores")),
    resource: v.string(),
    action: v.union(v.literal("write"), v.literal("read"), v.literal("*")),
  }),
);

export const insert = mutation({
  args: {
    email: v.optional(v.string()),
    role: v.union(v.literal("founder"), v.literal("admin"), v.literal("staff")),
    organizationId: v.optional(v.id("organizations")),
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
      organizationId: args.organizationId as Id<"organizations">,
      expiresAt,
      usedAt: undefined,
    });

    return { _id: magicLinkId, token, expiresAt };
  },
});

export const listPending = query({
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

    return await ctx.db
      .query("magicLinks")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", user.organizationId as Id<"organizations">),
      )
      .filter((q) => q.eq(q.field("usedAt"), undefined))
      .collect();
  },
});

export const get = query({
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

export const remove = mutation({
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

export const verify = internalMutation({
  args: {
    magicLinkId: v.id("magicLinks"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { magicLinkId, name, phone } = args;
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

    if (!name || !phone) {
      throw new Error("Name and phone are required");
    }

    if (!user) {
      const newUserId = await ctx.db.insert("users", {
        name,
        email: magicLink.email ?? undefined,
        phone,
        organizationId: magicLink.organizationId,
        role: magicLink.role,
        permissions: magicLink.permissions,
      });
      user = await ctx.db.get(newUserId);
    } else {
      await ctx.db.patch(user._id, {
        organizationId: magicLink.organizationId,
        role: magicLink.role,
        permissions: magicLink.permissions,
      });
      user = await ctx.db.get(user._id);
    }

    if (!user) throw new Error("Failed to get user");

    await ctx.db.patch(magicLink._id, { usedAt: Date.now() });

    return {
      userId: user._id,
      email: magicLink.email,
      name: user.name,
    };
  },
});

export const insertSignIn = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId({ auth: ctx.auth });
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);

    if (!user) throw new Error("User not found");

    const existingLinks = await ctx.db
      .query("signInMagicLinks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const link of existingLinks) {
      await ctx.db.delete(link._id);
    }

    const token = nanoid(32);
    const expiresAt = Date.now() + TWENTY_FOUR_HOURS;
    const createdAt = Date.now();

    const signInMagicLinkId = await ctx.db.insert("signInMagicLinks", {
      userId: user._id,
      token,
      expiresAt,
      createdAt,
      usedAt: undefined,
    });

    return { _id: signInMagicLinkId, token, expiresAt, createdAt };
  },
});

export const getSignInActive = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId({ auth: ctx.auth });
    if (!userId) return null;

    const user = await ctx.db.get(userId);

    if (!user) return null;

    const link = await ctx.db
      .query("signInMagicLinks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!link) return null;

    const now = Date.now();
    const isExpired = now > link.expiresAt;
    const isUsed = !!link.usedAt;

    let status: "active" | "used" | "expired";
    if (isUsed) {
      status = "used";
    } else if (isExpired) {
      status = "expired";
    } else {
      status = "active";
    }

    return {
      _id: link._id,
      token: link.token,
      expiresAt: link.expiresAt,
      usedAt: link.usedAt,
      createdAt: link.createdAt,
      status,
    };
  },
});

export const getSignInByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("signInMagicLinks")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!link) {
      return { error: "invalid" };
    }

    if (link.usedAt) {
      return { error: "already_used", usedAt: link.usedAt };
    }

    if (Date.now() > link.expiresAt) {
      return { error: "expired", expiresAt: link.expiresAt };
    }

    const user = await ctx.db.get(link.userId);
    if (!user) {
      return { error: "user_not_found" };
    }

    return {
      _id: link._id,
      token: link.token,
      userId: link.userId,
      expiresAt: link.expiresAt,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        organizationId: user.organizationId,
        role: user.role,
      },
    };
  },
});

export const consumeSignIn = internalMutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("signInMagicLinks")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!link) {
      throw new Error("Invalid token");
    }

    if (link.usedAt) {
      throw new Error("Token already used");
    }

    if (Date.now() > link.expiresAt) {
      throw new Error("Token expired");
    }

    await ctx.db.patch(link._id, { usedAt: Date.now() });

    const user = await ctx.db.get(link.userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      organizationId: user.organizationId,
      role: user.role,
    };
  },
});
