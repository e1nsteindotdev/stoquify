import { create } from "zustand";
import {
  getCatalog,
  type Catalog,
  type CatalogProduct,
  type CatalogCategory,
  type CatalogCollection,
} from "./catalog";

export type { CatalogProduct, CatalogCategory, CatalogCollection };

type CatalogStore = {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  collections: CatalogCollection[];
  isLoading: boolean;
  error: string | null;
  fetchCatalog: () => Promise<void>;
};

export const useCatalogStore = create<CatalogStore>((set) => ({
  products: [],
  categories: [],
  collections: [],
  isLoading: false,
  error: null,
  fetchCatalog: async () => {
    set({ isLoading: true, error: null });
    try {
      const catalog: Catalog = await getCatalog();
      set({
        products: catalog.products,
        categories: catalog.categories,
        collections: catalog.collections,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch catalog",
        isLoading: false,
      });
    }
  },
}));
