export type UserRole = "founder" | "admin" | "staff";

export interface User {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  passwordHash: string;
  role: UserRole;
  enabled: boolean;
  confirmed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  storeId: string;
  createdAt: number;
}

export interface Shop {
  id: string;
  organizationId: string;
  name: string;
  createdAt: number;
}

export type ShopMemberRole = "admin" | "staff";

export interface ShopMember {
  userId: string;
  shopId: string;
  role: ShopMemberRole;
  permissions: string[];
}

export interface Session {
  userId: string;
  organizationId: string;
  createdAt: number;
}

export interface MagicLink {
  id: string;
  organizationId: string;
  shopId: string | null;
  role: ShopMemberRole;
  permissions: string[];
  createdAt: number;
  usedByUserId: string | null;
  enabled: boolean;
}
