import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import type { AuthStorage } from "./kv-service";
import type {
  User,
  Organization,
  Shop,
  ShopMember,
  Session,
  MagicLink,
} from "./types";

const hashPassword = (password: string): string =>
  bcrypt.hashSync(password, 10);
const verifyPassword = (password: string, hash: string): boolean =>
  bcrypt.compareSync(password, hash);

export interface SignupData {
  phone: string;
  name: string;
  email?: string;
  password: string;
  organizationName: string;
  shopName: string;
}

export interface LoginData {
  phone: string;
  password: string;
}

export interface MagicLinkData {
  shopId?: string;
  role: "admin" | "staff";
  permissions: string[];
}

export interface MagicLinkLoginData {
  token: string;
  phone: string;
  name: string;
  password: string;
}

export interface ValidatedSession {
  user: User;
  organization: Organization;
  shop: Shop;
  member: ShopMember;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

const defaultMemberRoleForUser = (user: User): "admin" | "staff" =>
  user.role === "staff" ? "staff" : "admin";

const ensureOrganizationStoreId = async (
  storage: AuthStorage,
  organization: Organization,
) => {
  if (organization.storeId) {
    return organization;
  }

  const updatedOrganization: Organization = {
    ...organization,
    storeId: nanoid(),
  };
  await storage.putOrganization(updatedOrganization);
  return updatedOrganization;
};

const ensureShopAndMembership = async (
  storage: AuthStorage,
  organization: Organization,
  user: User,
) => {
  let shops = await storage.getShopsByOrg(organization.id);

  if (shops.length === 0) {
    const createdShop: Shop = {
      id: nanoid(),
      organizationId: organization.id,
      name: "Default Shop",
      createdAt: Date.now(),
    };
    await storage.putShop(createdShop);
    shops = [createdShop];
  }

  const shop = shops[0]!;
  const members = await storage.getShopMembers(shop.id);
  let member = members.find((m) => m.userId === user.id);

  if (!member) {
    member = {
      userId: user.id,
      shopId: shop.id,
      role: defaultMemberRoleForUser(user),
      permissions: [],
    };
    await storage.putShopMembers(shop.id, [...members, member]);
  }

  return { shop, member };
};

export const signup = async (storage: AuthStorage, data: SignupData) => {
  const userId = nanoid();
  const orgId = nanoid();
  const shopId = nanoid();
  const storeId = nanoid();
  const sessionToken = nanoid(32);

  const user: User = {
    id: userId,
    phone: data.phone,
    name: data.name,
    email: data.email || null,
    passwordHash: hashPassword(data.password),
    role: "founder",
    enabled: true,
    confirmed: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const organization: Organization = {
    id: orgId,
    name: data.organizationName,
    ownerId: userId,
    storeId,
    createdAt: Date.now(),
  };

  const shop: Shop = {
    id: shopId,
    organizationId: orgId,
    name: data.shopName || "Main Shop",
    createdAt: Date.now(),
  };

  const shopMember: ShopMember = {
    userId,
    shopId,
    role: "admin",
    permissions: [],
  };

  const session: Session = {
    userId,
    organizationId: orgId,
    createdAt: Date.now(),
  };

  await storage.putUser(user);
  await storage.putOrganization(organization);
  await storage.linkUserToOrganization(user.id, organization.id);
  await storage.putShop(shop);
  await storage.putShopMembers(shopId, [shopMember]);
  await storage.putSession(sessionToken, session);

  return { user, organization, shop, sessionToken };
};

export const login = async (storage: AuthStorage, data: LoginData) => {
  const user = await storage.getUserByPhone(data.phone);
  if (!user) throw new AuthError("User not found");
  if (!user.enabled) throw new AuthError("User is disabled");
  if (!verifyPassword(data.password, user.passwordHash))
    throw new AuthError("Invalid password");

  const organizationRecord = await storage.getOrganizationForUser(user.id);
  if (!organizationRecord) throw new AuthError("Organization not found");
  const organization = await ensureOrganizationStoreId(
    storage,
    organizationRecord,
  );

  await storage.linkUserToOrganization(user.id, organization.id);
  const { shop, member } = await ensureShopAndMembership(
    storage,
    organization,
    user,
  );

  const sessionToken = nanoid(32);
  const session: Session = {
    userId: user.id,
    organizationId: organization.id,
    createdAt: Date.now(),
  };
  await storage.putSession(sessionToken, session);

  return { user, organization, shop, member, sessionToken };
};

export const createMagicLink = async (
  storage: AuthStorage,
  data: MagicLinkData & { createdByUserId: string },
) => {
  const creatorUser = await storage.getUser(data.createdByUserId);
  if (!creatorUser) throw new AuthError("Creator not found");

  const organizationRecord = await storage.getOrganizationForUser(
    creatorUser.id,
  );
  if (!organizationRecord) throw new AuthError("Organization not found");
  const organization = await ensureOrganizationStoreId(
    storage,
    organizationRecord,
  );

  const { shop, member } = await ensureShopAndMembership(
    storage,
    organization,
    creatorUser,
  );
  if (member.role !== "admin")
    throw new AuthError("Only admins can create magic links");

  const token = nanoid(32);
  const magicLink: MagicLink = {
    id: nanoid(),
    organizationId: shop.organizationId,
    shopId: data.shopId || null,
    role: data.role,
    permissions: data.permissions,
    createdAt: Date.now(),
    usedByUserId: null,
    enabled: true,
  };

  await storage.putMagicLink(token, magicLink);

  return { token };
};

export const loginWithMagicLink = async (
  storage: AuthStorage,
  data: MagicLinkLoginData,
) => {
  const magicLink = await storage.getMagicLink(data.token);
  if (!magicLink) throw new AuthError("Invalid magic link");
  if (!magicLink.enabled) throw new AuthError("Magic link is disabled");
  if (magicLink.usedByUserId) throw new AuthError("Magic link already used");

  const organizationRecord = await storage.getOrganization(
    magicLink.organizationId,
  );
  if (!organizationRecord) throw new AuthError("Organization not found");
  const organization = await ensureOrganizationStoreId(
    storage,
    organizationRecord,
  );

  const shops = await storage.getShopsByOrg(organization.id);
  const shopId = magicLink.shopId || shops[0]?.id;
  if (!shopId) throw new AuthError("No shop found");

  const shop = await storage.getShop(shopId);
  if (!shop) throw new AuthError("Shop not found");

  const userId = nanoid();
  const user: User = {
    id: userId,
    phone: data.phone,
    name: data.name,
    email: null,
    passwordHash: hashPassword(data.password),
    role: magicLink.role === "admin" ? "admin" : "staff",
    enabled: true,
    confirmed: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const members = await storage.getShopMembers(shopId);
  const newMember: ShopMember = {
    userId: user.id,
    shopId,
    role: magicLink.role,
    permissions: magicLink.permissions,
  };

  magicLink.usedByUserId = userId;
  magicLink.enabled = false;

  const sessionToken = nanoid(32);
  const session: Session = {
    userId: user.id,
    organizationId: organization.id,
    createdAt: Date.now(),
  };

  await storage.putUser(user);
  await storage.linkUserToOrganization(user.id, organization.id);
  await storage.putShopMembers(shopId, [...members, newMember]);
  await storage.putMagicLink(data.token, magicLink);
  await storage.putSession(sessionToken, session);

  return { user, organization, shop, member: newMember, sessionToken };
};

export const validateSession = async (storage: AuthStorage, token: string) => {
  const session = await storage.getSession(token);
  if (!session) throw new AuthError("Invalid session");

  const user = await storage.getUser(session.userId);
  if (!user || !user.enabled) throw new AuthError("User not found or disabled");

  const organizationRecord = await storage.getOrganization(
    session.organizationId,
  );
  if (!organizationRecord) throw new AuthError("Organization not found");
  const organization = await ensureOrganizationStoreId(
    storage,
    organizationRecord,
  );

  await storage.linkUserToOrganization(user.id, organization.id);
  const { shop, member } = await ensureShopAndMembership(
    storage,
    organization,
    user,
  );

  return { user, organization, shop, member };
};

export const disableUser = async (
  storage: AuthStorage,
  targetUserId: string,
) => {
  const user = await storage.getUser(targetUserId);
  if (!user) throw new AuthError("User not found");
  await storage.putUser({ ...user, enabled: false, updatedAt: Date.now() });
};

export const logout = async (storage: AuthStorage, token: string) => {
  await storage.deleteSession(token);
};
