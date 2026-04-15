type AuthIdentity = {
  email?: string | null;
  subject: string;
};

type AuthContext = {
  auth?: {
    getUserIdentity(): Promise<AuthIdentity | null>;
  };
};

function hasAuthContext(value: unknown): value is AuthContext {
  return typeof value === "object" && value !== null && "auth" in value;
}

export async function getUserInfoFromIdentity(ctx: unknown): Promise<{
  email: string;
  userId: string;
}> {
  if (!hasAuthContext(ctx)) {
    throw new Error("Auth context is unavailable");
  }

  const identity = await ctx.auth?.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return {
    userId: identity.subject,
    email: identity.email ?? "",
  };
}

export async function createPolarSdkClient() {
  const { Polar } = await import("@polar-sh/sdk");

  return new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
    server: (process.env.POLAR_SERVER ?? "sandbox") as
      | "production"
      | "sandbox",
  });
}

export async function findCustomerByEmail(email: string): Promise<string | null> {
  const polar = await createPolarSdkClient();

  try {
    const iterator = await polar.customers.list({ limit: 100 });
    let count = 0;
    const maxPages = 20;

    for await (const page of iterator) {
      // @ts-expect-error Polar SDK typing is incomplete for async iterator pages.
      const items = page.items || page || [];
      if (Array.isArray(items)) {
        const customer = items.find(
          (entry: { email?: string; id: string }) =>
            entry.email?.toLowerCase() === email.toLowerCase(),
        );

        if (customer) {
          return customer.id;
        }
      }

      count += 1;
      if (count >= maxPages) {
        break;
      }
    }
  } catch (error) {
    console.error("[findCustomerByEmail] Error:", error);
  }

  return null;
}
