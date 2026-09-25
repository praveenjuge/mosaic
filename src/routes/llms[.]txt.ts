import llmsTxt from "@/content/llms.txt?raw";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(llmsTxt, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        }),
    },
  },
});
