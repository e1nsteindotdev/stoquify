import { convex } from "@/lib/convex-client";
import { api } from "api/convex";

export const userQueryKey = ["userData"] as const;

export const fetchUserData = async () => {
  const user = await convex.query(api.users.getUserData);
  return user;
};

export const storesQueryKey = ["stores"] as const;

export const fetchStores = async () => {
  const stores = await convex.query(api.stores.list);
  return stores;
};
