import { useState, useEffect } from "react";
import type { Product, ProductsResponse } from "../lib/types";

const CF_WORKER_URL = import.meta.env.VITE_CF_WORKER_URL;
const SHOP_ID = import.meta.env.VITE_SHOP_ID;
const CATALOG_URL = `${CF_WORKER_URL}/catalog`;
const CATEGORIES_URL = `${CF_WORKER_URL}/categories`;
const COLLECTIONS_URL = `${CF_WORKER_URL}/collections`;

export interface Category {
  id: string;
  shop_id: string;
  name: string;
  createdAt: number;
}

export interface Collection {
  id: string;
  shop_id: string;
  name: string;
  createdAt: number;
  productIds: string[];
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${CATALOG_URL}?shopId=${SHOP_ID}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.status}`);
        }
        const data: ProductsResponse = await res.json();
        setProducts(data.products);
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}

export function useProductById(productId: string) {
  const { products, loading, error } = useProducts();
  const product = products.find((p) => p.id === productId);
  return { product, loading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${CATEGORIES_URL}?shopId=${SHOP_ID}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch categories: ${res.status}`);
        }
        const data = await res.json();
        setCategories(data.categories);
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await fetch(`${COLLECTIONS_URL}?shopId=${SHOP_ID}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch collections: ${res.status}`);
        }
        const data = await res.json();
        setCollections(data.collections);
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return { collections, loading, error };
}
