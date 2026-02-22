import type {
  User,
  Organization,
  Shop,
  ShopMember,
  Session,
  MagicLink,
} from "./types";

export interface AuthStorage {
  getUser(userId: string): Promise<User | null>;
  getUserByPhone(phone: string): Promise<User | null>;
  putUser(user: User): Promise<void>;

  getOrganization(orgId: string): Promise<Organization | null>;
  getOrganizationForUser(userId: string): Promise<Organization | null>;
  putOrganization(org: Organization): Promise<void>;
  linkUserToOrganization(userId: string, organizationId: string): Promise<void>;

  getShop(shopId: string): Promise<Shop | null>;
  getShopsByOrg(organizationId: string): Promise<Shop[]>;
  putShop(shop: Shop): Promise<void>;

  getShopMembers(shopId: string): Promise<ShopMember[]>;
  putShopMembers(shopId: string, members: ShopMember[]): Promise<void>;

  getSession(token: string): Promise<Session | null>;
  putSession(token: string, session: Session): Promise<void>;
  deleteSession(token: string): Promise<void>;

  getMagicLink(token: string): Promise<MagicLink | null>;
  putMagicLink(token: string, magicLink: MagicLink): Promise<void>;
}
