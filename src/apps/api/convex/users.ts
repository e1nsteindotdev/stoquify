import { query } from "./_generated/server";

export const get = query(async ({ auth, db }) => {
  const identity = await auth.getUserIdentity();
  if (!identity) return null;

  // If you want to enrich with your own user doc from Convex
  const user = await db
    .query("users")
    .unique();

  return {
    ...identity, // convex identity (subject, name, email, etc.)
    profile: user, // your app-specific user doc if you have one
  };
});
