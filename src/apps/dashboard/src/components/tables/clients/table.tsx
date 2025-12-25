import { columns, type ClientRow } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { useCustomers } from "@/hooks/use-convex-queries";

export function ClientsTable() {
  const { data: clients = [], isLoading } = useCustomers();

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


