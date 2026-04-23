import { createFileRoute } from "@tanstack/react-router";
import { handleUseRequest, corsHeaders } from "@/lib/og-generation";

export const Route = createFileRoute("/use")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return handleUseRequest(request);
      },
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      },
    },
  },
});
