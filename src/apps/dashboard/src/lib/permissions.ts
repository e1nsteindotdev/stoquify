import { useAuth } from "../hooks/useAuth";

export const can = (action: string): boolean => {
  const { user, member } = useAuth.getState();

  if (!user || !member) return false;

  if (user.role === "founder" || user.role === "admin") return true;

  return member.permissions.includes(action);
};

export const ACTIONS = {
  PRODUCTS_READ: "products:read",
  PRODUCTS_WRITE: "products:write",
  ORDERS_READ: "orders:read",
  ORDERS_WRITE: "orders:write",
  CUSTOMERS_READ: "customers:read",
  CUSTOMERS_WRITE: "customers:write",
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];
