import { createClient } from "./supabase/server";



export async function processGumroadWebhook(data) {
  console.log(data);
  const supabase = await createClient()

  // Todo add some verification
  // Verify if the subscription_id is active data.subscription_id

  const accessToken = process.env.GUMROAD_ACCESS_TOKEN;
  const subscriptionId = data.subscription_id;
  const url = `https://api.gumroad.com/v2/subscribers/${subscriptionId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subscription status');
    }

    const data = await response.json();
    console.log(data);
    // Assuming the API returns a boolean indicating if the subscription is active
    if (data.active) {
      console.log(`Subscription ${subscriptionId} is active`);
    } else {
      console.log(`Subscription ${subscriptionId} is not active`);
    }
  } catch (error) {
    console.error('Error fetching subscription status:', error);
  }

  // Insert data into Supabase
  const { error } = await supabase
    .from('gumroad_subscriptions')
    .insert({
      seller_id: data.seller_id,
      product_id: data.product_id,
      product_name: data.product_name,
      permalink: data.permalink,
      product_permalink: data.product_permalink,
      short_product_id: data.short_product_id,
      email: data.email,
      price: parseFloat(data.price),
      gumroad_fee: parseFloat(data.gumroad_fee),
      currency: data.currency,
      quantity: parseInt(data.quantity),
      discover_fee_charged: data.discover_fee_charged === 'true',
      can_contact: data.can_contact === 'true',
      referrer: data.referrer,
      order_number: data.order_number,
      sale_id: data.sale_id,
      sale_timestamp: data.sale_timestamp,
      subscription_id: data.subscription_id,
      variants: data.variants,
      offer_code: data.offer_code,
      ip_country: data.ip_country,
      recurrence: data.recurrence,
      is_gift_receiver_purchase: data.is_gift_receiver_purchase === 'true',
      refunded: data.refunded === 'true',
      disputed: data.disputed === 'true',
      dispute_won: data.dispute_won === 'true',
      test: data.test === 'true'
    })

  if (error) throw error

  return { message: 'Webhook processed successfully' }
}