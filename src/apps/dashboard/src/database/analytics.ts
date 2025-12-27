import { eq, gte, lte, and } from "@tanstack/db"
import { useLiveQuery } from '@tanstack/react-db'
import { salesCollection } from "./sales"
import { ordersCollection } from "./orders"
import { productsCollection } from "./products"
import { useMemo } from "react"

type TimePeriod = "today" | "week" | "month" | "year" | "all";

// Helper function to get the start timestamp for a given period
const getStartOfPeriod = (period: TimePeriod): number => {
  const now = new Date()

  switch (period) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    case "week":
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0)
      return startOfWeek.getTime()
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    case "year":
      return new Date(now.getFullYear(), 0, 1).getTime()
    case "all":
      return 0 // Beginning of time
    default:
      return 0
  }
}

// Helper function to get time range (start and end) for a given period
const getTimeRange = (period: TimePeriod): { start: number; end: number } => {
  const now = new Date()
  const end = now.getTime()

  switch (period) {
    case "today":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(),
        end
      }
    case "week":
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      return { start: startOfWeek.getTime(), end }
    case "month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
        end
      }
    case "year":
      return {
        start: new Date(now.getFullYear(), 0, 1).getTime(),
        end
      }
    case "all":
      return { start: 0, end }
    default:
      return { start: 0, end }
  }
}

// Helper to get grouping key based on period
const getGroupKey = (timestamp: number, period: TimePeriod): string => {
  const date = new Date(timestamp)

  if (period === "all") {
    // Group by month
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
  } else if (period === "year") {
    // Group by week
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    return weekStart.toISOString().split("T")[0]
  } else {
    // Group by day
    return date.toISOString().split("T")[0]
  }
}

export const useGetSalesData = (period: TimePeriod = "year") => {
  // Memoize the period start to avoid recalculating on every render
  const periodStart = useMemo(() => getStartOfPeriod(period), [period])

  // Get confirmed online orders filtered by status and period
  const { data } = useLiveQuery(q => q.from({ orders: ordersCollection }))
  console.log('period :', period, 'data  :', data)

  const ordersResult = useLiveQuery((q) =>
    q
      .from({ orders: ordersCollection })
      .where(({ orders }) =>
        and(
          eq(orders.status, 'confirmed'),
          gte(orders._creationTime, periodStart)
        )
      )
  )

  // console.log('order result ', ordersResult.data)

  // Get POS sales filtered by period
  const salesResult = useLiveQuery((q) =>
    q
      .from({ sales: salesCollection })
      .where(({ sales }) => gte(sales._creationTime, periodStart))
  )

  // console.log('sales reuslt :', salesResult)
  // Extract data arrays from results
  const filteredOrders = ordersResult?.data ?? []
  const sales = salesResult?.data ?? []

  // Calculate online sales pure profit (Revenue - Cost)
  const onlineProfit = filteredOrders.reduce(
    (sum, order) => sum + (order.order ?? []).reduce((s, item) => s + (item.quantity * (item.price - (item.cost ?? 0))), 0),
    0
  )

  // Calculate POS sales pure profit
  const posProfit = sales.reduce(
    (sum, sale) => sum + (sale.order ?? []).reduce((s, item) => s + (item.quantity * (item.price - (item.cost ?? 0))), 0),
    0
  )

  return {
    onlineProfit,
    posProfit,
    totalProfit: onlineProfit + posProfit,
    orderCount: filteredOrders.length,
    saleCount: sales.length,
    orders: filteredOrders,
    sales: sales,
  }
}

