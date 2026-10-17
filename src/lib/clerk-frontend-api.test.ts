import { describe, expect, test } from "bun:test";
import { clerkFrontendApiOrigin } from "./clerk-frontend-api";

const key = (instance: string, host: string) =>
  `pk_${instance}_${btoa(`${host}$`)}`;

describe("clerkFrontendApiOrigin", () => {
  test("decodes production and development keys", () => {
    expect(clerkFrontendApiOrigin(key("live", "clerk.example.com"))).toBe(
      "https://clerk.example.com",
    );
    expect(
      clerkFrontendApiOrigin(key("test", "happy-cat-1.clerk.accounts.dev")),
    ).toBe("https://happy-cat-1.clerk.accounts.dev");
  });

  test("rejects keys without the expected shape", () => {
    expect(clerkFrontendApiOrigin("")).toBeNull();
    expect(clerkFrontendApiOrigin("pk_test")).toBeNull();
    expect(clerkFrontendApiOrigin("sk_live_abc")).toBeNull();
    expect(clerkFrontendApiOrigin(`pk_live_${btoa("no-dollar")}`)).toBeNull();
    expect(
      clerkFrontendApiOrigin(`pk_live_${btoa("evil.com/path$")}`),
    ).toBeNull();
  });
});
