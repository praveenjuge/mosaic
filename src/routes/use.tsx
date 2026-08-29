import { corsHeaders, handleUseRequest } from "@/lib/og-generation";
import { createFileRoute } from "@tanstack/react-router";

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
