/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as functions_attendance from "../functions/attendance.js";
import type * as functions_auth from "../functions/auth.js";
import type * as functions_opportunities from "../functions/opportunities.js";
import type * as functions_serviceHours from "../functions/serviceHours.js";
import type * as functions_users from "../functions/users.js";
import type * as lib_permissions from "../lib/permissions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "functions/attendance": typeof functions_attendance;
  "functions/auth": typeof functions_auth;
  "functions/opportunities": typeof functions_opportunities;
  "functions/serviceHours": typeof functions_serviceHours;
  "functions/users": typeof functions_users;
  "lib/permissions": typeof lib_permissions;
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
