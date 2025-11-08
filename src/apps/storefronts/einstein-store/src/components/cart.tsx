import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { useQuery } from "convex/react";
import { api } from "api/convex";
import { CartIcon } from "./icons/cart-icon";
import { useCartStore } from "@/lib/state";
import { XIcon } from "lucide-react";

export function Cart() {
  const toggleCart = useCartStore((state) => state.toggleCart);
  const removeProductFromCart = useCartStore((state) => state.removeProductFromCart);
  const cart = useCartStore((state) => state.cart);
  const products = useQuery(api.products.listProducts)
  const totalCost = Array.from(cart).map(([_, product]) => product.quantity * product.price).reduce((current, prev) => current + prev, 0)
  console.log('cart :', cart)

  async function handleOrder() {
  }

  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            toggleCart();
          }, 100);
        } else {
          toggleCart();
        }
      }}
    >
      <SheetTrigger className="">
        <div className="relative">
          <div className="flex lg:hidden"> <CartIcon size={18} /> </div>
          <div className="hidden lg:flex"> <CartIcon /> </div>
          <div className="absolute -top-1 -left-2 lg:-top-1 lg:-left-3 text-[7px] lg:text-[10px] bg-primary text-white font-semibold font-inter rounded-full py-0.5 lg:py-1 px-1.5 lg:px-2">
            {cart.size}
          </div>
        </div>
      </SheetTrigger>

      <SheetContent className="bg-global-background w-[90%] lg:w-full">
        <div className="px-6 pt-4 h-[83%] lg:h-[85%]">
          <div className="absolute h-full w-[1px] bg-black left-2" />
          <div className="absolute h-full w-[1px] bg-black right-2" />

          <p className="text-[41px] font-display text-primary">CART</p>
          <div className="flex flex-col justify-between h-full gap-3 mb-2">
            <div className="flex flex-col gap-3">
              {cart.size === 0 ?
                <div className="w-full"> <p className="mx-auto italic text-[14px]">Your cart is empty.</p></div>
                :
                Array.from(cart.keys()).map((key) => {
                  const product = products?.find((product) => product?._id === key);
                  if (!product) return <p key={key}>loading...</p>;
                  return (
                    <div key={key} className="border-t-1 border-black flex pt-3 gap-2 text-[14px]">
                      <img
                        src={product?.images?.find((img) => img.order === 1)?.url}
                        className="border-white h-[102px] border-1 object-cover"
                      />
                      <div className="w-full flex flex-col gap-2 justify-start">
                        <div className="w-full flex justify-between items-start">
                          <div>
                            <p className="font-inter font-bold text-primary tracking-wide lg:text-[14px] uppercase"> {product.title}</p>
                            <p className="text-[12px] font-semibold">{product.price} DA <span className="text-black/50"> x{cart.get(key)?.quantity}</span></p>
                          </div>
                          <button onClick={() => removeProductFromCart(product._id)} className="pt-1 pr-1" > <XIcon size={16} /> </button>
                        </div>

                        <div className="flex gap-2">
                          {Object.entries(cart.get(key)!.selection).map(([key, value]) =>
                          (<div className="bg-black/5 px-2 py-1 text-[10px] font-semibold uppercase" key={key}>
                            <p>{value.variantOptionName}</p>
                          </div>
                          ))}
                        </div>

                        <button
                          onClick={() => removeProductFromCart(product._id)}
                          className="text-[#D20909] bg-red-200 flex gap-2 p-1 items-center text-[10px] self-start font-semibold"><XIcon size={10} />REMOVE FROM CART</button>
                      </div>
                    </div>
                  );
                })}
              <div className="w-full h-[1px] bg-black" />
            </div>

            <div className="border-t-1 border-black pt-3">
              <div className="pb-2">
                <p className="font-primary font-display text-primary leading-tighter text-[20px]">TOTAL COST</p>
                <p className="text-[25px] font-black leading-tighter leading-[0.7]">{totalCost} DZD</p>
              </div>

              <p className="text-[12px] opacity-40">
                Livraison 400 DZD
                <span className="text-[12px]"> (for Algiers) <button className="underline text-black/80 italic "> change wilaya </button> </span>
              </p>
            </div>
          </div>

          <SheetFooter className="p-0 pt-4.5 ">
            <Button
              type="submit"
              className="text-white rounded-lg py-5 uppercase font-inter font-bold tracking-wide"
            >
              ORDER NOW!
            </Button>
            <SheetClose asChild>
              <Button className="bg-red-200 hover:bg-red-300 text-[#D20909]">Close</Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
