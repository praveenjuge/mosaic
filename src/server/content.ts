import { createServerFn } from "@tanstack/react-start";
import guides from "virtual:mosaic-content/guides";
import helpArticles from "virtual:mosaic-content/helpArticles";
import { z } from "zod";

// Server functions keep every article's HTML out of the client bundle; client
// navigation fetches only the page it opens.

const slugSchema = z.string().max(200);

export const getHelpArticle = createServerFn({ method: "GET" })
  .validator(slugSchema)
  .handler(
    ({ data }) => helpArticles.find((entry) => entry.slug === data) ?? null,
  );

export const getGuide = createServerFn({ method: "GET" })
  .validator(slugSchema)
  .handler(({ data }) => guides.find((entry) => entry.slug === data) ?? null);
