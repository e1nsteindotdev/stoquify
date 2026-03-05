import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Image } from "@/components/ui/image";
import { Check } from "lucide-react";
import { useCartTotal, useCartStore } from "@/lib/state";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useCatalogStore } from "@/lib/catalog-store";
import type { Id } from "api/data-model";

export const Route = createFileRoute("/order-success")({
  component: RouteComponent,
});

function RouteComponent() {
  const products = useCatalogStore((state) => state.products);
  const cart = useCartStore((state) => state.cart);
  const cartTotal = useCartTotal();

  const removeProductFromCart = useCartStore(
    (state) => state.removeProductFromCart,
  );
  const cartArray = Array.from(cart);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#EAEAEA] px-4">
      <div className="flex flex-col lg:max-w-[550px] border-2 border-black justify-center w-full text-center gap-y-6">
        <div className="flex justify-center py-2 lg:py-4 border-b-2 border-black">
          <Image src="/logo.svg" className="h-[40px]" />
        </div>
        <div className="flex flex-col justify-center py-4 lg:pt-8 border-b-2 border-black lg:pb-8 px-2 lg:px-6">
          <div className="flex gap-4 justify-center items-center">
            <h1 className="text-2xl lg:text-3xl font-bold uppercase text-green-600">
              Commande Envoyée
            </h1>
            <Check
              color="black"
              className="size-7 lg:size-8 stroke-green-600 lg:mb-1.5"
              strokeWidth={3}
            />
          </div>
          <div className="rounded-lg space-y-2 border border-gray-200">
            <p className="text-[14px] lg:text-base text-black font-inter">
              Nous avons bien reçu votre commande et nous vous contacterons très
              bientôt pour confirmer tous les détails.
            </p>
            <p className="text-sm text-gray-600 font-inter">
              Merci de votre confiance !
            </p>
          </div>
        </div>
        {/* <div className="flex flex-col px-10 py-4"> */}
        {/*   <p className="text-[25px] font-bold uppercase">REÇU</p> */}
        {/*   <div className="flex flex-col pt-3 lg:pt-4 pb-10"> */}
        {/*     {Array.from(cart.keys()).map((key, index) => { */}
        {/*       const product = products.find((p) => p._id === key); */}
        {/*       if (!product) */}
        {/*         return <LoadingSpinner size={20} key={key} className="py-2" />; */}
        {/*       return ( */}
        {/*         <div */}
        {/*           key={key} */}
        {/*           className={cn( */}
        {/*             "flex text-[14px] py-2 border-t-1 border-black", */}
        {/*             index === cart.size - 1 && "border-b-1", */}
        {/*           )} */}
        {/*         > */}
        {/*           <img */}
        {/*             src={product?.images?.find((img) => img.order === 1)?.url} */}
        {/*             className="border-white h-[80px] lg:h-[102px] border-1 object-cover" */}
        {/*           /> */}
        {/*           <div className="flex items-center gap-6"> */}
        {/*             <p className="font-inter font-bold text-primary tracking-wide lg:text-[14px] uppercase"> */}
        {/*               {product.title} */}
        {/*             </p> */}
        {/*             <p className="text-[12px] font-semibold"> */}
        {/*               {product.price} DA{" "} */}
        {/*               <span className="text-black/50"> */}
        {/*                 {" "} */}
        {/*                 x{cart.get(key)?.quantity} */}
        {/*               </span> */}
        {/*             </p> */}
        {/*           </div> */}
        {/**/}
        {/*           <div className="flex gap-2"> */}
        {/*             {(() => { */}
        {/*               const product = products?.find((p) => p._id === key); */}
        {/*               const sku = product?.skus.find( */}
        {/*                 (s) => s._id === cart.get(key)?.skuId, */}
        {/*               ); */}
        {/*               return sku?.options.map((opt) => ( */}
        {/*                 <div */}
        {/*                   className="bg-black/5 px-2 py-1 text-[10px] font-semibold uppercase" */}
        {/*                   key={opt._id} */}
        {/*                 > */}
        {/*                   <p>{opt.name}</p> */}
        {/*                 </div> */}
        {/*               )); */}
        {/*             })()} */}
        {/*           </div> */}
        {/*         </div> */}
        {/*       ); */}
        {/*     })} */}
        {/*   </div> */}
        {/*   <div className="flex flex-col gap-2 text-[14px] uppercase pt-4"> */}
        {/*     <div className="w-full flex justify-between"> */}
        {/*       <p className="font-bold">SOUS-TOTAL</p> */}
        {/*       <p>{cartTotal} DA</p> */}
        {/*     </div> */}
        {/*     <div className="w-full h-[1px] bg-black" /> */}
        {/*     <div className="w-full flex justify-between"> */}
        {/*       <p className="font-bold">livraison</p> */}
        {/*       <p>400 DA</p> */}
        {/*     </div> */}
        {/**/}
        {/*     <div className="w-full text-[18px] flex justify-between pt-4 lg:pt-6 mt-6 border-t-1 border-black/40 border-dashed"> */}
        {/*       <p className="font-black">TOTAL</p> */}
        {/*       <p className="font-black">{cartTotal + 400} DA</p> */}
        {/*     </div> */}
        {/*   </div> */}
        {/* </div> */}
        <div className="p-4">
          <button
            onClick={() => {
              cartArray.forEach(([productId]) => {
                removeProductFromCart(productId as Id<"products">);
              });
              navigate({ to: "/" });
            }}
            className="bg-primary w-full rounded-2xl py-3 lg:text-[20px] text-white font-semibold uppercase hover:bg-primary/90 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}
