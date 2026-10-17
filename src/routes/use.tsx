import { publicCorsHeaders } from "@/lib/cors";
import { handleUseRequest } from "@/lib/og-generation";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/use")({
  server: {
    handlers: {
      GET: ({ request }) => handleUseRequest(request),
      OPTIONS: () =>
        new Response(null, { status: 204, headers: publicCorsHeaders }),
    },
  },
});
