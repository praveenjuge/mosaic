/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as metadata from "../metadata.js";
import type * as ogImages from "../ogImages.js";
import type * as pages from "../pages.js";
import type * as screenshots from "../screenshots.js";
import type * as sites from "../sites.js";
import type * as stats from "../stats.js";
import type * as utils_url from "../utils/url.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  metadata: typeof metadata;
  ogImages: typeof ogImages;
  pages: typeof pages;
  screenshots: typeof screenshots;
  sites: typeof sites;
  stats: typeof stats;
  "utils/url": typeof utils_url;
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
