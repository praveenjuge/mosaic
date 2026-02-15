import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { polar } from "./billing";
import { api } from "./_generated/api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const http = httpRouter();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
polar.registerRoutes(http as any);

http.route({
  path: "/use",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const urlParam = url.searchParams.get("url");
    const demoParam = url.searchParams.get("demo") === "true";

    if (!urlParam) {
      return new Response(JSON.stringify({ error: "URL parameter is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runAction(api.ogImageGeneration.generateOgImage, {
      url: urlParam,
      isDemo: demoParam,
    });

    if ("error" in result && typeof result.status === "number") {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ("imageUrl" in result) {
      if (demoParam || result.redirect === false) {
        return new Response(
          JSON.stringify({
            imageUrl: result.imageUrl,
            cached: result.cached ?? false,
            fallback: result.fallback ?? false,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      } else {
        return new Response(null, {
          status: 307,
          headers: {
            ...corsHeaders,
            "Location": result.imageUrl,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }),
});

export default http;