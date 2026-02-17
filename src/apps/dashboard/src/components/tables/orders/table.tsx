import { columns, type OrderRow } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ClipLoader } from "react-spinners";
import { useStore } from "@livestore/react";
import { orders$ } from "@/livestore/schema";
import { wrapQuery } from "@/lib/error-logger";

export function OrdersTable() {
  const { store } = useStore();
  const ordersResult = wrapQuery(
    () => store.useQuery(orders$()),
    "orders-all",
    "OrdersTable",
  );
  const orders = ordersResult ?? null;
  const isLoading = ordersResult === undefined;

  const rows: OrderRow[] | undefined = orders?.map((order) => ({
    _id: order.id,
    customerName: order.address
      ? `${order.address.firstName} ${order.address.lastName}`
      : "N/A",
    phoneNumber: order.address?.phoneNumber ?? 0,
    totalCost: 0,
    status: order.status as "pending" | "confirmed" | "denied",
    createdAt: order.createdAt.getTime(),
  }));

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <ClipLoader color="#000" size={50} />
      </div>
    );
  }

  if (ordersResult === null) {
    return (
      <div className="container mx-auto py-10 text-center text-red-500">
        Unable to load orders. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-4">
      {rows && <DataTable columns={columns} data={rows} />}
    </div>
  );
}
