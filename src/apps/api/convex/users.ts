import { query } from "./_generated/server";

export const get = query(async ({ auth, db }) => {
  const identity = await auth.getUserIdentity();
  if (!identity) return null;

  // If you want to enrich with your own user doc from Convex
  const user = await db
    .query("users")
    .filter((q) => q.eq(q.field("_id"), identity.subject as any))
    .unique();

  return {
    ...identity,
    profile: user,
  };
});
