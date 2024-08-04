export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Parse the x-www-form-urlencoded body of the request
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);
    const body = Object.fromEntries(params.entries());
    console.log("Received webhook:", body, request.headers);

    const email = body?.email;
    console.log(email);
    // You can add additional processing logic here if needed
    // Example: console.log(`Thank you ${body.full_name} for purchasing ${body.product_name}`);
    // Send a JSON response back to the client
    return new Response(JSON.stringify({ message: "Hello from the API" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error handling request:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  // // Type guard to check if the object has a 'meta' property.
  // if (webhookHasMeta(data)) {
  //   const webhookEventData = await storeWebhookEvent(
  //     data.meta.event_name,
  //     data,
  //   );

  //   console.log("Webhook event stored successfully:", webhookEventData);

  //   // Non-blocking call to process the webhook event.
  //   void processWebhookEvent(webhookEventData);

  //   return new Response("OK", { status: 200 });
  // }

  return new Response("Data invalid", { status: 400 });
}
