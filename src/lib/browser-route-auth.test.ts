import { describe, expect, test } from "bun:test";
import { routeAuthFromBrowserClerk } from "./browser-route-auth";

const user = { id: "user_1" };

describe("routeAuthFromBrowserClerk", () => {
  test("defers to the server until Clerk has loaded", () => {
    expect(routeAuthFromBrowserClerk(undefined)).toBeNull();
    expect(routeAuthFromBrowserClerk({ loaded: false, user })).toBeNull();
  });

  test("signs in only an active session", () => {
    expect(
      routeAuthFromBrowserClerk({
        loaded: true,
        user,
        session: { status: "active" },
      }),
    ).toEqual({ userId: "user_1", isAuthenticated: true });
  });

  test("treats a pending session as signed out, like the server", () => {
    expect(
      routeAuthFromBrowserClerk({
        loaded: true,
        user,
        session: { status: "pending" },
      }),
    ).toEqual({ userId: null, isAuthenticated: false });
  });

  test("treats no session as signed out", () => {
    expect(
      routeAuthFromBrowserClerk({ loaded: true, user: null, session: null }),
    ).toEqual({ userId: null, isAuthenticated: false });
  });
});
