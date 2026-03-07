import { useMemo } from "react";
import { useGetProducts } from "./products";
import { useGetSales } from "./sales";

const DAY_MS = 24 * 60 * 60 * 1000;

const toAlgeriaDayStart = (ts: number) => {
  const date = new Date(ts);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export type ProductSkuOptions =
  | Record<string, string>
  | Array<
      | string
      | {
          _id?: string;
          name?: string;
          optionName?: string;
          order?: number;
          variantId?: string;
        }
    >;

export type ProductTableRow = {
  _id: string;
  title: string;
  desc?: string;
  status?: "active" | "hidden" | "incomplete";
  categoryId?: string;
  category?: { _id: string; name: string };
  collections?: Array<any>;
  images?: Array<any>;
  price: number;
  cost: number;
  imageUrl?: string;
  indexedDBId?: number;
  skus: Array<{
    _id: string;
    name: string;
    quantity: number;
    cost?: number;
    creationTime?: number;
    options?: ProductSkuOptions;
  }>;

  totalQuantity: number;
  unitsSold: number;
  revenue: number;
  profit: number;
  margin: number;
  sellThrough: number;
  daysSinceLastSale: number | null;
  stockValue: number;
  agingBand: number;
  daysOfCover: number;
  lastSaleTime: number | null;

  sizeImbalance: boolean;
};

const getProductInventoryQuantity = (product: any) => {
  if (Array.isArray(product?.skus) && product.skus.length > 0) {
    return product.skus.reduce(
      (sum: number, sku: any) => sum + (sku.quantity ?? 0),
      0,
    );
  }
  return product?.quantity ?? 0;
};

const checkSizeImbalance = (product: any): boolean => {
  if (!Array.isArray(product?.skus) || product.skus.length === 0) {
    return false;
  }
  const totalQuantity = product.skus.reduce(
    (sum: number, sku: any) => sum + (sku.quantity ?? 0),
    0,
  );
  if (totalQuantity === 0) return false;

  for (const sku of product.skus) {
    const skuQty = sku.quantity ?? 0;
    if (skuQty > totalQuantity * 0.5) {
      return true;
    }
  }
  return false;
};

export const useGetProductTableData = (
  from: number,
  to: number,
): ProductTableRow[] => {
  const { data: products = [] } = useGetProducts();
  const { data: sales = [] } = useGetSales();

  return useMemo(() => {
    const fromTime = toAlgeriaDayStart(from);
    const toTime = toAlgeriaDayStart(to) + DAY_MS - 1;
    const now = Date.now();

    const productSales = new Map<
      string,
      {
        unitsSold: number;
        revenue: number;
        cost: number;
        lastSaleTime: number | null;
      }
    >();

    for (const sale of sales) {
      const saleTimestamp = new Date(sale.createdAt).getTime();
      if (saleTimestamp < fromTime || saleTimestamp > toTime) continue;

      for (const item of sale.items ?? []) {
        const pid = String(item.productId);
        const existing = productSales.get(pid) || {
          unitsSold: 0,
          revenue: 0,
          cost: 0,
          lastSaleTime: null,
        };

        const units = item.quantity ?? 0;
        const revenue = (item.price ?? 0) * units;
        const cost = (item.cost ?? 0) * units;

        existing.unitsSold += units;
        existing.revenue += revenue;
        existing.cost += cost;
        existing.lastSaleTime =
          existing.lastSaleTime === null
            ? saleTimestamp
            : Math.max(existing.lastSaleTime, saleTimestamp);

        productSales.set(pid, existing);
      }
    }

    return products.map((product: any) => {
      const totalQuantity = getProductInventoryQuantity(product);
      const salesData = productSales.get(String(product._id)) || {
        unitsSold: 0,
        revenue: 0,
        cost: 0,
        lastSaleTime: null,
      };

      const avgDailySales =
        salesData.unitsSold / ((toTime - fromTime) / DAY_MS);
      const daysOfCover =
        avgDailySales > 0
          ? Math.round(totalQuantity / avgDailySales)
          : Infinity;

      const lastSaleTime = salesData.lastSaleTime;
      const daysSinceLastSale =
        lastSaleTime !== null
          ? Math.floor((now - lastSaleTime) / DAY_MS)
          : null;

      const sellThrough =
        salesData.unitsSold + totalQuantity > 0
          ? (salesData.unitsSold / (salesData.unitsSold + totalQuantity)) * 100
          : 0;

      const stockValue = totalQuantity * (product.cost ?? 0);
      const profit = salesData.revenue - salesData.cost;
      const margin =
        salesData.revenue > 0 ? (profit / salesData.revenue) * 100 : 0;

      const creationTime = product._creationTime;
      const agingBand = creationTime
        ? Math.floor((now - creationTime) / DAY_MS)
        : 0;

      const firstImage = product.images
        ?.filter((img: any) => !img.hidden && img.url)
        .sort((a: any, b: any) => a.order - b.order)[0];

      return {
        _id: product._id,
        title: product.title,
        desc: product.desc,
        status: product.status,
        categoryId: product.categoryId,
        category: product.category,
        collections: product.collections ?? [],
        images: product.images ?? [],
        price: product.price,
        cost: product.cost ?? 0,
        imageUrl: firstImage?.url,
        indexedDBId: firstImage?.indexedDBId,
        skus: product.skus ?? [],

        totalQuantity,
        unitsSold: salesData.unitsSold,
        revenue: salesData.revenue,
        profit,
        margin,
        sellThrough,
        daysSinceLastSale,
        stockValue,
        agingBand,
        daysOfCover,
        lastSaleTime,

        sizeImbalance: checkSizeImbalance(product),
      };
    });
  }, [products, sales, from, to]);
};

export type FilterChip =
  | "highPerformers"
  | "lowStock"
  | "deadStock"
  | "lowMargin";

export const filterProducts = (
  products: ProductTableRow[],
  filters: FilterChip[],
  marginThreshold: number = 20,
): ProductTableRow[] => {
  if (filters.length === 0) return products;

  return products.filter((product) => {
    for (const filter of filters) {
      switch (filter) {
        case "highPerformers":
          if (product.sellThrough > 70) return true;
          break;
        case "lowStock":
          if (product.daysOfCover < 7 && product.daysOfCover !== Infinity)
            return true;
          break;
        case "deadStock":
          if (
            product.daysSinceLastSale !== null &&
            product.daysSinceLastSale > 30
          )
            return true;
          break;
        case "lowMargin":
          if (product.margin < marginThreshold) return true;
          break;
      }
    }
    return false;
  });
};
