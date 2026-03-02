/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_product_actions from "../actions/product_actions.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as cleanInventory from "../cleanInventory.js";
import type * as cleanOrders from "../cleanOrders.js";
import type * as cleanProducts from "../cleanProducts.js";
import type * as collections from "../collections.js";
import type * as customeFunction from "../customeFunction.js";
import type * as customers from "../customers.js";
import type * as expenseCategories from "../expenseCategories.js";
import type * as expenses from "../expenses.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as magicLinks from "../magicLinks.js";
import type * as migrations from "../migrations.js";
import type * as order from "../order.js";
import type * as organizations from "../organizations.js";
import type * as permissions from "../permissions.js";
import type * as products from "../products.js";
import type * as sales from "../sales.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as skus from "../skus.js";
import type * as stores from "../stores.js";
import type * as types_types from "../types/types.js";
import type * as users from "../users.js";
import type * as variants from "../variants.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/product_actions": typeof actions_product_actions;
  auth: typeof auth;
  categories: typeof categories;
  cleanInventory: typeof cleanInventory;
  cleanOrders: typeof cleanOrders;
  cleanProducts: typeof cleanProducts;
  collections: typeof collections;
  customeFunction: typeof customeFunction;
  customers: typeof customers;
  expenseCategories: typeof expenseCategories;
  expenses: typeof expenses;
  http: typeof http;
  images: typeof images;
  magicLinks: typeof magicLinks;
  migrations: typeof migrations;
  order: typeof order;
  organizations: typeof organizations;
  permissions: typeof permissions;
  products: typeof products;
  sales: typeof sales;
  seed: typeof seed;
  settings: typeof settings;
  skus: typeof skus;
  stores: typeof stores;
  "types/types": typeof types_types;
  users: typeof users;
  variants: typeof variants;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
