import { useMemo } from "react";
import { useGetCategories } from "./categories";
import { useGetOrders } from "./orders";
import { useGetProducts } from "./products";
import { useGetSales } from "./sales";

export type AnalyticsGranularity = "day" | "week" | "month";

type AnalyticsFilters = {
  from: number;
  to: number;
  granularity: AnalyticsGranularity;
};

type AnalyticsKpi = {
  value: number;
  change: number | null;
  sparkline: { label: string; value: number }[];
};

type AnalyticsTransaction = {
  timestamp: number;
  items: Array<{
    productId: unknown;
    price: number;
    quantity: number;
    cost?: number;
  }>;
};

type Totals = {
  revenue: number;
  profit: number;
  transactions: number;
};

export type AnalyticsData = {
  kpis: {
    todayRevenue: AnalyticsKpi;
    todayProfit: AnalyticsKpi;
    monthRevenue: AnalyticsKpi;
    monthProfit: AnalyticsKpi;
    transactions: AnalyticsKpi;
    averageTicket: AnalyticsKpi;
    inventoryValue: AnalyticsKpi;
    inventoryRetailValue: number;
    grossMargin: AnalyticsKpi;
  };
  revenueProfitSeries: Array<{
    key: string;
    timestamp: number;
    revenue: number;
    profit: number;
    transactions: number;
  }>;
  topProducts: Array<{
    name: string;
    unitsSold: number;
    revenue: number;
    profit: number;
    margin: number;
  }>;
  deadStock: {
    buckets: Array<{ label: string; count: number; value: number }>;
    totalValue: number;
  };
  categoryPerformance: Array<{
    name: string;
    revenue: number;
    profit: number;
    transactions: number;
  }>;
  inventoryTrend: Array<{
    key: string;
    timestamp: number;
    value: number;
  }>;
  hourlyHeatmap: Array<{
    day: string;
    hour: number;
    count: number;
  }>;
  stockCover: {
    critical: Array<{
      productName: string;
      skuName: string;
      quantity: number;
      daysCover: number;
    }>;
    warning: Array<{
      productName: string;
      skuName: string;
      quantity: number;
      daysCover: number;
    }>;
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;
const ALGERIA_OFFSET_MS = 60 * 60 * 1000;

const toAlgeriaDayStart = (timestamp: number) => {
  const d = new Date(timestamp + ALGERIA_OFFSET_MS);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime() - ALGERIA_OFFSET_MS;
};

const addDays = (timestamp: number, days: number) => timestamp + days * DAY_MS;

const getIsoWeekStart = (date: Date) => {
  const copy = new Date(date.getTime() + ALGERIA_OFFSET_MS);
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  copy.setUTCHours(0, 0, 0, 0);
  return new Date(copy.getTime() - ALGERIA_OFFSET_MS);
};

const formatBucketKey = (
  timestamp: number,
  granularity: AnalyticsGranularity,
) => {
  const date = new Date(timestamp + ALGERIA_OFFSET_MS);
  if (granularity === "month") {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  if (granularity === "week") {
    const weekStart = getIsoWeekStart(date);
    const weekStartAdjusted = new Date(weekStart.getTime() + ALGERIA_OFFSET_MS);
    return weekStartAdjusted.toISOString().split("T")[0];
  }
  return date.toISOString().split("T")[0];
};

const createBuckets = (
  from: number,
  to: number,
  granularity: AnalyticsGranularity,
) => {
  const start = toAlgeriaDayStart(from);
  const end = toAlgeriaDayStart(to) + DAY_MS - 1;
  const buckets: Array<{ key: string; timestamp: number }> = [];

  if (granularity === "day") {
    for (let ts = start; ts <= end; ts = addDays(ts, 1)) {
      buckets.push({ key: formatBucketKey(ts, granularity), timestamp: ts });
    }
    return buckets;
  }

  if (granularity === "week") {
    let current = getIsoWeekStart(new Date(start)).getTime();
    while (current <= end) {
      buckets.push({
        key: formatBucketKey(current, granularity),
        timestamp: current,
      });
      current = addDays(current, 7);
    }
    return buckets;
  }

  const startAdjusted = new Date(start + ALGERIA_OFFSET_MS);
  let current = new Date(
    startAdjusted.getUTCFullYear(),
    startAdjusted.getUTCMonth(),
    1,
  ).getTime();
  while (current <= end) {
    buckets.push({
      key: formatBucketKey(current, granularity),
      timestamp: current,
    });
    const d = new Date(current + ALGERIA_OFFSET_MS);
    current = new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 1).getTime();
  }
  return buckets;
};

const percentageChange = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return ((current - previous) / previous) * 100;
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

const getItemTotals = (
  item: { price: number; quantity: number; cost?: number },
  fallbackCost: number,
) => {
  const revenue = item.price * item.quantity;
  const itemCost = item.cost ?? fallbackCost;
  const cogs = itemCost * item.quantity;
  const profit = revenue - cogs;
  return { revenue, cogs, profit };
};

const calculateTotals = (
  transactions: AnalyticsTransaction[],
  productMap: Map<string, any>,
): Totals => {
  return transactions.reduce<Totals>(
    (acc, transaction) => {
      for (const item of transaction.items) {
        const product = productMap.get(String(item.productId));
        const totals = getItemTotals(item, product?.cost ?? 0);
        acc.revenue += totals.revenue;
        acc.profit += totals.profit;
      }
      acc.transactions += 1;
      return acc;
    },
    { revenue: 0, profit: 0, transactions: 0 },
  );
};

export const useGetAnalytics = (filters: AnalyticsFilters): AnalyticsData => {
  const { data: orders = [] } = useGetOrders();
  const { data: sales = [] } = useGetSales();
  const { data: products = [] } = useGetProducts();
  const { data: categories = [] } = useGetCategories();

  return useMemo(() => {
    const now = Date.now();
    const from = toAlgeriaDayStart(filters.from);
    const to = toAlgeriaDayStart(filters.to) + DAY_MS - 1;

    const productMap = new Map(
      products.map((product: any) => [String(product._id), product]),
    );
    const categoryMap = new Map(
      categories.map((category: any) => [String(category._id), category.name]),
    );

    const allTransactions: AnalyticsTransaction[] = [
      ...orders
        .filter((order: any) => {
          const ts = order?.orderTime;
          return typeof ts === "number" || typeof ts === "string";
        })
        .map((order: any) => ({
          timestamp: new Date(order.orderTime).getTime(),
          items: order.order ?? [],
        })),
      ...sales
        .filter((sale: any) => {
          const ts = sale?.saleTime;
          return typeof ts === "number" || typeof ts === "string";
        })
        .map((sale: any) => ({
          timestamp: new Date(sale.saleTime).getTime(),
          items: sale.order ?? [],
        })),
    ];

    const rangeTransactions = allTransactions.filter(
      (transaction) =>
        transaction.timestamp >= from && transaction.timestamp <= to,
    );

    const buckets = createBuckets(from, to, filters.granularity);
    const bucketMap = new Map(
      buckets.map((bucket) => [
        bucket.key,
        { timestamp: bucket.timestamp, revenue: 0, profit: 0, transactions: 0 },
      ]),
    );
    const soldCogsByBucket = new Map<string, number>(
      buckets.map((bucket) => [bucket.key, 0]),
    );

    for (const transaction of rangeTransactions) {
      const key = formatBucketKey(transaction.timestamp, filters.granularity);
      const bucket = bucketMap.get(key);
      if (!bucket) continue;

      bucket.transactions += 1;
      for (const item of transaction.items) {
        const product = productMap.get(String(item.productId));
        const totals = getItemTotals(item, product?.cost ?? 0);
        bucket.revenue += totals.revenue;
        bucket.profit += totals.profit;
        soldCogsByBucket.set(
          key,
          (soldCogsByBucket.get(key) ?? 0) + totals.cogs,
        );
      }
    }

    const revenueProfitSeries = buckets.map((bucket) => {
      const data = bucketMap.get(bucket.key);
      return {
        key: bucket.key,
        timestamp: data?.timestamp ?? bucket.timestamp,
        revenue: Math.round(data?.revenue ?? 0),
        profit: Math.round(data?.profit ?? 0),
        transactions: data?.transactions ?? 0,
      };
    });

    const rangeTotals = calculateTotals(rangeTransactions, productMap);
    const rangeLength = to - from + 1;
    const previousTransactions = allTransactions.filter(
      (transaction) =>
        transaction.timestamp >= from - rangeLength &&
        transaction.timestamp <= from - 1,
    );
    const previousRangeTotals = calculateTotals(
      previousTransactions,
      productMap,
    );

    const todayStart = toAlgeriaDayStart(now);
    const yesterdayStart = addDays(todayStart, -1);
    const tomorrowStart = addDays(todayStart, 1);

    const monthStart = new Date(
      new Date(now).getFullYear(),
      new Date(now).getMonth(),
      1,
    ).getTime();
    const nextMonthStart = new Date(
      new Date(now).getFullYear(),
      new Date(now).getMonth() + 1,
      1,
    ).getTime();
    const prevMonthStart = new Date(
      new Date(now).getFullYear(),
      new Date(now).getMonth() - 1,
      1,
    ).getTime();

    const todayTotals = calculateTotals(
      allTransactions.filter(
        (transaction) =>
          transaction.timestamp >= todayStart &&
          transaction.timestamp < tomorrowStart,
      ),
      productMap,
    );
    const yesterdayTotals = calculateTotals(
      allTransactions.filter(
        (transaction) =>
          transaction.timestamp >= yesterdayStart &&
          transaction.timestamp < todayStart,
      ),
      productMap,
    );
    const monthTotals = calculateTotals(
      allTransactions.filter(
        (transaction) =>
          transaction.timestamp >= monthStart &&
          transaction.timestamp < nextMonthStart,
      ),
      productMap,
    );
    const prevMonthTotals = calculateTotals(
      allTransactions.filter(
        (transaction) =>
          transaction.timestamp >= prevMonthStart &&
          transaction.timestamp < monthStart,
      ),
      productMap,
    );

    const dailySparklineStart = addDays(todayStart, -13);
    const dailyLabels = Array.from({ length: 14 }, (_, index) => {
      const ts = addDays(dailySparklineStart, index);
      return new Date(ts).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      });
    });
    const dailyMap = new Map(
      dailyLabels.map((label, index) => [
        label,
        {
          timestamp: addDays(dailySparklineStart, index),
          revenue: 0,
          profit: 0,
          transactions: 0,
        },
      ]),
    );

    for (const transaction of allTransactions) {
      if (
        transaction.timestamp < dailySparklineStart ||
        transaction.timestamp >= tomorrowStart
      )
        continue;
      const label = new Date(
        toAlgeriaDayStart(transaction.timestamp),
      ).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      });
      const dayData = dailyMap.get(label);
      if (!dayData) continue;
      dayData.transactions += 1;
      for (const item of transaction.items) {
        const product = productMap.get(String(item.productId));
        const totals = getItemTotals(item, product?.cost ?? 0);
        dayData.revenue += totals.revenue;
        dayData.profit += totals.profit;
      }
    }

    const dailySparkline = Array.from(dailyMap.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .map(([label, value]) => ({
        label,
        revenue: Math.round(value.revenue),
        profit: Math.round(value.profit),
        transactions: value.transactions,
        averageTicket:
          value.transactions > 0 ? value.revenue / value.transactions : 0,
        grossMargin:
          value.revenue > 0 ? (value.profit / value.revenue) * 100 : 0,
      }));

    const monthlySparkline = Array.from({ length: 6 }, (_, index) => {
      const d = new Date(
        new Date(now).getFullYear(),
        new Date(now).getMonth() - 5 + index,
        1,
      );
      const start = d.getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const totals = calculateTotals(
        allTransactions.filter(
          (transaction) =>
            transaction.timestamp >= start && transaction.timestamp < end,
        ),
        productMap,
      );
      return {
        label: d.toLocaleDateString("fr-FR", { month: "short" }),
        revenue: Math.round(totals.revenue),
        profit: Math.round(totals.profit),
      };
    });

    const productStats = new Map<
      string,
      { unitsSold: number; revenue: number; profit: number }
    >();
    const categoryStats = new Map<
      string,
      { revenue: number; profit: number; transactions: number }
    >();
    const movementMap = new Map<string, number>();

    for (const transaction of allTransactions) {
      for (const item of transaction.items) {
        const productId = String(item.productId);
        const product = productMap.get(productId);
        const totals = getItemTotals(item, product?.cost ?? 0);

        const latest = movementMap.get(productId) ?? 0;
        if (transaction.timestamp > latest) {
          movementMap.set(productId, transaction.timestamp);
        }

        if (transaction.timestamp < from || transaction.timestamp > to) {
          continue;
        }

        const existingProduct = productStats.get(productId) ?? {
          unitsSold: 0,
          revenue: 0,
          profit: 0,
        };
        existingProduct.unitsSold += item.quantity;
        existingProduct.revenue += totals.revenue;
        existingProduct.profit += totals.profit;
        productStats.set(productId, existingProduct);

        const categoryId = product?.categoryId
          ? String(product.categoryId)
          : "uncategorized";
        const existingCategory = categoryStats.get(categoryId) ?? {
          revenue: 0,
          profit: 0,
          transactions: 0,
        };
        existingCategory.revenue += totals.revenue;
        existingCategory.profit += totals.profit;
        existingCategory.transactions += 1;
        categoryStats.set(categoryId, existingCategory);
      }
    }

    const topProducts = Array.from(productStats.entries())
      .map(([productId, stat]) => {
        const margin =
          stat.revenue > 0 ? (stat.profit / stat.revenue) * 100 : 0;
        return {
          name: productMap.get(productId)?.title ?? "Produit inconnu",
          unitsSold: stat.unitsSold,
          revenue: Math.round(stat.revenue),
          profit: Math.round(stat.profit),
          margin,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const categoryPerformance = Array.from(categoryStats.entries())
      .map(([categoryId, stat]) => ({
        name:
          categoryId === "uncategorized"
            ? "Sans categorie"
            : (categoryMap.get(categoryId) ?? "Categorie"),
        revenue: Math.round(stat.revenue),
        profit: Math.round(stat.profit),
        transactions: stat.transactions,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const inventoryNow = products.reduce((sum: number, product: any) => {
      const quantity = getProductInventoryQuantity(product);
      const cost = product.cost ?? product.price ?? 0;
      return sum + quantity * cost;
    }, 0);

    const inventoryRetailNow = products.reduce((sum: number, product: any) => {
      const quantity = getProductInventoryQuantity(product);
      const price = product.price ?? 0;
      return sum + quantity * price;
    }, 0);

    const deadStockBuckets = {
      "30+": { label: "30+ jours", count: 0, value: 0 },
      "60+": { label: "60+ jours", count: 0, value: 0 },
      "90+": { label: "90+ jours", count: 0, value: 0 },
    };

    for (const product of products as any[]) {
      const quantity = getProductInventoryQuantity(product);
      if (quantity <= 0) continue;

      const lastMovement = movementMap.get(String(product._id)) ?? 0;
      const ageInDays =
        lastMovement === 0 ? 9999 : Math.floor((now - lastMovement) / DAY_MS);
      const value = quantity * (product.cost ?? product.price ?? 0);

      if (ageInDays >= 90) {
        deadStockBuckets["90+"].count += 1;
        deadStockBuckets["90+"].value += value;
      } else if (ageInDays >= 60) {
        deadStockBuckets["60+"].count += 1;
        deadStockBuckets["60+"].value += value;
      } else if (ageInDays >= 30) {
        deadStockBuckets["30+"].count += 1;
        deadStockBuckets["30+"].value += value;
      }
    }

    const deadStockList = [
      deadStockBuckets["30+"],
      deadStockBuckets["60+"],
      deadStockBuckets["90+"],
    ].map((bucket) => ({
      label: bucket.label,
      count: bucket.count,
      value: Math.round(bucket.value),
    }));

    let runningInventory = inventoryNow;
    const reverseInventoryTrend = [...buckets].reverse().map((bucket) => {
      const point = {
        key: bucket.key,
        timestamp: bucket.timestamp,
        value: Math.round(runningInventory),
      };
      runningInventory += soldCogsByBucket.get(bucket.key) ?? 0;
      return point;
    });

    const inventoryTrend = reverseInventoryTrend.reverse();

    const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const hourlyMap = new Map<
      string,
      { day: string; hour: number; count: number }
    >();
    for (const day of dayNames) {
      for (let hour = 0; hour < 24; hour += 1) {
        hourlyMap.set(`${day}-${hour}`, { day, hour, count: 0 });
      }
    }
    for (const transaction of rangeTransactions) {
      const date = new Date(transaction.timestamp);
      const dayIndex = (date.getDay() + 6) % 7;
      const day = dayNames[dayIndex];
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      const current = hourlyMap.get(key);
      if (current) {
        current.count += 1;
      }
    }

    const averageTicketValue =
      rangeTotals.transactions > 0
        ? rangeTotals.revenue / rangeTotals.transactions
        : 0;
    const previousAverageTicket =
      previousRangeTotals.transactions > 0
        ? previousRangeTotals.revenue / previousRangeTotals.transactions
        : 0;
    const grossMargin =
      rangeTotals.revenue > 0
        ? (rangeTotals.profit / rangeTotals.revenue) * 100
        : 0;
    const previousGrossMargin =
      previousRangeTotals.revenue > 0
        ? (previousRangeTotals.profit / previousRangeTotals.revenue) * 100
        : 0;

    const thirtyDaysAgo = now - 30 * DAY_MS;
    const productDailySales = new Map<string, number>();

    for (const transaction of allTransactions) {
      if (
        transaction.timestamp >= thirtyDaysAgo &&
        transaction.timestamp <= now
      ) {
        for (const item of transaction.items) {
          const productId = String(item.productId);
          productDailySales.set(
            productId,
            (productDailySales.get(productId) ?? 0) + item.quantity,
          );
        }
      }
    }

    const avgDailySalesByProduct = new Map<string, number>();
    for (const [productId, totalSales] of productDailySales) {
      const daysWithSales = Math.min(
        30,
        Math.max(1, Math.ceil((now - thirtyDaysAgo) / DAY_MS)),
      );
      avgDailySalesByProduct.set(productId, totalSales / daysWithSales);
    }

    const stockCoverData: Array<{
      productName: string;
      skuName: string;
      quantity: number;
      daysCover: number;
    }> = [];

    for (const product of products as any[]) {
      const productId = String(product._id);
      const avgDailySales = avgDailySalesByProduct.get(productId) ?? 0;
      const productName = product.title ?? "Produit inconnu";
      const stockingStrategy = product.stockingStrategy ?? "by_variants";

      if (stockingStrategy === "by_demand") {
        continue;
      }

      if (stockingStrategy === "by_variants") {
        const skus = product.skus;
        const variants = product.variants || [];
        const variantMap = new Map(variants.map((v: any) => [v._id, v.name]));

        if (Array.isArray(skus) && skus.length > 0) {
          for (const sku of skus) {
            const quantity = sku.quantity ?? 0;
            if (quantity <= 0) continue;

            const skuName =
              sku.options
                ?.map((o: any) => {
                  const variantName = variantMap.get(o.variantId) || "";
                  return variantName ? `${variantName}: ${o.name}` : o.name;
                })
                .join(" / ") ?? "Default";
            const daysCover =
              avgDailySales > 0 ? quantity / avgDailySales : 999;

            stockCoverData.push({
              productName,
              skuName,
              quantity,
              daysCover: Math.round(daysCover),
            });
          }
        }
      } else if (stockingStrategy === "by_number") {
        const quantity = product.quantity ?? 0;
        if (quantity > 0) {
          const daysCover = avgDailySales > 0 ? quantity / avgDailySales : 999;
          stockCoverData.push({
            productName,
            skuName: "Default",
            quantity,
            daysCover: Math.round(daysCover),
          });
        }
      }
    }

    const critical = stockCoverData
      .filter((item) => item.daysCover < 7)
      .sort((a, b) => a.daysCover - b.daysCover)
      .slice(0, 20);

    const warning = stockCoverData
      .filter((item) => item.daysCover >= 7 && item.daysCover < 90)
      .sort((a, b) => a.daysCover - b.daysCover)
      .slice(0, 20);

    return {
      kpis: {
        todayRevenue: {
          value: Math.round(todayTotals.revenue),
          change: percentageChange(
            todayTotals.revenue,
            yesterdayTotals.revenue,
          ),
          sparkline: dailySparkline.map((point) => ({
            label: point.label,
            value: point.revenue,
          })),
        },
        todayProfit: {
          value: Math.round(todayTotals.profit),
          change: percentageChange(todayTotals.profit, yesterdayTotals.profit),
          sparkline: dailySparkline.map((point) => ({
            label: point.label,
            value: point.profit,
          })),
        },
        monthRevenue: {
          value: Math.round(monthTotals.revenue),
          change: percentageChange(
            monthTotals.revenue,
            prevMonthTotals.revenue,
          ),
          sparkline: monthlySparkline.map((point) => ({
            label: point.label,
            value: point.revenue,
          })),
        },
        monthProfit: {
          value: Math.round(monthTotals.profit),
          change: percentageChange(monthTotals.profit, prevMonthTotals.profit),
          sparkline: monthlySparkline.map((point) => ({
            label: point.label,
            value: point.profit,
          })),
        },
        transactions: {
          value: rangeTotals.transactions,
          change: percentageChange(
            rangeTotals.transactions,
            previousRangeTotals.transactions,
          ),
          sparkline: dailySparkline.map((point) => ({
            label: point.label,
            value: point.transactions,
          })),
        },
        averageTicket: {
          value: Math.round(averageTicketValue),
          change: percentageChange(averageTicketValue, previousAverageTicket),
          sparkline: dailySparkline.map((point) => ({
            label: point.label,
            value: Math.round(point.averageTicket),
          })),
        },
        inventoryValue: {
          value: Math.round(inventoryNow),
          change:
            inventoryTrend.length > 1
              ? percentageChange(
                  inventoryTrend[inventoryTrend.length - 1].value,
                  inventoryTrend[Math.max(0, inventoryTrend.length - 2)].value,
                )
              : 0,
          sparkline: inventoryTrend.map((point) => ({
            label: point.key,
            value: point.value,
          })),
        },
        inventoryRetailValue: Math.round(inventoryRetailNow),
        grossMargin: {
          value: Number(grossMargin.toFixed(2)),
          change: percentageChange(grossMargin, previousGrossMargin),
          sparkline: dailySparkline.map((point) => ({
            label: point.label,
            value: Number(point.grossMargin.toFixed(2)),
          })),
        },
      },
      revenueProfitSeries,
      topProducts,
      deadStock: {
        buckets: deadStockList,
        totalValue: deadStockList.reduce(
          (sum, bucket) => sum + bucket.value,
          0,
        ),
      },
      categoryPerformance,
      inventoryTrend,
      hourlyHeatmap: Array.from(hourlyMap.values()),
      stockCover: {
        critical,
        warning,
      },
    };
  }, [
    orders,
    sales,
    products,
    categories,
    filters.from,
    filters.to,
    filters.granularity,
  ]);
};
