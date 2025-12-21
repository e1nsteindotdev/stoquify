import { create } from "zustand";

interface AnalyticsCache {
  salesData?: any;
  salesByPeriod?: any;
  productPerformance?: any;
}

interface DashboardState {
  products: any[] | null;
  orders: any[] | null;
  analytics: Record<string, AnalyticsCache>;

  setProducts: (products: any[]) => void;
  setOrders: (orders: any[]) => void;
  setAnalytics: (
    period: string, 
    type: "salesData" | "salesByPeriod" | "productPerformance", 
    data: any
  ) => void;
  
  clearCache: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  products: null,
  orders: null,
  analytics: {},

  setProducts: (products) => set({ products }),
  setOrders: (orders) => set({ orders }),
  setAnalytics: (period, type, data) =>
    set((state) => ({
      analytics: {
        ...state.analytics,
        [period]: {
          ...(state.analytics[period] || {}),
          [type]: data,
        },
      },
    })),

  clearCache: () => set({ products: null, orders: null, analytics: {} }),
}));
