import { describe, expect, test } from "bun:test";
import { needsClerk } from "./clerk-chunks";

const signedOut = { userId: null, isAuthenticated: false };
const signedIn = { userId: "user_1", isAuthenticated: true };

describe("needsClerk", () => {
  test("loads Clerk for signed-in users on every page", () => {
    expect(needsClerk(signedIn, "/")).toBe(true);
    expect(needsClerk(signedIn, "/help")).toBe(true);
  });

  test("loads Clerk for signed-out users only on sign-in and sign-up", () => {
    expect(needsClerk(signedOut, "/sign-in")).toBe(true);
    expect(needsClerk(signedOut, "/sign-in/factor-one")).toBe(true);
    expect(needsClerk(signedOut, "/sign-up/")).toBe(true);
    expect(needsClerk(signedOut, "/")).toBe(false);
    expect(needsClerk(signedOut, "/help")).toBe(false);
    expect(needsClerk(signedOut, "/sign-inx")).toBe(false);
  });
});
