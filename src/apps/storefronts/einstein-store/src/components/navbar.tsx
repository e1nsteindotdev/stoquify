import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Image } from "./ui/image"
import { useQuery } from "convex/react"
import { api } from "api/convex"
import { CartIcon } from "./icons/cart-icon"
import { HeartIcon } from "./icons/heart-icon"
import { MenuIcon } from "./icons/menu-icon"
import { OrderIcon } from "./icons/order-icon"
import { useCartStore } from "@/lib/state"
import type { Id } from "api/data-model"
import { XIcon } from "lucide-react"

export function Navbar() {
  const categories = useQuery(api.categories.listCategories)
  return <div className="flex w-full py-3 lg:py-4 px-ip border-b-1 border-seperator">
    <Image src="/logo.svg" className="mr-auto" />
    <div className="hidden lg:flex mx-auto gap-6">
      {categories?.map((c, i) => (
        <Link
          key={i}
          to={`/categories/$slug`}
          params={{ slug: c._id as string }}
          className="text-[16px] font-bold font-inter uppercase tracking-[0.1em]" >{c.name}</Link>
      ))}
    </div>

    <div className="hidden lg:flex  gap-[32px] ml-auto z-50">
      <button> <HeartIcon /> </button>
      <Cart />
    </div>

    <div className="flex lg:hidden">
      <MenuIcon />
    </div>
  </div>
}

function Cart() {
  const toggleCart = useCartStore(state => state.toggleCart)
  const cart = useCartStore(state => state.cart)
  const removeProductFromCart = useCartStore(state => state.removeProductFromCart)
  const products = Array.from(cart.keys()).map(id => useQuery(api.products.getProductById, { id }))
  return (
    <Sheet onOpenChange={(open) => {
      if (!open) {
        setTimeout(() => {
          toggleCart()
        }, 100)
      } else {
        toggleCart()
      }
    }}>
      <SheetTrigger className="">
        <div className="relative">
          <CartIcon />
          <div className="absolute -top-2 -left-3 text-[10px] bg-primary text-white font-semibold font-inter rounded-full py-1 px-2">{cart.size}</div>
        </div>
      </SheetTrigger>
      <SheetContent className="bg-global-background">
        <SheetHeader>
          <SheetTitle>CART</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col justify-between h-full gap-3 px-3 border-l-1 border-black/20 mx-2">
          <div className="flex flex-col gap-3">
            {Array.from(cart.keys()).map(key => {
              const product = products.find(product => product?._id === key)
              if (!product) return <p>loading...</p>
              return (<div className="border-t-1 border-black/10 flex pt-3 gap-2 text-[14px]">
                <img src={product?.images?.find(img => img.order === 1)?.url}
                  className="border-white border-1 w-20 h-25 object-cover" />
                <div className="w-full">
                  <div className="w-full flex justify-between items-start">
                    <div>
                      <p className="font-display text-primary tracking-wide lg:text-[18px]">{product.title}</p>
                      <p>quantity : {cart.get(key)?.quantity}</p>
                    </div>
                    <button
                      onClick={() => { removeProductFromCart(product._id) }}
                      className="pt-1 pr-1"> <XIcon size={16} /> </button>
                  </div>
                  <div>
                    {Object.entries(cart.get(key)?.selection ?? {})?.map(value => (<p>{value[0]} : {value[1]}</p>))}
                  </div>
                </div>
              </div>)
            })}
            <div className="w-full h-[1px] bg-black/10" />
          </div>

          <div>
            <p className="text-[14px]">Livraison 400 DZD <span className="text-[12px]">(for Algiers) <button className="underline text-black/40 italic ">change wilaya</button></span>
            </p>
            <p className="text-[31px] font-black">TOTAL : 4000 DZD</p>
          </div>
        </div>

        <SheetFooter>
          <Button type="submit" className="text-white rounded-lg py-5 uppercase font-display tracking-wide">ORDER NOW!</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet >
  )
}
export function HeaderAnonc() {
  return <div className="py-2 bg-primary flex gap-[32px] overflow-clip px-4">
    {Array.from({ length: 10 }, (_, i) => i).map((_, i) => (
      <div key={i} className="flex gap-1.5 lg:gap-2 items-center">
        <OrderIcon className="scale-[0.8] lg:scale-100" />
        <p className="font-inter font-medium text-white text-[9px] lg:text-[12px] uppercase text-nowrap">LIVRAISON GRATUITE à partir de 8000DA d'achats</p>
      </div>
    ))}
  </div>
}

export function Header() {
  return <div className="w-full flex flex-col gap-1 justify-center items-start py-3 lg:py-5 px-2 lg:px-4" >
    <div className="flex gap-2.5 text-[12px] lg:text-[25px] uppercase mx-auto">
      <span>[</span>
      <span>85</span>
      <span>produits</span>
      <span> disponibles </span>
      <span>]</span>
    </div>
    {/* 139 */}
    <p className="font-extrabold font-display text-[52px] lg:text-[clamp(79px,calc(79px+0.0773*(100cqw-1024px)),139px)] leading-[0.9] tracking-tight text-primary text-start uppercase lg:text-nowrap">
      Bienvenue dans notre  shop
    </p>
    <div className="flex justify-between w-full text-[14px] lg:text-[31px] uppercase">
      <div className="flex gap-10 font-medium">
        <p>Situé</p>
        <p className="text-black/20">AU CŒUR DE <span className="text-black font-bold">L’ALGÉRIE</span></p>
      </div>
      <p>/localistion</p>
    </div>
  </div>

}


