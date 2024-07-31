"use server";

import { currentUser } from "@clerk/nextjs/server";
import {
  createCheckout,
  lemonSqueezySetup,
} from "@lemonsqueezy/lemonsqueezy.js";

/**
 * Ensures that required environment variables are set and sets up the Lemon
 * Squeezy JS SDK. Throws an error if any environment variables are missing or
 * if there's an error setting up the SDK.
 */
export async function configureLemonSqueezy() {
  const requiredVars = [
    "LEMONSQUEEZY_API_KEY",
    "LEMONSQUEEZY_STORE_ID",
    "LEMONSQUEEZY_WEBHOOK_SECRET",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required LEMONSQUEEZY env variables: ${missingVars.join(", ")}. Please, set them in your .env file.`,
    );
  }

  return new Promise<void>((resolve, reject) => {
    lemonSqueezySetup({
      apiKey: process.env.LEMONSQUEEZY_API_KEY,
      onError: (error) => {
        // eslint-disable-next-line no-console -- allow logging
        console.error(error);
        reject(new Error(`Lemon Squeezy API error: ${error.message}`));
      },
    });
    resolve();
  });
}

/**
 * This action will create a checkout on Lemon Squeezy.
 */
export async function getCheckoutURL(variantId: number, embed = false) {
  configureLemonSqueezy();

  const user = await currentUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const checkout = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID!,
    variantId,
    {
      checkoutOptions: {
        embed,
        media: false,
        logo: !embed,
      },
      checkoutData: {
        email: user.primaryEmailAddress?.emailAddress,
        custom: {
          user_id: user.id,
        },
      },
      productOptions: {
        enabledVariants: [variantId],
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
        receiptButtonText: "Go to Dashboard",
        receiptThankYouNote: "Thank you for signing up to Mosaic!",
      },
    },
  );

  return checkout.data?.data.attributes.url;
}

/**
 * This action will store a webhook event in the database.
 * @param eventName - The name of the event.
 * @param body - The body of the event.
 */
export async function storeWebhookEvent(eventName: string, body: ["body"]) {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not set");
  }

  const id = crypto.randomInt(100000000, 1000000000);

  const returnedValue = await db
    .insert(webhookEvents)
    .values({
      id,
      eventName,
      processed: false,
      body,
    })
    .returning();

  return returnedValue[0];
}

/**
 * This action will process a webhook event in the database.
 */
export async function processWebhookEvent(webhookEvent) {
  configureLemonSqueezy();

  const dbwebhookEvent = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.id, webhookEvent.id));

  if (dbwebhookEvent.length < 1) {
    throw new Error(
      `Webhook event #${webhookEvent.id} not found in the database.`,
    );
  }

  if (!process.env.WEBHOOK_URL) {
    throw new Error(
      "Missing required WEBHOOK_URL env variable. Please, set it in your .env file.",
    );
  }

  let processingError = "";
  const eventBody = webhookEvent.body;

  if (!webhookHasMeta(eventBody)) {
    processingError = "Event body is missing the 'meta' property.";
  } else if (webhookHasData(eventBody)) {
    if (webhookEvent.eventName.startsWith("subscription_payment_")) {
      // Save subscription invoices; eventBody is a SubscriptionInvoice
      // Not implemented.
    } else if (webhookEvent.eventName.startsWith("subscription_")) {
      // Save subscription events; obj is a Subscription
      const attributes = eventBody.data.attributes;
      const variantId = attributes.variant_id as string;

      // We assume that the Plan table is up to date.
      const plan = await db
        .select()
        .from(plans)
        .where(eq(plans.variantId, parseInt(variantId, 10)));

      if (plan.length < 1) {
        processingError = `Plan with variantId ${variantId} not found.`;
      } else {
        // Update the subscription in the database.

        const priceId = attributes.first_subscription_item.price_id;

        // Get the price data from Lemon Squeezy.
        const priceData = await getPrice(priceId);
        if (priceData.error) {
          processingError = `Failed to get the price data for the subscription ${eventBody.data.id}.`;
        }

        const isUsageBased = attributes.first_subscription_item.is_usage_based;
        const price = isUsageBased
          ? priceData.data?.data.attributes.unit_price_decimal
          : priceData.data?.data.attributes.unit_price;

        const updateData: NewSubscription = {
          lemonSqueezyId: eventBody.data.id,
          orderId: attributes.order_id as number,
          name: attributes.user_name as string,
          email: attributes.user_email as string,
          status: attributes.status as string,
          statusFormatted: attributes.status_formatted as string,
          renewsAt: attributes.renews_at as string,
          endsAt: attributes.ends_at as string,
          trialEndsAt: attributes.trial_ends_at as string,
          price: price?.toString() ?? "",
          isPaused: false,
          subscriptionItemId: attributes.first_subscription_item.id,
          isUsageBased: attributes.first_subscription_item.is_usage_based,
          userId: eventBody.meta.custom_data.user_id,
          planId: plan[0].id,
        };

        // Create/update subscription in the database.
        try {
          await db.insert(subscriptions).values(updateData).onConflictDoUpdate({
            target: subscriptions.lemonSqueezyId,
            set: updateData,
          });
        } catch (error) {
          processingError = `Failed to upsert Subscription #${updateData.lemonSqueezyId} to the database.`;
          console.error(error);
        }
      }
    } else if (webhookEvent.eventName.startsWith("order_")) {
      // Save orders; eventBody is a "Order"
      /* Not implemented */
    } else if (webhookEvent.eventName.startsWith("license_")) {
      // Save license keys; eventBody is a "License key"
      /* Not implemented */
    }

    // Update the webhook event in the database.
    await db
      .update(webhookEvents)
      .set({
        processed: true,
        processingError,
      })
      .where(eq(webhookEvents.id, webhookEvent.id));
  }
}
