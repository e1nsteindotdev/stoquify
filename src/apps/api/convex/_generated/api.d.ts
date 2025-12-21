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
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as collections from "../collections.js";
import type * as customers from "../customers.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as order from "../order.js";
import type * as products from "../products.js";
import type * as sales from "../sales.js";
import type * as settings from "../settings.js";
import type * as test from "../test.js";
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
  analytics: typeof analytics;
  auth: typeof auth;
  categories: typeof categories;
  collections: typeof collections;
  customers: typeof customers;
  http: typeof http;
  images: typeof images;
  order: typeof order;
  products: typeof products;
  sales: typeof sales;
  settings: typeof settings;
  test: typeof test;
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
