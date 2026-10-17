import { describe, expect, test } from "bun:test";
import {
  routeAuthFromBrowserClerk,
  routeAuthFromCookies,
} from "./browser-route-auth";

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

describe("routeAuthFromCookies", () => {
  const signedOut = { userId: null, isAuthenticated: false };

  test("signs out a browser with no Clerk session cookie", () => {
    expect(routeAuthFromCookies("")).toEqual(signedOut);
    expect(routeAuthFromCookies("theme=dark")).toEqual(signedOut);
    expect(routeAuthFromCookies("__client_uat=0; theme=dark")).toEqual(
      signedOut,
    );
  });

  test("defers to the server when a session may exist", () => {
    expect(routeAuthFromCookies("__session=abc")).toBeNull();
    expect(routeAuthFromCookies("__client_uat_Ab12=1700000000")).toBeNull();
    expect(routeAuthFromCookies("__clerk_db_jwt=dvb_1")).toBeNull();
  });
});
