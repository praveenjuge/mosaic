import { corsHeaders, handleUseRequest } from "@/lib/og-generation";
import { auth } from "@clerk/tanstack-react-start/server";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/use")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const isPreviewRequest =
          new URL(request.url).searchParams.get("preview") === "1";

        // Preview is a separate authenticated intent. The public unsigned URL
        // remains independent from Clerk and compatible with crawlers that do
        // not send optional Fetch Metadata headers.
        if (isPreviewRequest) {
          const { userId } = await auth();
          if (!userId) {
            return new Response(
              JSON.stringify({ error: "Sign in to preview this image." }),
              {
                status: 401,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              },
            );
          }

          return handleUseRequest(request, {
            allowDocumentNavigation: true,
          });
        }

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
