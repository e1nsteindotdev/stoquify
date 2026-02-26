import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query(async ({ auth, db }) => {
  const userId = await getAuthUserId({ auth })
  if (!userId) return null;

  // If you want to enrich with your own user doc from Convex
  const user = await db
    .query("users")
    .filter((q) => q.eq(q.field("_id"), userId))
    .unique();
  return user
});

export const getUserData = query(async ({ auth, db }) => {
  const userId = await getAuthUserId({ auth })
  if (!userId) return null;

  // If you want to enrich with your own user doc from Convex
  const user = await db
    .query("users")
    .filter((q) => q.eq(q.field("_id"), userId))
    .unique();

  if (!user) return null

  const organization = await db
    .query("organizations")
    .filter((q) => q.eq(q.field("_id"), user?.organizationId))
    .unique();

  if (!organization) return null


  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phone,
    permissions: user.permissions,
    role: user.role,
    organization: organization
  }
});


