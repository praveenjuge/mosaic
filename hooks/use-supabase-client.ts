"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

export function useSupabaseClient() {
  const { getToken } = useAuth();

  return useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            fetch: async (url, options = {}) => {
              const clerkToken = await getToken({
                template: "supabase",
              });

              const headers = new Headers(options?.headers);
              if (clerkToken) {
                headers.set("Authorization", `Bearer ${clerkToken}`);
              }

              return fetch(url, {
                ...options,
                headers,
              });
            },
          },
        },
      ),
    [getToken],
  );
}

export default useSupabaseClient;
