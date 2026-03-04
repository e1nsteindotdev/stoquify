import { create } from "zustand";
import { idbRefresh } from "@/lib/idb";
import { TypeStore, TypeUser } from "api/types";

interface StoreState {
  user: TypeUser | null;
  stores: TypeStore[];
  selectedStore: TypeStore | null;
}

interface StoreActions {
  setStores: (stores: TypeStore[]) => void;
  setStore: (store: TypeStore) => void;
  setUser: (user: TypeUser | null) => void;
}

type AppStore = StoreState & StoreActions;

export const useAppStore = create<AppStore>((set, get) => ({
  user: null,
  stores: [],
  selectedStore: null,

  setStores: (stores) => {
    set({ stores });
    idbRefresh("stores", stores);
  },

  setStore: (store: TypeStore) => {
    set({ selectedStore: store });
  },

  setUser: (user) => {
    set({ user });
    idbRefresh("user", user);
  },
}));
