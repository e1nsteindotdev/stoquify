import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      id: "phone",
      profile: (params: Record<string, any>) => {
        return {
          email: params.phone || params.email || "",
          name: params.name || "",
          phone: params.phone || "",
          actualEmail: params.email || "",
          ...(params.storeName && {
            storeName: params.storeName,
          }),
          ...(params.role && { role: params.role }),
          ...(params.magicLinkId && { magicLinkId: params.magicLinkId }),
          ...(params.signInMagicLinkToken && {
            signInMagicLinkToken: params.signInMagicLinkToken,
          }),
        };
      },
    }),
  ],

  callbacks: {
    async createOrUpdateUser(ctx, args) {
      console.log("create or update user called ");
      const role = (args.profile as any).role;
      const storeName = (args.profile as any).storeName;
      const magicLinkId = (args.profile as any).magicLinkId;

      // Founder signup - create org, store, and user
      if (role === "founder") {
        if (!storeName) {
          throw new ConvexError("Store name is required for founder signup");
        }

        const organizationId = await ctx.db.insert("organizations", {
          name: undefined,
        });

        const storeId = await ctx.db.insert("stores", {
          name: storeName as string,
          organizationId: organizationId as any,
        });

        const userId = await ctx.db.insert("users", {
          name: args.profile.name,
          email: (args.profile as any).actualEmail || args.profile.email,
          phone: args.profile.phone,
          organizationId: organizationId as any,
          role: "founder",
          permissions: [
            { storeId: storeId as any, resource: "*", action: "*" },
            { resource: "*", action: "*" },
          ],
        });

        return userId;
      }

      // Staff/admin invite - verify magic link
      if (magicLinkId) {
        const magicLink = await ctx.db.get(magicLinkId as any);
        if (!magicLink) {
          throw new ConvexError("Invalid magic link");
        }
        if (magicLink.usedAt) {
          throw new ConvexError("Magic link already used");
        }
        if (Date.now() > magicLink.expiresAt) {
          throw new ConvexError("Magic link expired");
        }

        let user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("phone"), args.profile.phone))
          .unique();

        if (!user) {
          const newUserId = await ctx.db.insert("users", {
            name: args.profile.name || "",
            email: (args.profile as any).actualEmail || undefined,
            phone: args.profile.phone,
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
        }

        if (!user) throw new Error("Failed to create user");

        await ctx.db.patch(magicLinkId as any, { usedAt: Date.now() });

        return user._id;
      }

      // Sign-in with magic link token (QR code)
      const signInMagicLinkToken = (args.profile as any).signInMagicLinkToken;
      if (signInMagicLinkToken) {
        const link = await ctx.db
          .query("signInMagicLinks")
          .unique();

        if (!link) {
          throw new ConvexError("Invalid sign-in link");
        }
        if (link.usedAt) {
          throw new ConvexError("Sign-in link already used");
        }
        if (Date.now() > link.expiresAt) {
          throw new ConvexError("Sign-in link expired");
        }

        // Mark the link as used
        await ctx.db.patch(link._id, { usedAt: Date.now() });

        // Return the user ID to establish the session
        return link.userId;
      }

      // Regular user - existing user updating profile
      if (args.existingUserId) {
        await ctx.db.patch(args.existingUserId, {
          email: (args.profile as any).actualEmail || undefined,
          name: args.profile.name,
          phone: args.profile.phone,
        });
        return args.existingUserId;
      }

      // Fallback - should not reach here normally
      throw new Error("Invalid signup flow");
    },
  },

  session: {
    totalDurationMs: 1000 * 60 * 60 * 24 * 30 * 12 * 100,
    inactiveDurationMs: 1000 * 60 * 60 * 24 * 30 * 12 * 100,
  },
});
