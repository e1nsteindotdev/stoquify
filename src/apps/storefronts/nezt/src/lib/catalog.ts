const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
const STORE_ID = (import.meta as any).env.VITE_STOQUIFY_STORE_ID!;

export interface CatalogProduct {
  _id: string;
  _creationTime: number;
  storeId: string;
  title?: string;
  desc?: string;
  categoryId?: string;
  price?: number;
  cost?: number;
  status: "active" | "hidden" | "incomplete";
  discount?: number;
  oldPrice?: number;
  stockingStrategy: "by_demand" | "by_variants" | "by_number";
  quantity?: number;
  collections: string[];
  images: Array<{
    _id: string;
    _creationTime: number;
    indexedDBId?: number;
    productId: string;
    url: string;
    order: number;
    hidden: boolean;
  }>;
  skus: Array<{
    _id: string;
    _creationTime: number;
    productId: string;
    quantity: number;
    options: Array<{
      _id: string;
      _creationTime: number;
      variantId: string;
      order: number;
      name: string;
    }>;
  }>;
  variants: Array<{
    _id: string;
    _creationTime: number;
    productId: string;
    name: string;
    order: number;
    options: Array<{
      _id: string;
      _creationTime: number;
      variantId: string;
      order: number;
      name: string;
    }>;
  }>;
}

export interface CatalogCategory {
  _id: string;
  _creationTime: number;
  name: string;
  storeId: string;
}

export interface CatalogCollection {
  _id: string;
  _creationTime: number;
  title: string;
  productIds?: string[];
}

export interface Catalog {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  collections: CatalogCollection[];
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
    throw new Error(`Failed to fetch catalog: ${response.statusText}`);
  }
  const data = await response.json();
  return data.value;
}

export function invalidateCatalogCache() {
  catalogCache.data = null;
  catalogCache.timestamp = 0;
}
