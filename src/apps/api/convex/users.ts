import { authedQuery } from "./customeFunction";

export const get = authedQuery({
  resource: "users",
  action: "read",
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    return user;
  },
});

export const getUserData = authedQuery({
  resource: "users",
  action: "read",
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    console.log("user :", user)

    if (!user) return null;

    const organization = await ctx.db
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
  handler: async (ctx) => {
    const currentUser = await ctx.db.get(ctx.userId);

    if (!currentUser) return [];

    const users = await ctx.db
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
