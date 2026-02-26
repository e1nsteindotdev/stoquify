import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

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
          ...(params.organizationName && {
            organizationName: params.organizationName,
          }),
          ...(params.role && { role: params.role }),
          ...(params.magicLinkId && { magicLinkId: params.magicLinkId }),
        };
      },
    }),
  ],

  callbacks: {
    async createOrUpdateUser(ctx, args) {
      console.log("create or update user called ")
      const role = (args.profile as any).role;
      const organizationName = (args.profile as any).organizationName;
      const magicLinkId = (args.profile as any).magicLinkId;

      // Founder signup - create org, store, and user
      if (role === "founder") {
        if (!organizationName) {
          throw new ConvexError("Organization name is required for founder signup");
        }

        const organizationId = await ctx.db.insert("organizations", {
          name: organizationName as string,
        });

        const storeId = await ctx.db.insert("stores", {
          name: "Main Store",
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
          ],
        });

        return userId;
      }

      // Staff/admin invite - verify magic link
      if (magicLinkId) {
        const result = await ctx.runMutation(
          internal.magicLinks.verifyMagicLink,
          {
            magicLinkId: magicLinkId as any,
            name: args.profile.name as string | undefined,
            phone: args.profile.phone as string | undefined,
          },
        );
        return result.userId;
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
