import { corsHeaders, handleUseRequest } from "@/lib/og-generation";
import { isDocumentNavigation } from "@/lib/request";
import { auth } from "@clerk/tanstack-react-start/server";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/use")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Keep public image requests independent from Clerk. Only interactive
        // document previews need a session so Browser Run redirects cannot
        // recursively invoke screenshot generation.
        const allowDocumentNavigation = isDocumentNavigation(request)
          ? Boolean((await auth()).userId)
          : false;

        return handleUseRequest(request, { allowDocumentNavigation });
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
