import { columns, type OrderRow } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { tables } from "@/livestore/schema";
import { queryDb } from "@livestore/livestore";
import { useStore } from "@livestore/react";

const orders$ = queryDb(tables.orders.select())

type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

export function OrdersTable() {
  const { store } = useStore()
  const orders = store.useQuery(orders$) as unknown as Mutable<typeof tables.orders.Type>[];

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


