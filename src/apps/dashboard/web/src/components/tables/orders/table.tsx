import { columns, type OrderRow } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { useQuery } from "convex/react";
import { api } from "api/convex";

export function OrdersTable() {
  const orders = useQuery(api.order.listOrders) ?? [];

  const rows: OrderRow[] = orders.map((order: any) => ({
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

