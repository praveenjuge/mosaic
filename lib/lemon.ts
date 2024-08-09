"use server";

import { currentUser } from "@clerk/nextjs/server";
import {
  createCheckout,
  lemonSqueezySetup,
  listCustomers,
} from "@lemonsqueezy/lemonsqueezy.js";
import { createClient } from "./supabase/server";
import { webhookHasData, webhookHasMeta } from "./utils";

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
    console.log("User is not authenticated.");
    return undefined;
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
        name: process.env.NODE_ENV === "development" ? "Praveen" : undefined,
        billingAddress: {
          country: process.env.NODE_ENV === "development" ? "IN" : undefined,
          zip: process.env.NODE_ENV === "development" ? "600011" : undefined,
        },
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
export async function storeWebhookEvent(
  eventName: string,
  body: Record<string, unknown>,
) {
  "use server";

  const client = await createClient();
  const { data, error } = await client
    .from("webhookevent")
    .insert([
      {
        eventName,
        processed: false,
        body,
      },
    ])
    .select();

  if (error) {
    console.error("Error storing webhook event:", error);
    throw new Error("Failed to store webhook event");
  }

  console.log("Webhook event stored successfully:", data?.[0]);
  return data?.[0].id;
}

/**
 * This action will process a webhook event in the database.
 * @param webhookEvent - The webhook event to process.
 */
export async function processWebhookEvent(webhookEvent: {
  id: string;
  eventName: string;
  body: any;
  processed: boolean;
}) {
  "use server";
  console.log("Processing webhook event:", webhookEvent);

  const client = await createClient();
  const { data: webhookFromDB, error } = await client
    .from("webhookevent")
    .select("*")
    .eq("id", webhookEvent)
    .single();

  if (error) {
    console.error("Error fetching webhook event:", error);
    throw new Error("Failed to fetch webhook event");
  }

  if (!webhookFromDB) {
    throw new Error(
      `Webhook event #${webhookEvent} not found in the database.`,
    );
  }

  let processingError = "No Error";
  const eventBody = webhookFromDB.body;
  const eventName = webhookFromDB.eventName;

  if (!webhookHasMeta(eventBody)) {
    processingError = "Event body is missing the 'meta' property.";
  } else if (webhookHasData(eventBody)) {
    if (eventName.startsWith("subscription_payment_")) {
      // Save subscription invoices; eventBody is a SubscriptionInvoice
      // Not implemented.
    } else if (eventName.startsWith("subscription_")) {
      console.log("Processing subscription event:", eventBody);

      const attributes = eventBody.data.attributes;
      const updateData = {
        lemonsqueezyid: eventBody.data.id,
        orderid: attributes.order_id,
        name: attributes.user_name,
        email: attributes.user_email,
        status: attributes.status,
        statusformatted: attributes.status_formatted,
        renewsat: attributes.renews_at,
        endsat: attributes.ends_at,
        trialendsat: attributes.trial_ends_at,
        price: attributes.first_subscription_item.price_id,
        ispaused: false,
        subscriptionitemid: attributes.first_subscription_item.id,
        isusagebased: attributes.first_subscription_item.is_usage_based,
        user_id: eventBody.meta.custom_data.user_id,
        planid: attributes.first_subscription_item.price_id,
      };

      // Create/update subscription in the database.
      const { data, error } = await client
        .from("subscriptions")
        .upsert(updateData, {
          onConflict: "lemonsqueezyid",
        })
        .select();

      if (data) {
        console.log("Subscription upserted successfully:", data);
      }

      if (error) {
        processingError = `Failed to upsert webhook event #${webhookFromDB[0].id} to the database.`;
        console.error(error);
      }
    } else if (eventName.startsWith("order_")) {
      // Save orders; eventBody is a "Order"
      /* Not implemented */
    } else if (eventName.startsWith("license_")) {
      // Save license keys; eventBody is a "License key"
      /* Not implemented */
    }

    // Update the webhook event in the database.
    const { data, error } = await client
      .from("webhookevent")
      .update({
        processed: true,
        processingerror: processingError,
      })
      .eq("id", webhookEvent)
      .select();

    if (error) {
      console.error("Error updating webhook event:", error);
      throw new Error("Failed to update webhook event");
    }

    if (data) {
      console.log("Webhook event updated successfully:", data);
    }
  }
}

export async function getCustomerPortalUrl() {
  configureLemonSqueezy();
  const user = await currentUser();

  if (!user) {
    console.log("User is not authenticated.");
    return undefined;
  }

  const email = user.primaryEmailAddress?.emailAddress;

  const customers = await listCustomers({
    filter: {
      email,
      storeId: process.env.LEMONSQUEEZY_STORE_ID,
    },
  });

  return JSON.parse(
    JSON.stringify(customers.data?.data[0].attributes.urls.customer_portal),
  ) as URL;
}
