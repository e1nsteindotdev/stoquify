import type { Id } from "api/data-model"
import { create } from "zustand"

type CartContentType = {
  selection: { [key: string]: string },
  quantity: number
}

type CartType = Map<Id<'products'>, CartContentType>

type Store = {
  cart: CartType,
  addProductToCart: (productId: Id<'products'>, content: CartContentType) => void
  removeProductFromCart: (productId: Id<'products'>) => void,
  changeProduct: (productId: Id<'products'>, content: CartContentType) => void
  isCartOpened: boolean,
  toggleCart: () => void
}

export const useCartStore = create<Store>((set) => ({
  cart: loadCart(),
  isCartOpened: false,
  toggleCart: () => set(state => ({ isCartOpened: !state.isCartOpened })),
  addProductToCart: (productId, content) => set((state) => {
    state.cart.set(productId, content);
    const cart = new Map(state.cart)
    persistCart(cart)
    return { cart }
  }),
  removeProductFromCart: (productId) => set((state) => {
    const cart = state.cart
    cart.delete(productId)
    return {
      cart: new Map(cart)
    }
  }),
  changeProduct: (productId, content) => set((state) => {
    const cart = state.cart
    cart.set(productId, content)
    return { cart: new Map(cart) }
  })
}))

function persistCart(cart: CartType) {
  localStorage.setItem('cart', JSON.stringify(Object.fromEntries(cart)))
}

function loadCart() {
  const storage = localStorage.getItem('cart') ?? null
  const data = storage ? JSON.parse(storage) : {}
  const cart = new Map(Object.entries(data)) as CartType
  console.log('loaded cart from storage :', cart)
  return cart
}



