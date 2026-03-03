import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { authedQuery } from "./customeFunction";

export const get = authedQuery({
  resource: "users",
  action: "read",
  args: {},
  handler: async ({ auth, db }) => {
    const userId = await getAuthUserId({ auth });
    if (!userId) return null;

    const user = await db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), userId))
      .unique();
    return user;
  },
});

export const getUserData = authedQuery({
  resource: "users",
  action: "read",
  args: {},
  handler: async ({ auth, db }) => {
    console.log("[CONVEX] running getUser Data");
    const userId = await getAuthUserId({ auth });
    if (!userId) return null;

    const user = await db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), userId))
      .unique();

    if (!user) return null;

    const organization = await db
      .query("organizations")
      .filter((q) => q.eq(q.field("_id"), user?.organizationId))
      .unique();

    if (!organization) return null;

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phone,
      permissions: user.permissions,
      role: user.role,
      organization: organization,
    };
  },
});

export const getOrganizationUsers = authedQuery({
  resource: "users",
  action: "read",
  args: {},
  handler: async ({ auth, db }) => {
    const userId = await getAuthUserId({ auth });
    if (!userId) return [];

    const currentUser = await db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), userId))
      .unique();

    if (!currentUser) return [];

    const users = await db
      .query("users")
      .filter((q) =>
        q.eq(q.field("organizationId"), currentUser.organizationId),
      )
      .collect();

    return users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phone,
      permissions: user.permissions,
      role: user.role,
    }));
  },
});
