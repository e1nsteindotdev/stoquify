import { columns, type OrderRow } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { useConvex } from "convex/react";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useEffect, useState } from "react";
import { api } from "api/convex";

export function OrdersTable() {
  const convex = useConvex();
  const orders = useDashboardStore((state) => state.orders);
  const setOrders = useDashboardStore((state) => state.setOrders);
  const [loading, setLoading] = useState(!orders);

  useEffect(() => {
    if (!orders) {
      const fetchOrders = async () => {
        try {
          const data = await convex.query(api.order.listOrders);
          setOrders(data);
        } catch (error) {
          console.error("Failed to fetch orders:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [orders, convex, setOrders]);

  const rows: OrderRow[] = (orders ?? []).map((order: any) => ({
    _id: order._id,
    customerName: order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : "N/A",
    phoneNumber: order.customer?.phoneNumber ?? 0,
    totalCost: order.subTotalCost + order.deliveryCost,
    status: order.status,
    createdAt: order.createdAt,
  }));

  return (
    <div className="container mx-auto py-10 space-y-4">
      <DataTable columns={columns} data={rows} />
    </div>
  );
}

