import {
  createScreenshot,
  deleteScreenshotsForPages,
  extractTitleFromUrl,
  extractUrlParts,
  getOrCreatePage,
  getOrCreateWebsite,
  websiteExistsForUser,
} from "@/lib/db";
import { createClerkSupabaseServerClient } from "@/lib/supabase/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClerkSupabaseServerClient: vi.fn(),
}));

describe("db helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extractUrlParts parses url", () => {
    expect(extractUrlParts("https://example.com/path?foo=1")).toEqual({
      urlBase: "example.com",
      path: "/path?foo=1",
      hostname: "example.com",
    });
  });

  it("extractTitleFromUrl formats title", () => {
    expect(extractTitleFromUrl("https://example.com/my-page")).toBe("My Page");
  });

  it("getOrCreateWebsite returns existing website if found", async () => {
    const selectSingle = vi.fn().mockResolvedValue({
      data: { id: "1", url_base: "example.com", user_id: "u1" },
      error: null,
    });
    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: selectSingle,
        })),
      })),
      insert: vi.fn(),
    }));
    (createClerkSupabaseServerClient as unknown as vi.Mock).mockResolvedValue({
      from: fromMock,
    });

    const site = await getOrCreateWebsite("example.com", "Example");
    expect(site).toEqual({ id: "1", url_base: "example.com", user_id: "u1" });
    expect(fromMock).toHaveBeenCalledWith("sites");
    expect(selectSingle).toHaveBeenCalled();
  });

  it("createScreenshot inserts screenshot", async () => {
    const singleInsert = vi.fn().mockResolvedValue({
      data: { id: "s1", page_id: "p1", screenshot_url: "url" },
      error: null,
    });
    const fromMock = vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: singleInsert,
        })),
      })),
    }));
    (createClerkSupabaseServerClient as unknown as vi.Mock).mockResolvedValue({
      from: fromMock,
    });

    const shot = await createScreenshot("p1", "url");
    expect(shot?.id).toBe("s1");
    expect(singleInsert).toHaveBeenCalled();
  });

  it("websiteExistsForUser queries with excludeId", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "1" } });
    const neq = vi.fn(() => ({ single }));
    const eqUser = vi.fn(() => ({ neq, single }));
    const eqUrl = vi.fn(() => ({ eq: eqUser, single }));
    const select = vi.fn(() => ({ eq: eqUrl }));
    const from = vi.fn(() => ({ select }));
    (createClerkSupabaseServerClient as unknown as vi.Mock).mockResolvedValue({
      from,
    });

    const exists = await websiteExistsForUser("example.com", "u1", "2");
    expect(exists).toBe(true);
    expect(neq).toHaveBeenCalledWith("id", "2");
    expect(single).toHaveBeenCalled();
  });

  it("deleteScreenshotsForPages short-circuits when empty", async () => {
    const from = vi.fn();
    (createClerkSupabaseServerClient as unknown as vi.Mock).mockResolvedValue({
      from,
    });

    const result = await deleteScreenshotsForPages([]);
    expect(result).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("deleteScreenshotsForPages deletes given ids", async () => {
    const del = vi.fn(() => ({
      in: vi.fn().mockResolvedValue({ error: null }),
    }));
    const from = vi.fn(() => ({ delete: del }));
    (createClerkSupabaseServerClient as unknown as vi.Mock).mockResolvedValue({
      from,
    });

    const result = await deleteScreenshotsForPages(["p1", "p2"]);
    expect(result).toBe(true);
    expect(del).toHaveBeenCalled();
  });

  it("getOrCreatePage returns existing page", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "p1", website_id: "w1", path: "/" },
      error: null,
    });
    const from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ single })),
        })),
      })),
      insert: vi.fn(),
    }));
    (createClerkSupabaseServerClient as unknown as vi.Mock).mockResolvedValue({
      from,
    });

    const page = await getOrCreatePage("w1", "/", "https://example.com/");
    expect(page).toEqual({ id: "p1", website_id: "w1", path: "/" });
    expect(from).toHaveBeenCalledWith("pages");
    expect(single).toHaveBeenCalled();
  });
});
