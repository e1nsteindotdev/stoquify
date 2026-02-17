export interface ProductImage {
  id: string;
  shop_id: string;
  product_id: string;
  url: string;
  indexedDBId: number | null;
  displayOrder: number;
  hidden: number;
  createdAt: number;
}

export interface Collection {
  id: string;
  shop_id: string;
  name: string;
  createdAt: number;
  deletedAt: number | null;
  collection_product_id: string;
}

export interface Sku {
  id: string;
  shop_id: string;
  product_id: string;
  quantity: number;
  options: Record<string, { id: string; value: string }>;
  createdAt: number;
  deletedAt: number | null;
}

export interface Variant {
  id: string;
  shop_id: string;
  product_id: string;
  name: string;
  displayOrder: number;
  createdAt: number;
  options: string[];
  skus: Sku[];
}

export interface Product {
  id: string;
  shop_id: string;
  title: string;
  desc: string | null;
  price: number;
  cost: number | null;
  status: string;
  discount: number | null;
  oldPrice: number | null;
  stockingStrategy: string;
  quantity: number | null;
  createdAt: number;
  category_id: string | null;
  category_name: string | null;
  category_createdAt: number | null;
  images: ProductImage[];
  collections: Collection[];
  variants: Variant[];
}

export interface ProductsResponse {
  products: Product[];
}
