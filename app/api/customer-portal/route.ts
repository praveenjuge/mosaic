import { auth } from "@clerk/nextjs/server";
import { Polar } from "@polar-sh/sdk";
import { NextResponse } from "next/server";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === 'development' ? "sandbox" : "production",
});

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create customer portal session using external ID
    const response = await polar.customerSessions.create({
      externalCustomerId: userId,
    });

    if (!response || !response.customerPortalUrl) {
      return NextResponse.json(
        { error: "Failed to create customer portal session" },
        { status: 500 }
      );
    }

    // Redirect to the customer portal URL
    return NextResponse.redirect(response.customerPortalUrl);
  } catch (error: unknown) {
    console.error("Error creating customer portal session:", error);

    // Handle case where customer doesn't exist in Polar yet
    const errorObj = error as { statusCode?: number; status?: number };
    if (errorObj?.statusCode === 404 || errorObj?.status === 404) {
      return NextResponse.json(
        { error: "Customer not found. Please contact support." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create customer portal session" },
      { status: 500 }
    );
  }
}
