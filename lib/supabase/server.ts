import { auth } from "@clerk/nextjs/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClerkSupabaseServerClient() {
  const cookieStore = await cookies();
  const { getToken } = await auth();

  return createServerClient(
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
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.log(error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            console.log(error);
          }
        },
      },
    },
  );
}

// Service role client for operations that need to bypass RLS (like caching lookups)
export async function createServiceRoleClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.log(error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            console.log(error);
          }
        },
      },
    },
  );
}
