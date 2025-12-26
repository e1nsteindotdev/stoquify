import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import type { Id } from "api/data-model";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirmOrder, useDenyOrder } from "@/hooks/use-convex-queries";
import { useGetOrderById } from "@/database/orders";
import { ClipLoader } from "react-spinners";

export const Route = createFileRoute("/_dashboard/commandes/$slug")({
  component: OrderDetailComponent,
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

function OrderDetailComponent() {
  const { slug } = useParams({ from: "/_dashboard/commandes/$slug" });
  const { data: order, isLoading } = useGetOrderById(slug as Id<"orders">);
  const confirmOrder = useConfirmOrder();
  const denyOrder = useDenyOrder();

  if (isLoading || !order) {
    return (
      <div className="p-4 pt-0 flex justify-center">
        <ClipLoader color="#000" size={50} />
      </div>
    );
  }

  const handleConfirm = async () => {
    await confirmOrder.mutateAsync({ orderId: slug as Id<"orders"> });
  };

  const handleDeny = async () => {
    await denyOrder.mutateAsync({ orderId: slug as Id<"orders"> });
  };

  const totalCost = order.subTotalCost + order.deliveryCost;
  const date = new Date(order.createdAt);

  return (
    <div className="p-4 pt-0 w-full h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Commande #{order._id.slice(-8)}</h1>
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
        <div className="flex gap-2">
          <Link to="/commandes">
            <Button variant="outline">Retour</Button>
          </Link>
          {order.status === "pending" && (
            <>
              <Button variant="destructive" onClick={handleDeny}>
                Refuser
              </Button>
              <Button onClick={handleConfirm}>
                Confirmer
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Informations client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-semibold">Nom complet</p>
              <p className="text-sm">
                {order.customer?.firstName} {order.customer?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Téléphone</p>
              <p className="text-sm">{order.customer?.phoneNumber}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Adresse</p>
              <p className="text-sm">
                {order.address?.address}
                {order.address?.wilaya && (
                  <span>, {order.address.wilaya.htmlName}</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Résumé de la commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <p className="text-sm">Statut</p>
              <Badge className={statusColors[order.status]}>
                {statusLabels[order.status]}
              </Badge>
            </div>
            <div className="flex justify-between">
              <p className="text-sm">Sous-total</p>
              <p className="text-sm font-semibold">{order.subTotalCost} DA</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm">Livraison</p>
              <p className="text-sm font-semibold">{order.deliveryCost} DA</p>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <p className="text-sm font-bold">Total</p>
              <p className="text-sm font-bold">{totalCost} DA</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.order.map((item, index) => (
              <div key={index} className="flex gap-4 border-b pb-4 last:border-0">
                <div className="flex-1">
                  <p className="font-semibold">{item.product?.title || "Produit"}</p>
                  <p className="text-sm text-gray-500">{item.product?.desc}</p>
                  {item.selections && item.selections.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {item.selections.map((sel: any, selIndex: number) => (
                        <Badge key={selIndex} variant="outline" className="text-xs">
                          {sel.variant?.name}: {sel.variantOption?.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm">Quantité: {item.quantity}</p>
                  <p className="text-sm font-semibold">{item.price} DA</p>
                  <p className="text-sm text-gray-500">
                    Total: {item.price * item.quantity} DA
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

