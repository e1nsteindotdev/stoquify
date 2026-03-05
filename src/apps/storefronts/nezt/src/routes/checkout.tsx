import { ClipLoader } from "react-spinners";
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
import { XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Id } from "api/data-model";
import { useCatalogStore } from "@/lib/catalog-store";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;

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
        {/* <div className="w-[95%] mx-auto h-[1px]  bg-black order-2 lg:hidden" /> */}
        {/* summary  */}
        {/* <div className="flex-1 flex justify-start lg:px-10 order-1">
          <div className="w-full lg:w-[600px] lg:h-[800px] gap-40 lg:gap-0 flex flex-col justify-between px-10 lg:px-0 my-8 order-2 font-inter relative z-0">
            <div className="h-full w-[1px] bg-black absolute left-5 lg:-left-5 top-0" />

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
        </div> */}
      </div>
    </div>
  );
}

function OrderForm() {
  const sendOrder = async (data: any) => {
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "order:placeOrder",
        args: data,
        format: "json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to place order: ${response.statusText}`);
    }
    const result = await response.json();
    return result.value;
  };
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
  const wilayat = useCatalogStore((state) => state.wilayat);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    firstName: string,
    lastName: string,
    phoneNumber: number,
    address: string,
    wilaya: string,
  ) => {
    setIsSubmitting(true);
    try {
      const insufficientItems: Array<{
        productTitle: string;
        requested: number;
        available: number;
      }> = [];

      for (const [productId, content] of cartArray) {
        const product = products?.find((p) => p._id === productId);
        const skuData = product?.skus.find((s) => s._id === content.skuId);

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
        setIsSubmitting(false);
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
        toast.success("Commande passée avec succès!");
        navigate({ to: "/order-success", search: { orderId } });
      } else {
        toast.error("Erreur lors de la commande. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Failed to place order:", error);
      toast.error(
        "Une erreur est survenue lors de la commande. Veuillez réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueWithAvailableStock = async (
    firstName: string,
    lastName: string,
    phoneNumber: number,
    address: string,
    wilaya: string,
  ) => {
    setIsSubmitting(true);
    try {
      const data = {
        firstName,
        lastName,
        phoneNumber,
        address,
        wilaya,
        order: cartArray.map(([productId, content]) => {
          const product = products?.find((p) => p._id === productId);
          const skuData = product?.skus.find((s) => s._id === content.skuId);
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
        toast.success("Commande passée avec succès!");
        navigate({ to: "/order-success", search: { orderId } });
      } else {
        toast.error("Erreur lors de la commande. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Failed to place order:", error);
      toast.error(
        "Une erreur est survenue lors de la commande. Veuillez réessayer.",
      );
    } finally {
      setIsSubmitting(false);
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
  return (
    <div className="order-3 lg:order-1 relative flex-1 flex justify-center lg:justify-end lg:bg-[#EAEAEA] border-r-1 border-white overflow-clip">
      <div className="h-full w-[1px] bg-black absolute left-5 lg:left-14 bottom-0 lg:hidden" />

      <div className="my-8 lg:px-13 px-8 lg:w-[600px] lg:h-[800px] font-inter">
        <p className="text-[25px] font-bold uppercase">Finaliser la commande</p>
        <div className="w-full h-[1px] bg-black mt-4" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
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
                      required
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
                      required
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
                    type="number"
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="0540228402"
                    value={field.state.value}
                    required
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
                      required
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
                <div className="bg-gray-200 animate-pulse h-10 w-30" />
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
                    required
                  />
                )}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-wait transition-colors rounded-2xl py-2 text-white font-semibold mb-8 uppercase flex justify-center items-center gap-2 cursor-pointer"
          >
            {isSubmitting && <ClipLoader size={18} color="#fff" />}
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
