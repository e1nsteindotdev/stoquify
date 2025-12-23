import { columns, type OrderRow } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { useOrders } from "@/hooks/use-convex-queries";
import { ClipLoader } from "react-spinners";

export function OrdersTable() {
  const { data: orders = [], isLoading } = useOrders();

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <ClipLoader color="#000" size={50} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-4">
      <DataTable columns={columns} data={rows} />
    </div>
  );
}