export const useGetSalesRevenue = (period: TimePeriod = "today") => {
  // Memoize the time range to avoid recalculating on every render
  const { start, end } = useMemo(() => getTimeRange(period), [period])

  // Get confirmed online orders filtered by status and time range using query operators
  const ordersResult = useLiveQuery((q) =>
    q
      .from({ orders: ordersCollection })
      .where(({ orders }) =>
        and(
          eq(orders.status, 'confirmed'),
          and(
            gte(orders._creationTime, start),
            lte(orders._creationTime, end)
          )
        )
      )
  )

  // Get POS sales filtered by time range using query operators
  const salesResult = useLiveQuery((q) =>
    q
      .from({ sales: salesCollection })
      .where(({ sales }) =>
        and(
          gte(sales._creationTime, start),
          lte(sales._creationTime, end)
        )
      )
  )

  // Extract data arrays from results
  const filteredOrders = ordersResult?.data ?? []
  const sales = salesResult?.data ?? []

  // Group and aggregate data (this must be done client-side as TanStack DB doesn't support groupBy)
  const data = useMemo(() => {
    const dataMap = new Map<string, { online: number; pos: number; onlineOrders: number; posSales: number; date: string }>()

    // Process orders
    filteredOrders.forEach((order) => {
      const key = getGroupKey(order._creationTime, period)
      const existing = dataMap.get(key) || { online: 0, pos: 0, onlineOrders: 0, posSales: 0, date: key }
      existing.online += (order.order ?? []).reduce((s, item) => s + (item.quantity * (item.price - (item.cost ?? 0))), 0)
      existing.onlineOrders += 1
      dataMap.set(key, existing)
    })

    // Process sales
    sales.forEach((sale) => {
      const key = getGroupKey(sale._creationTime, period)
      const existing = dataMap.get(key) || { online: 0, pos: 0, onlineOrders: 0, posSales: 0, date: key }
      existing.pos += (sale.order ?? []).reduce((s, item) => s + (item.quantity * (item.price - (item.cost ?? 0))), 0)
      existing.posSales += 1
      dataMap.set(key, existing)
    })

    // Convert to array and sort by date
    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredOrders, sales, period])

  return data
}




export const useGetProductPerformance = (period: TimePeriod = "today") => {
  // Memoize the time range to avoid recalculating on every render
  const { start, end } = useMemo(() => getTimeRange(period), [period])

  // Get confirmed online orders filtered by status and time range
  const ordersResult = useLiveQuery((q) =>
    q
      .from({ orders: ordersCollection })
      .where(({ orders }) =>
        and(
          eq(orders.status, 'confirmed'),
          and(
            gte(orders._creationTime, start),
            lte(orders._creationTime, end)
          )
        )
      )
  )

  // Get POS sales filtered by time range
  const salesResult = useLiveQuery((q) =>
    q
      .from({ sales: salesCollection })
      .where(({ sales }) =>
        and(
          gte(sales._creationTime, start),
          lte(sales._creationTime, end)
        )
      )
  )

  // Get all products to map IDs to names
  const productsResult = useLiveQuery((q) => q.from({ products: productsCollection }))

  // Extract data
  const filteredOrders = ordersResult?.data ?? []
  const sales = salesResult?.data ?? []
  const products = productsResult?.data ?? []

  // Calculate performance metrics
  const performance = useMemo(() => {
    const productSales = new Map<string, { productId: string; count: number; name: string }>()

    // Helper to process items
    const processItems = (items: any[]) => {
      items.forEach(item => {
        const existing = productSales.get(item.productId) || {
          productId: item.productId,
          count: 0,
          name: products.find(p => p._id === item.productId)?.title || "Unknown Product"
        }
        existing.count += item.quantity
        productSales.set(item.productId, existing)
      })
    }

    // Process orders
    filteredOrders.forEach(order => {
      processItems(order.order ?? [])
    })

    // Process sales
    sales.forEach(sale => {
      processItems(sale.order ?? [])
    })

    // Sort by count
    const sorted = Array.from(productSales.values()).sort((a, b) => b.count - a.count)

    // Get best 3 and worst 3 (excluding products with 0 sales)
    const withSales = sorted.filter((p) => p.count > 0)

    return {
      best: withSales.slice(0, 3),
      worst: withSales.slice(-3).reverse()
    }
  }, [filteredOrders, sales, products])

  return performance
}
