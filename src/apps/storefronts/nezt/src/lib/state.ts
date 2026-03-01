import type { Id } from "api/data-model";
import { create } from "zustand";

type CartContentType = {
  skuId: Id<"skus">;
  quantity: number;
  price: number;
};

/*
      Map [ product Id -> { selection, quantity , price} ] 
 */
type CartType = Map<Id<"products">, CartContentType>;

type Store = {
  cart: CartType;
  addProductToCart: (
    productId: Id<"products">,
    content: CartContentType,
  ) => void;
  removeProductFromCart: (productId: Id<"products">) => void;
  changeProduct: (productId: Id<"products">, content: CartContentType) => void;
  isCartOpened: boolean;
  toggleCart: () => void;
};

export const useCartStore = create<Store>((set) => ({
  cart: loadCart(),
  isCartOpened: false,
  toggleCart: () => set((state) => ({ isCartOpened: !state.isCartOpened })),
  addProductToCart: (productId, content) =>
    set((state) => {
      const cart = new Map(state.cart);
      cart.set(productId, content);
      persistCart(cart);
      return { cart };
    }),
  removeProductFromCart: (productId) =>
    set((state) => {
      const cart = new Map(state.cart);
      cart.delete(productId);
      persistCart(cart);
      return {
        cart,
      };
    }),
  changeProduct: (productId, content) =>
    set((state) => {
      const cart = new Map(state.cart);
      cart.set(productId, content);
      persistCart(cart);
      return { cart };
    }),
}));

function persistCart(cart: CartType) {
  localStorage.setItem("cart", JSON.stringify(Object.fromEntries(cart)));
}

function loadCart() {
  const storage = localStorage.getItem("cart") ?? null;
  const data = storage ? JSON.parse(storage) : {};
  const cart = new Map(Object.entries(data)) as CartType;
  return cart;
}

export const useCartTotal = () => {
  const cart = useCartStore((state) => state.cart);
  return Array.from(cart).reduce(
    (sum, [_, item]) => sum + item.quantity * item.price,
    0,
  );
};
