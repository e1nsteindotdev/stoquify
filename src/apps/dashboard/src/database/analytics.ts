import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { api } from 'api/convex'

type TimePeriod = "today" | "week" | "month" | "year" | "all"

export const useGetSalesData = (period: TimePeriod) => {
  return useQuery(convexQuery(api.analytics.getSalesData, { period }))
}

export const useGetSalesByTimePeriod = (period: TimePeriod) => {
  return useQuery(convexQuery(api.analytics.getSalesByTimePeriod, { period }))
}

export const useGetProductPerformance = (period: TimePeriod) => {
  return useQuery(convexQuery(api.analytics.getProductPerformance, { period }))
}
