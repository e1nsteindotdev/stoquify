import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, ApiError } from "../api/client";

interface User {
  id: string;
  phone: string;
  name: string;
  role: string;
  confirmed: boolean;
}

interface Organization {
  id: string;
  name: string;
}

interface Shop {
  id: string;
  name: string;
}

interface Member {
  role: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  shop: Shop | null;
  storeId: string | null;
  member: Member | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  signup: (data: {
    phone: string;
    name: string;
    email?: string;
    password: string;
    organizationName: string;
    shopName: string;
  }) => Promise<void>;

  login: (phone: string, password: string) => Promise<void>;

  loginWithMagicLink: (
    token: string,
    phone: string,
    name: string,
    password: string,
  ) => Promise<void>;

  logout: () => Promise<void>;

  refresh: () => Promise<void>;

  createMagicLink: (
    role: "admin" | "staff",
    permissions: string[],
    shopId?: string,
  ) => Promise<string>;

  disableUser: (userId: string) => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      organization: null,
      shop: null,
      storeId: null,
      member: null,
      isAuthenticated: false,
      isLoading: false,

      signup: async ({
        phone,
        name,
        email,
        password,
        organizationName,
        shopName,
      }) => {
        set({ isLoading: true });
        try {
          const data = await api.signup({
            phone,
            name,
            email,
            password,
            organizationName,
            shopName,
          });

          set({
            user: data.user,
            organization: data.organization,
            shop: data.shop,
            storeId: data.storeId,
            member: { role: "admin", permissions: [] },
            isAuthenticated: true,
          });
        } catch (error) {
          if (error instanceof ApiError) {
            throw new Error(error.message);
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (phone, password) => {
        set({ isLoading: true });
        try {
          const data = await api.login({ phone, password });

          set({
            user: data.user,
            organization: data.organization,
            shop: data.shop,
            storeId: data.storeId,
            member: data.member ?? { role: "admin", permissions: [] },
            isAuthenticated: true,
          });
        } catch (error) {
          if (error instanceof ApiError) {
            throw new Error(error.message);
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithMagicLink: async (token, phone, name, password) => {
        set({ isLoading: true });
        try {
          const data = await api.loginWithMagicLink({
            token,
            phone,
            name,
            password,
          });

          set({
            user: data.user,
            organization: data.organization,
            shop: data.shop,
            storeId: data.storeId,
            member: data.member ?? { role: "admin", permissions: [] },
            isAuthenticated: true,
          });
        } catch (error) {
          if (error instanceof ApiError) {
            throw new Error(error.message);
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.logout();
        } catch {
        } finally {
          set({
            user: null,
            organization: null,
            shop: null,
            storeId: null,
            member: null,
            isAuthenticated: false,
          });
        }
      },

      refresh: async () => {
        set({ isLoading: true });
        try {
          const data = await api.me();

          set({
            user: data.user,
            organization: data.organization,
            shop: data.shop,
            storeId: data.storeId,
            member: data.member,
            isAuthenticated: true,
          });
        } catch {
          set({
            user: null,
            organization: null,
            shop: null,
            storeId: null,
            member: null,
            isAuthenticated: false,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      createMagicLink: async (role, permissions, shopId) => {
        const data = await api.createMagicLink({ role, permissions, shopId });
        return data.magicLink;
      },

      disableUser: async (userId) => {
        await api.disableUser({ userId });
      },
    }),
    {
      name: "stoquify_auth",
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        shop: state.shop,
        storeId: state.storeId,
        member: state.member,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
