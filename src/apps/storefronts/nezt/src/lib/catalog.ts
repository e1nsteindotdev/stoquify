import type { Id } from "api/data-model";

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
const STORE_ID = (import.meta as any).env.VITE_STOQUIFY_STORE_ID!;

export interface CatalogProduct {
  _id: Id<"products">;
  _creationTime: number;
  storeId: string;
  title?: string;
  desc?: string;
  categoryId?: Id<"categories">;
  price?: number;
  cost?: number;
  status: "active" | "hidden" | "incomplete";
  discount?: number;
  oldPrice?: number;
  stockingStrategy: "by_demand" | "by_variants" | "by_number";
  quantity?: number;
  collections: Array<Id<"collections">>;
  images: Array<{
    _id: Id<"images">;
    _creationTime: number;
    indexedDBId?: number;
    productId: Id<"products">;
    url: string;
    order: number;
    hidden: boolean;
  }>;
  skus: Array<{
    _id: Id<"skus">;
    _creationTime: number;
    productId: Id<"products">;
    quantity: number;
    options: Array<{
      _id: Id<"variantOptions">;
      _creationTime: number;
      variantId: Id<"variants">;
      order: number;
      name: string;
    }>;
  }>;
  variants: Array<{
    _id: Id<"variants">;
    _creationTime: number;
    productId: Id<"products">;
    name: string;
    order: number;
    options: Array<{
      _id: Id<"variantOptions">;
      _creationTime: number;
      variantId: Id<"variants">;
      order: number;
      name: string;
    }>;
  }>;
}

export interface CatalogCategory {
  _id: Id<"categories">;
  _creationTime: number;
  name: string;
  storeId: string;
}

export interface CatalogCollection {
  _id: Id<"collections">;
  _creationTime: number;
  title: string;
  productIds?: Array<Id<"products">>;
}

export interface CatalogSettings {
  _id: Id<"settings">;
  _creationTime: number;
  storeId: Id<"stores">;
  locationLink?: string;
  instagramLink?: string;
  facebookLink?: string;
  tiktokLink?: string;
}

export interface CatalogFAQ {
  _id: Id<"faqs">;
  _creationTime: number;
  question: string;
  answer: string;
  order: number;
}

export interface CatalogWilaya {
  _id: Id<"wilayat">;
  _creationTime: number;
  name: string;
  htmlName: string;
  deliveryCost: number;
}

export interface Catalog {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  collections: CatalogCollection[];
  settings: CatalogSettings | null;
  faqs: CatalogFAQ[];
  wilayat: CatalogWilaya[];
}

const catalogCache: {
  data: Catalog | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

export async function getCatalog(): Promise<Catalog> {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: "products:getCatalog",
      args: { storeId: STORE_ID },
      format: "json",
    }),
  });

  if (!response.ok) {
    console.log('catalog fetch error :', response.ok)
    throw new Error(`Failed to fetch catalog: ${response.statusText}`);
  }
  const data = await response.json();
  return data.value;
}

export function invalidateCatalogCache() {
  catalogCache.data = null;
  catalogCache.timestamp = 0;
}
