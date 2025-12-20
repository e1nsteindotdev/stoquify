import { columns, type ClientRow } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { useQuery } from "convex/react";
import { api } from "api/convex";

export function ClientsTable() {
  const clients = useQuery(api.customers.listCustomers) ?? [];

  const rows: ClientRow[] = clients.map((client: any) => ({
    _id: client._id,
    name: `${client.firstName} ${client.lastName}`,
    phoneNumber: client.phoneNumber,
    address: client.address
      ? `${client.address.address}, ${client.address.wilaya?.htmlName || ""}`
      : "N/A",
    orderCount: client.orderCount || 0,
  }));

  return (
    <div className="container mx-auto py-10 space-y-4">
      <DataTable columns={columns} data={rows} />
    </div>
  );
}

