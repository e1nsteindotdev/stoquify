import { create } from "zustand";
import {
  getCatalog,
  type Catalog,
  type CatalogProduct,
  type CatalogCategory,
  type CatalogCollection,
  type CatalogSettings,
  type CatalogFAQ,
  type CatalogWilaya,
} from "./catalog";

export type {
  CatalogProduct,
  CatalogCategory,
  CatalogCollection,
  CatalogSettings,
  CatalogFAQ,
  CatalogWilaya,
};

type CatalogStore = {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  collections: CatalogCollection[];
  settings: CatalogSettings | null;
  faqs: CatalogFAQ[];
  wilayat: CatalogWilaya[];
  isLoading: boolean;
  error: string | null;
  fetchCatalog: () => Promise<void>;
};

export const useCatalogStore = create<CatalogStore>((set) => ({
  products: [],
  categories: [],
  collections: [],
  settings: null,
  faqs: [],
  wilayat: [],
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
        settings: catalog.settings,
        faqs: catalog.faqs,
        wilayat: catalog.wilayat,
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
