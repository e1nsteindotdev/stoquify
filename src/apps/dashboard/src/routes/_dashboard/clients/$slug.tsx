import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import type { Id } from "api/data-model";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetCustomerById } from "@/database/customers";
import { ClipLoader } from "react-spinners";
import {
  ArrowLeft,
  Package,
  Phone,
  MapPin,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";

export const Route = createFileRoute("/_dashboard/clients/$slug")({
  component: ClientDetailComponent,
});

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  denied: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  denied: "Refusée",
};

function ClientDetailComponent() {
  const { slug } = useParams({ from: "/_dashboard/clients/$slug" });
  const {
    data: client,
    isLoading,
    error,
  } = useGetCustomerById(slug as Id<"customers">);

  if (error) {
    return (
      <div className="p-4 pt-0 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-600">Erreur lors du chargement du client</p>
        <Link to="/clients">
          <Button variant="outline">Retour aux clients</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 pt-0 flex justify-center items-center min-h-[400px]">
        <ClipLoader color="#000" size={50} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-4 pt-0 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-gray-600">Client non trouvé</p>
        <Link to="/clients">
          <Button variant="outline">Retour aux clients</Button>
        </Link>
      </div>
    );
  }

  const totalSpent = client.orders.reduce((sum: number, order: any) => {
    return sum + (order.subTotalCost || 0) + (order.deliveryCost || 0);
  }, 0);

  const confirmedOrders = client.orders.filter(
    (o: any) => o.status === "confirmed",
  ).length;
  const pendingOrders = client.orders.filter(
    (o: any) => o.status === "pending",
  ).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {client.firstName} {client.lastName}
        </h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Phone className="w-4 h-4" />
            {client.phoneNumber}
          </div>
          {client.address && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {client.address.wilaya?.htmlName || "Adresse non spécifiée"}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Commandes
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {confirmedOrders} confirmée{confirmedOrders !== 1 ? "s" : ""},{" "}
              {pendingOrders} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dépensé</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSpent.toLocaleString()} DA
            </div>
            <p className="text-xs text-muted-foreground">
              Sur {client.orders.length} commande
              {client.orders.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Commandes Confirmées
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedOrders}</div>
            <p className="text-xs text-muted-foreground">
              {client.orders.length > 0
                ? ((confirmedOrders / client.orders.length) * 100).toFixed(0)
                : 0}
              % du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.orders.length > 0
                ? Math.round(totalSpent / client.orders.length).toLocaleString()
                : 0}{" "}
              DA
            </div>
            <p className="text-xs text-muted-foreground">Par commande</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informations Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Nom complet
              </p>
              <p className="text-sm font-semibold">
                {client.firstName} {client.lastName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Téléphone
              </p>
              <p className="text-sm font-semibold">{client.phoneNumber}</p>
            </div>
            {client.address && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Dernière adresse
                </p>
                <p className="text-sm">
                  {client.address.address}
                  {client.address.wilaya && (
                    <span>, {client.address.wilaya.htmlName}</span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Historique des Commandes</CardTitle>
            <CardDescription>
              {client.orders.length} commande
              {client.orders.length !== 1 ? "s" : ""} au total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {client.orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">Aucune commande</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {client.orders.map((order: any) => {
                  const totalCost =
                    (order.subTotalCost || 0) + (order.deliveryCost || 0);
                  const date = new Date(order.orderTime || order._creationTime);
                  return (
                    <Link
                      key={order._id}
                      to="/commandes/$slug"
                      params={{ slug: order._id }}
                      className="block"
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold">
                                  Commande #{order._id.slice(-8)}
                                </p>
                                <Badge className={statusColors[order.status]}>
                                  {statusLabels[order.status]}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {date.toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {order.address && (
                                <p className="text-xs text-muted-foreground truncate">
                                  <MapPin className="w-3 h-3 inline mr-1" />
                                  {order.address.address}
                                  {order.address.wilaya && (
                                    <span>
                                      , {order.address.wilaya.htmlName}
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                {totalCost.toLocaleString()} DA
                              </p>
                              {order.deliveryCost > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  +{order.deliveryCost.toLocaleString()} DA
                                  livraison
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
