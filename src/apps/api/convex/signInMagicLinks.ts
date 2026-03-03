import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { nanoid } from "nanoid";
import { getAuthUserId } from "@convex-dev/auth/server";

const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24;

export const create = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId({ auth: ctx.auth });
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);

    if (!user) throw new Error("User not found");

    // Delete any existing sign-in links for this user
    const existingLinks = await ctx.db
      .query("signInMagicLinks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const link of existingLinks) {
      await ctx.db.delete(link._id);
    }

    // Create new sign-in link
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

export const getActiveForCurrentUser = query({
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

export const getByToken = query({
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

export const consume = internalMutation({
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
