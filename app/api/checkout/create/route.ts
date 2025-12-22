import { auth, clerkClient } from "@clerk/nextjs/server";
import { Polar } from "@polar-sh/sdk";
import { NextRequest, NextResponse } from "next/server";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  // Use sandbox for development (test payments) and production for live payments
  server: process.env.NODE_ENV === 'development' ? "sandbox" : "production",
});

export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get product_id, plan, and customer_external_id from search params
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("product_id");
    const plan = searchParams.get("plan");
    const customerExternalId = searchParams.get("customer_external_id");

    const planToProductId: Record<string, string | undefined> = {
      pro: process.env.POLAR_PRO_PRODUCT_ID,
      "pro-yearly": process.env.POLAR_PRO_YEARLY_PRODUCT_ID,
    };

    const resolvedProductId = productId ?? (plan ? planToProductId[plan] : null);

    if (!resolvedProductId) {
      return NextResponse.json(
        { error: "Missing product_id" },
        { status: 400 }
      );
    }

    // Verify that the external ID matches the authenticated user
    const resolvedCustomerExternalId = customerExternalId ?? userId;
    if (resolvedCustomerExternalId !== userId) {
      return NextResponse.json(
        { error: "Invalid customer_external_id" },
        { status: 400 }
      );
    }

    // Get full user details from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Extract email and name, ensuring they exist
    const primaryEmail = user.primaryEmailAddress?.emailAddress;
    const customerName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined;

    // Set billing address for local development
    const isLocalDevelopment = process.env.NODE_ENV === 'development';
    const billingAddress = isLocalDevelopment ? {
      country: 'IN', // India for local development
    } as const : undefined;

    // Create checkout session with external ID and pre-filled customer data
    const checkout = await polar.checkouts.create({
      products: [resolvedProductId],
      externalCustomerId: userId,
      customerEmail: primaryEmail,
      customerName: customerName,
      customerBillingAddress: billingAddress,
      isBusinessCustomer: false, // Mark as individual customer
      customerMetadata: {
        clerk_user_id: userId
      },
      successUrl: `${request.nextUrl.origin}/confirmation?checkout_id={CHECKOUT_ID}`,
    });

    // Redirect to the checkout URL
    return NextResponse.redirect(checkout.url);
  } catch (error) {
    console.error("Checkout creation error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
