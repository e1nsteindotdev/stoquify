import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

type TimePeriod = "today" | "week" | "month" | "year" | "all";

function getTimeRange(period: TimePeriod): { start: number; end: number } {
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.getTime();

  switch (period) {
    case "today":
      return { start: startOfToday, end: now };
    case "week": {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return { start: startOfWeek.getTime(), end: now };
    }
    case "month": {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: startOfMonth.getTime(), end: now };
    }
    case "year": {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return { start: startOfYear.getTime(), end: now };
    }
    case "all":
      return { start: 0, end: now };
    default:
      return { start: startOfToday, end: now };
  }
}

export const getSalesData = query({
  args: { period: v.union(v.literal("today"), v.literal("week"), v.literal("month"), v.literal("year"), v.literal("all")) },
  handler: async (ctx, { period }) => {
    const { start, end } = getTimeRange(period);
    
    // Get confirmed online orders (orders)
    const filteredOrders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .filter((q) => q.eq(q.field("status"), "confirmed"))
      .filter((q) => q.gte(q.field("createdAt"), start))
      .filter((q) => q.lte(q.field("createdAt"), end))
      .collect();

    // Get POS sales
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_createdAt")
      .filter((q) => q.gte(q.field("createdAt"), start))
      .filter((q) => q.lte(q.field("createdAt"), end))
      .collect();

    // Calculate online sales pure profit (Revenue - Cost)
    const onlineProfit = filteredOrders.reduce(
      (sum, order) => sum + order.order.reduce((s, item) => s + (item.quantity * (item.price - (item.cost ?? 0))), 0),
      0
    );

    // Calculate POS sales pure profit
    const posProfit = sales.reduce(
      (sum, sale) => sum + sale.order.reduce((s, item) => s + (item.quantity * (item.price - (item.cost ?? 0))), 0),
      0
    );

    return {
      onlineProfit,
      posProfit,
      totalProfit: onlineProfit + posProfit,
      orderCount: filteredOrders.length,
      saleCount: sales.length,
      orders: filteredOrders,
      sales,
    };
  },
});

export const getSalesByTimePeriod = query({
  args: { period: v.union(v.literal("today"), v.literal("week"), v.literal("month"), v.literal("year"), v.literal("all")) },
  handler: async (ctx, { period }) => {
    const { start, end } = getTimeRange(period);
    const isYear = period === "year";
    const isAll = period === "all";

    // Get confirmed orders
    const filteredOrders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .filter((q) => q.eq(q.field("status"), "confirmed"))
      .filter((q) => q.gte(q.field("createdAt"), start))
      .filter((q) => q.lte(q.field("createdAt"), end))
      .collect();

    // Get POS sales
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_createdAt")
      .filter((q) => q.gte(q.field("createdAt"), start))
      .filter((q) => q.lte(q.field("createdAt"), end))
      .collect();

    // Group by time period
    const dataMap = new Map<string, { online: number; pos: number; onlineOrders: number; posSales: number; date: string }>();

    // Process orders
    filteredOrders.forEach((order) => {
      const date = new Date(order.createdAt);
      let key: string;
      
      if (isAll) {
        // Group by month
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (isYear) {
        // Group by week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        // Group by day
        key = date.toISOString().split("T")[0];
      }

      const existing = dataMap.get(key) || { online: 0, pos: 0, onlineOrders: 0, posSales: 0, date: key };
      existing.online += order.order.reduce((s, item) => s + (item.quantity * (item.price - (item.cost ?? 0))), 0);
      existing.onlineOrders += 1;
      dataMap.set(key, existing);
    });

    // Process sales
    sales.forEach((sale) => {
      const date = new Date(sale.createdAt);
      let key: string;
      
      if (isAll) {
        // Group by month
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (isYear) {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = date.toISOString().split("T")[0];
      }

      const existing = dataMap.get(key) || { online: 0, pos: 0, onlineOrders: 0, posSales: 0, date: key };
      existing.pos += sale.order.reduce((s, item) => s + (item.quantity * (item.price - (item.cost ?? 0))), 0);
      existing.posSales += 1;
      dataMap.set(key, existing);
    });

    // Convert to array and sort
    const data = Array.from(dataMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return data;
  },
});

export const getProductPerformance = query({
  args: { period: v.union(v.literal("today"), v.literal("week"), v.literal("month"), v.literal("year"), v.literal("all")) },
  handler: async (ctx, { period }) => {
    const { start, end } = getTimeRange(period);

    // Get confirmed orders
    const filteredOrders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .filter((q) => q.eq(q.field("status"), "confirmed"))
      .filter((q) => q.gte(q.field("createdAt"), start))
      .filter((q) => q.lte(q.field("createdAt"), end))
      .collect();

    // Get POS sales
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_createdAt")
      .filter((q) => q.gte(q.field("createdAt"), start))
      .filter((q) => q.lte(q.field("createdAt"), end))
      .collect();

    // Count sales by product
    const productSales = new Map<
      string,
      { productId: string; count: number; name: string }
    >();

    // Process orders
    filteredOrders.forEach((order) => {
      order.order.forEach((item) => {
        const existing = productSales.get(item.productId) || {
          productId: item.productId,
          count: 0,
          name: "",
        };
        existing.count += item.quantity;
        productSales.set(item.productId, existing);
      });
    });

    // Process sales
    sales.forEach((sale) => {
      sale.order.forEach((item) => {
        const existing = productSales.get(item.productId) || {
          productId: item.productId,
          count: 0,
          name: "",
        };
        existing.count += item.quantity;
        productSales.set(item.productId, existing);
      });
    });

    // Get product names
    const productData = await Promise.all(
      Array.from(productSales.values()).map(async (item) => {
        const product = await ctx.db.get(item.productId as Id<"products">);
        return {
          productId: item.productId,
          count: item.count,
          name: (product as any)?.title || "Unknown Product",
        };
      })
    );

    // Sort by count
    const sorted = productData.sort((a, b) => b.count - a.count);
    
    // Get best 3 and worst 3 (excluding products with 0 sales)
    const withSales = sorted.filter((p) => p.count > 0);
    const best = withSales.slice(0, 3);
    const worst = withSales.slice(-3).reverse();

    return { best, worst };
  },
});
