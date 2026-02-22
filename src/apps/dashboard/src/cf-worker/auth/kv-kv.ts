import type { KVNamespace } from "@cloudflare/workers-types";
import { AuthStorage } from "./kv-service";
import type {
  User,
  Organization,
  Shop,
  ShopMember,
  Session,
  MagicLink,
} from "./types";

const KEY = {
  user: (id: string) => `user:${id}`,
  userByPhone: (phone: string) => `user_by_phone:${phone}`,
  organization: (id: string) => `organization:${id}`,
  organizationByOwner: (ownerId: string) => `organization_by_owner:${ownerId}`,
  userOrganization: (userId: string) => `user_organization:${userId}`,
  shop: (id: string) => `shop:${id}`,
  shopsByOrg: (orgId: string) => `shops_by_org:${orgId}`,
  shopMembers: (shopId: string) => `shop_members:${shopId}`,
  session: (token: string) => `session:${token}`,
  magicLink: (token: string) => `magic_link:${token}`,
} as const;

export const makeKvAuthStorage = (kv: KVNamespace): AuthStorage => {
  return {
    getUser: async (userId: string) => {
      const value = await kv.get(KEY.user(userId), "json");
      return value as User | null;
    },

    getUserByPhone: async (phone: string) => {
      const value = await kv.get(KEY.userByPhone(phone), "json");
      return value as User | null;
    },

    putUser: async (user: User) => {
      await Promise.all([
        kv.put(KEY.user(user.id), JSON.stringify(user)),
        kv.put(KEY.userByPhone(user.phone), JSON.stringify(user)),
      ]);
    },

    getOrganization: async (orgId: string) => {
      const value = await kv.get(KEY.organization(orgId), "json");
      return value as Organization | null;
    },

    getOrganizationForUser: async (userId: string) => {
      const indexedOrgId = await kv.get(KEY.userOrganization(userId));
      if (indexedOrgId) {
        const org = await kv.get(KEY.organization(indexedOrgId), "json");
        if (org) return org as Organization;
      }

      const ownedOrgId = await kv.get(KEY.organizationByOwner(userId));
      if (ownedOrgId) {
        await kv.put(KEY.userOrganization(userId), ownedOrgId);
        const org = await kv.get(KEY.organization(ownedOrgId), "json");
        if (org) return org as Organization;
      }

      const orgKeys = await kv.list({ prefix: "organization:" });
      for (const key of orgKeys.keys) {
        const org = (await kv.get(key.name, "json")) as Organization | null;
        if (!org) continue;

        if (org.ownerId === userId) {
          await Promise.all([
            kv.put(KEY.organizationByOwner(userId), org.id),
            kv.put(KEY.userOrganization(userId), org.id),
          ]);
          return org;
        }

        const shops =
          ((await kv.get(KEY.shopsByOrg(org.id), "json")) as Shop[] | null) ||
          [];
        for (const shop of shops) {
          const members =
            ((await kv.get(KEY.shopMembers(shop.id), "json")) as
              | ShopMember[]
              | null) || [];
          if (members.some((member) => member.userId === userId)) {
            await kv.put(KEY.userOrganization(userId), org.id);
            return org;
          }
        }
      }

      return null;
    },

    putOrganization: async (org: Organization) => {
      await Promise.all([
        kv.put(KEY.organization(org.id), JSON.stringify(org)),
        kv.put(KEY.organizationByOwner(org.ownerId), org.id),
        kv.put(KEY.userOrganization(org.ownerId), org.id),
      ]);
    },

    linkUserToOrganization: async (userId: string, organizationId: string) => {
      await kv.put(KEY.userOrganization(userId), organizationId);
    },

    getShop: async (shopId: string) => {
      const value = await kv.get(KEY.shop(shopId), "json");
      return value as Shop | null;
    },

    getShopsByOrg: async (orgId: string) => {
      const value = await kv.get(KEY.shopsByOrg(orgId), "json");
      return (value as Shop[]) || [];
    },

    putShop: async (shop: Shop) => {
      await Promise.all([
        kv.put(KEY.shop(shop.id), JSON.stringify(shop)),
        (async () => {
          const existing = (await kv.get(
            KEY.shopsByOrg(shop.organizationId),
            "json",
          )) as Shop[] | null;
          const shops = existing || [];
          const updated = [...shops.filter((s) => s.id !== shop.id), shop];
          await kv.put(
            KEY.shopsByOrg(shop.organizationId),
            JSON.stringify(updated),
          );
        })(),
      ]);
    },

    getShopMembers: async (shopId: string) => {
      const value = await kv.get(KEY.shopMembers(shopId), "json");
      return (value as ShopMember[]) || [];
    },

    putShopMembers: async (shopId: string, members: ShopMember[]) => {
      await kv.put(KEY.shopMembers(shopId), JSON.stringify(members));
    },

    getSession: async (token: string) => {
      const value = await kv.get(KEY.session(token), "json");
      return value as Session | null;
    },

    putSession: async (token: string, session: Session) => {
      await kv.put(KEY.session(token), JSON.stringify(session));
    },

    deleteSession: async (token: string) => {
      await kv.delete(KEY.session(token));
    },

    getMagicLink: async (token: string) => {
      const value = await kv.get(KEY.magicLink(token), "json");
      return value as MagicLink | null;
    },

    putMagicLink: async (token: string, magicLink: MagicLink) => {
      await kv.put(KEY.magicLink(token), JSON.stringify(magicLink));
    },
  };
};
