import { Link } from "@tanstack/react-router"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { create } from "zustand"
import { Image } from "./ui/image"
import { useQuery } from "convex/react"
import { api } from "api/convex"
import { CartIcon } from "./icons/cart-icon"
import { HeartIcon } from "./icons/heart-icon"
import { MenuIcon } from "./icons/menu-icon"
import { OrderIcon } from "./icons/order-icon"

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
      <SheetTrigger> <CartIcon /> </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Are you absolutely sure?</SheetTitle>
          <SheetDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
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


type CartContentType = {
  selection: Map<string, string>,
  quantity: number
}

type CartType = Map<string, CartContentType>

type Store = {
  cart: CartType,
  addProductToCart: (productId: string, content: CartContentType) => void
  removeProductFromCart: (productId: string) => void,
  changeProduct: (productId: string, content: CartContentType) => void
  isCartOpened: boolean,
  toggleCart: () => void
}

export const useCartStore = create<Store>((set) => ({
  cart: new Map(),
  isCartOpened: false,
  toggleCart: () => set(state => ({ isCartOpened: !state.isCartOpened })),
  addProductToCart: (productId, content) => set((state) => ({
    cart: state.cart.set(productId, content)
  })),
  removeProductFromCart: (productId) => set((state) => {
    const cart = state.cart
    cart.delete(productId)
    return {
      cart: cart
    }
  }),
  changeProduct: (productId, content) => set((state) => {
    const cart = state.cart
    cart.set(productId, content)
    return { cart }
  })
}))

