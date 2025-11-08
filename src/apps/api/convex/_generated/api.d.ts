/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as actions_product_actions from "../actions/product_actions.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as collections from "../collections.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as order from "../order.js";
import type * as products from "../products.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "actions/product_actions": typeof actions_product_actions;
  auth: typeof auth;
  categories: typeof categories;
  collections: typeof collections;
  http: typeof http;
  images: typeof images;
  order: typeof order;
  products: typeof products;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
