import { Image } from "@/components/ui/image";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useCartTotal, useCartStore } from "@/lib/state";
import { useMutation, useQuery } from "convex/react";
import { api } from "api/convex";
import { XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Id } from "api/data-model";
import { useCatalogStore } from "@/lib/catalog-store";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout")({
  component: RouteComponent,
});

function RouteComponent() {
  const products = useCatalogStore((state) => state.products);
  const cartTotal = useCartTotal();

  const removeProductFromCart = useCartStore(
    (state) => state.removeProductFromCart,
  );
  const cart = useCartStore((state) => state.cart);
  return (
    <div className="">
      {/* navbar  */}
      <Link
        to={"/"}
        className="mx-auto w-full border-b-white border-b-1 py-6 flex justify-center bg-[#EAEAEA]"
      >
        <Image src="/logo.svg" className="h-[30px]" />
      </Link>

      <div className="flex flex-col gap-5 lg:gap-0 lg:flex-row justify-center min-h-screen pb-20 lg:pb-0">
        {/* form */}
        <OrderForm />
        <div className="w-[95%] mx-auto h-[1px]  bg-black order-2 lg:hidden" />
        {/* summary  */}
        <div className="flex-1 flex justify-start lg:px-10 order-1">
          <div className="w-full lg:w-[600px] lg:h-[800px] gap-40 lg:gap-0 flex flex-col justify-between px-10 lg:px-0 my-8 order-2 font-inter relative">
            <div className="h-full w-[1px] bg-black absolute left-5 lg:-left-5 top-0" />

            {/* upper part */}
            <div>
              <p className="text-[25px] font-bold uppercase">REÇU</p>
              <div className="flex flex-col gap-3 pt-3 lg:pt-4">
                {Array.from(cart.keys()).map((key) => {
                  const product = products?.find((p) => p._id === key);
                  if (!product)
                    return (
                      <LoadingSpinner size={20} key={key} className="py-2" />
                    );
                  return (
                    <div
                      key={key}
                      className="flex gap-2 text-[14px] py-3 border-t-1 border-black"
                    >
                      <img
                        src={
                          product?.images?.find((img) => img.order === 1)?.url
                        }
                        className="border-white h-[102px] border-1 object-cover"
                      />
                      <div className="w-full flex flex-col gap-2 justify-start">
                        <div>
                          <p className="font-inter font-bold text-primary tracking-wide lg:text-[14px] uppercase">
                            {" "}
                            {product.title}
                          </p>
                          <p className="text-[12px] font-semibold">
                            {product.price} DA{" "}
                            <span className="text-black/50">
                              {" "}
                              x{cart.get(key)?.quantity}
                            </span>
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {(() => {
                            const sku = product?.skus.find(
                              (s) => s._id === cart.get(key)?.skuId,
                            );
                            return sku?.options.map((opt) => (
                              <div
                                className="bg-black/5 px-2 py-1 text-[10px] font-semibold uppercase"
                                key={opt._id}
                              >
                                <p>{opt.name}</p>
                              </div>
                            ));
                          })()}
                        </div>

                        <button
                          onClick={() =>
                            removeProductFromCart(key as Id<"products">)
                          }
                          className="text-[#D20909] bg-red-200 flex gap-2 p-1 items-center text-[10px] self-start font-semibold"
                        >
                          <XIcon size={10} />
                          RETIRER DU PANIER
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="w-full h-[1px] bg-black" />
            </div>

            {/* lower part  */}
            <div className="flex flex-col gap-2 text-[14px] uppercase border-t-1 border-black pt-3">
              <div className="w-full flex justify-between">
                <p className="font-bold">SOUS-TOTAL</p>
                <p>{cartTotal} DA</p>
              </div>

              <div className="w-full flex justify-between">
                <p className="font-bold">livraison</p>
                <p>400 DA</p>
              </div>

              <div className="w-full  text-[18px] flex justify-between pt-2 mt-3 border-t-1 border-black/40 border-dashed">
                <p className="font-black">TOTAL</p>
                <p className="font-black">{cartTotal + 400} DA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderForm() {
  const sendOrder = useMutation(api.order.placeOrder);
  const cart = useCartStore((state) => state.cart);
  const removeProductFromCart = useCartStore(
    (state) => state.removeProductFromCart,
  );
  const cartArray = Array.from(cart);
  const navigate = useNavigate();

  const [stockError, setStockError] = useState<{
    items: Array<{
      productTitle: string;
      requested: number;
      available: number;
    }>;
    isOpen: boolean;
  }>({ items: [], isOpen: false });

  const products = useCatalogStore((state) => state.products);
  const skuIds = cartArray.map(([_, content]) => content.skuId);
  const skuQuantities = useQuery(api.skus.getSkuQuantities, { skuIds });

  const handleSubmit = async (
    firstName: string,
    lastName: string,
    phoneNumber: number,
    address: string,
    wilaya: string,
  ) => {
    if (!skuQuantities) return;

    const insufficientItems: Array<{
      productTitle: string;
      requested: number;
      available: number;
    }> = [];

    for (const [productId, content] of cartArray) {
      const skuData = skuQuantities.find((s) => s.skuId === content.skuId);
      const product = products?.find((p) => p._id === productId);

      if (skuData && skuData.quantity < content.quantity) {
        insufficientItems.push({
          productTitle: product?.title || "Unknown Product",
          requested: content.quantity,
          available: skuData.quantity,
        });
      }
    }

    if (insufficientItems.length > 0) {
      setStockError({ items: insufficientItems, isOpen: true });
      return;
    }

    const data = {
      firstName,
      lastName,
      phoneNumber,
      address,
      wilaya,
      order: cartArray.map(([productId, content]) => ({
        quantity: content.quantity,
        productId,
        price: content.price,
        skuId: content.skuId,
      })),
    };
    const orderId = await sendOrder(data);
    if (orderId) {
      navigate({ to: "/order-success", search: { orderId } });
    }
  };

  const handleContinueWithAvailableStock = async (
    firstName: string,
    lastName: string,
    phoneNumber: number,
    address: string,
    wilaya: string,
  ) => {
    const data = {
      firstName,
      lastName,
      phoneNumber,
      address,
      wilaya,
      order: cartArray.map(([productId, content]) => {
        const skuData = skuQuantities?.find((s) => s.skuId === content.skuId);
        const availableQty = skuData
          ? Math.min(content.quantity, skuData.quantity)
          : content.quantity;
        return {
          quantity: availableQty,
          productId,
          price: content.price,
          skuId: content.skuId,
        };
      }),
    };
    const orderId = await sendOrder(data);
    if (orderId) {
      setStockError({ items: [], isOpen: false });
      navigate({ to: "/order-success", search: { orderId } });
    }
  };

  const form = useForm({
    defaultValues: {
      firstName: "Abdelmajid",
      lastName: "Tebboun",
      phoneNumber: 540228402,
      wilaya: "Algiers",
      address: "Belfort, el harrach",
    },
    onSubmit: async ({
      value: { firstName, lastName, phoneNumber, address, wilaya },
    }) => {
      await handleSubmit(firstName, lastName, phoneNumber, address, wilaya);
    },
  });
  const wilayat = useQuery(api.order.getWilayat);
  return (
    <div className="order-3 lg:order-1 relative flex-1 flex justify-center lg:justify-end lg:bg-[#EAEAEA] border-r-1 border-white overflow-clip ">
      <div className="h-full w-[1px] bg-black absolute left-5 lg:left-14 bottom-0 lg:hidden" />

      <div className="my-8 lg:px-13 px-8 lg:w-[600px] lg:h-[800px] font-inter ">
        <p className="text-[25px] font-bold uppercase">Finaliser la commande</p>
        <div className="w-full h-[1px] bg-black mt-4" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col h-full justify-between"
        >
          <div className="flex flex-col gap-6 pt-8">
            <div className="flex gap-2">
              <div className="space-y-2 flex-1">
                <p className="text-[14px] font-semibold">Nom</p>
                <form.Field
                  name="lastName"
                  children={(field) => (
                    <Input
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                      placeholder="Tebboun"
                    />
                  )}
                />
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-[14px] font-semibold">Prenom</p>
                <form.Field
                  name="firstName"
                  children={(field) => (
                    <Input
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Abdelmajid"
                      value={field.state.value}
                    />
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[14px] font-semibold">Numero Tel</p>
              <form.Field
                name="phoneNumber"
                children={(field) => (
                  <Input
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="0540228402"
                    value={field.state.value}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <p className="text-[14px] font-semibold">Wilaya</p>
              {wilayat ? (
                <form.Field
                  name="wilaya"
                  children={(field) => (
                    <Select
                      onValueChange={(e) => field.handleChange(e)}
                      value={field.state.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Wilaya" />
                      </SelectTrigger>
                      <SelectContent className="">
                        <SelectGroup>
                          {wilayat.map((wilaya) => (
                            <SelectItem value={wilaya.name} key={wilaya.name}>
                              {wilaya.htmlName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <div className="bg-grapy-200 animate-pulse h-10 w-30" />
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[14px] font-semibold">Address</p>
              <form.Field
                name="address"
                children={(field) => (
                  <Input
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Belfort, El Harrach"
                    value={field.state.value}
                  />
                )}
              />
            </div>
          </div>

          <button className="w-full bg-primary rounded-2xl py-2 text-white font-semibold mb-8 uppercase">
            Finaliser la commande
          </button>
        </form>

        <Dialog
          open={stockError.isOpen}
          onOpenChange={(open) =>
            setStockError({ items: stockError.items, isOpen: open })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Stock insuffisant</DialogTitle>
              <DialogDescription>
                Certains articles ne sont plus disponibles en quantité
                suffisante.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {stockError.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b">
                  <span className="font-medium">{item.productTitle}</span>
                  <span className="text-red-600">
                    Demandé: {item.requested} / Disponible: {item.available}
                  </span>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStockError({ items: [], isOpen: false })}
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  const firstName = (
                    document.querySelector(
                      'input[name="firstName"]',
                    ) as HTMLInputElement
                  )?.value;
                  const lastName = (
                    document.querySelector(
                      'input[name="lastName"]',
                    ) as HTMLInputElement
                  )?.value;
                  const phoneNumber = Number(
                    (
                      document.querySelector(
                        'input[name="phoneNumber"]',
                      ) as HTMLInputElement
                    )?.value,
                  );
                  const address = (
                    document.querySelector(
                      'input[name="address"]',
                    ) as HTMLInputElement
                  )?.value;
                  const wilaya = form.getFieldValue("wilaya") ?? "Algiers";
                  handleContinueWithAvailableStock(
                    firstName,
                    lastName,
                    phoneNumber,
                    address,
                    wilaya,
                  );
                }}
              >
                Commander avec quantité disponible
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
