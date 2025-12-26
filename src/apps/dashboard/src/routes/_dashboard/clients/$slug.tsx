import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import type { Id } from "api/data-model";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetCustomerById } from "@/database/customers";
import { ClipLoader } from "react-spinners";

export const Route = createFileRoute("/_dashboard/clients/$slug")({
  component: ClientDetailComponent,
});

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
};

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  denied: "Refusée",
};

function ClientDetailComponent() {
  const { slug } = useParams({ from: "/_dashboard/clients/$slug" });
  const { data: client, isLoading } = useGetCustomerById(slug as Id<"customers">);

  if (isLoading || !client) {
    return (
      <div className="p-4 pt-0 flex justify-center">
        <ClipLoader color="#000" size={50} />
      </div>
    );
  }

  return (
    <div className="p-4 pt-0 w-full h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {client.firstName} {client.lastName}
          </h1>
          <p className="text-sm text-gray-500">{client.phoneNumber}</p>
        </div>
        <Link to="/clients">
          <Button variant="outline">Retour</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm font-semibold">Nom</p>
            <p className="text-sm">
              {client.firstName} {client.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Téléphone</p>
            <p className="text-sm">{client.phoneNumber}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Adresse</p>
            <p className="text-sm">
              {client.address?.address}
              {client.address?.wilaya && (
                <span>, {client.address.wilaya.htmlName}</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des Commandes ({client.orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {client.orders.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune commande</p>
          ) : (
            <div className="space-y-4">
              {client.orders.map((order: any) => {
                const totalCost = order.subTotalCost + order.deliveryCost;
                const date = new Date(order.createdAt);
                return (
                  <div
                    key={order._id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          to="/commandes/$slug"
                          params={{ slug: order._id }}
                          className="font-semibold hover:underline"
                        >
                          Commande #{order._id.slice(-8)}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {date.toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                        <p className="text-sm font-semibold">
                          {totalCost} DA
                        </p>
                      </div>
                    </div>
                    {order.address && (
                      <p className="text-sm text-gray-500">
                        {order.address.address}
                        {order.address.wilaya && (
                          <span>, {order.address.wilaya.htmlName}</span>
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

