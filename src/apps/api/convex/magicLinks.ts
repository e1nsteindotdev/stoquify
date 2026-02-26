import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { nanoid } from "nanoid";

const permissions = v.array(
  v.object({
    storeId: v.id("stores"),
    resource: v.string(),
    action: v.union(
      v.literal("write"),
      v.literal("read"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("create"),
      v.literal("*"),
    ),
  }),
);

// Generate magic link for invitation
export const invite = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("staff")),
    permissions,
    storeId: v.optional(v.id("stores")),
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
      throw new Error("Not authorized to invite");
    }

    const token = nanoid(32);
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;

    const magicLinkId = await ctx.db.insert("magicLinks", {
      email: args.email,
      token,
      role: args.role,
      permissions: args.permissions,
      organizationId: user.organizationId,
      storeId: args.storeId!,
      expiresAt,
      usedAt: undefined,
    });

    return { _id: magicLinkId, token, expiresAt };
  },
});

// List pending invitations
export const listPending = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user?.organizationId) return [];

    // Only founder/admin can view invites
    if (!user.role || user.role === "staff") return [];

    const invites = await ctx.db
      .query("magicLinks")
      .filter((q) =>
        q.and(
          q.eq(q.field("organizationId"), user.organizationId),
          q.eq(q.field("usedAt"), undefined),
        ),
      )
      .collect();

    return invites;
  },
});

// Revoke invitation
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

    console.log("magicLink found:", magicLink);

    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", magicLink.email))
      .unique();

    if (!user) {
      if (!name || !phone) {
        throw new Error("Name and phone are required");
      }

      console.log("Creating new user with:", {
        name,
        email: magicLink.email,
        phone,
        organizationId: magicLink.organizationId,
        role: magicLink.role,
      });

      const newUserId = await ctx.db.insert("users", {
        name: name,
        email: magicLink.email,
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
