import { useQuery, useMutation } from "convex/react";
import { api } from "api/convex";

export function useCurrentUser() {
  const user = useQuery(api.users.get);
  return user;
}

export function useOrganization() {
  const org = useQuery(api.organizations.getMyOrganization);
  const role = useQuery(api.organizations.getMyRole);
  const createOrg = useMutation(api.organizations.create);

  return { org, role, createOrg };
}

export function useStore() {
  const store = useQuery(api.stores.getMyStore);
  const stores = useQuery(api.stores.list);
  const setCurrentStore = useMutation(api.stores.setCurrentStore);
  const createStore = useMutation(api.stores.create);

  return { store, stores, setCurrentStore, createStore };
}

export function usePermissions() {
  const user = useQuery(api.users.get);
  return {
    permissions: user?.profile?.permissions || [],
    role: user?.profile?.role,
    isFounder: user?.profile?.role === "founder",
    isAdmin:
      user?.profile?.role === "admin" || user?.profile?.role === "founder",
    isStaff: user?.profile?.role === "staff",
  };
}
