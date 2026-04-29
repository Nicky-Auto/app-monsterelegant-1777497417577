"use server";

import Stripe from "stripe";
import { MercadoPagoConfig, Preference } from "mercadopago";

const PLATFORM_FEE_PERCENT = 0.02;

export type PaymentRegion = "latam" | "international";

export interface OrderItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency: string;
  imageUrl?: string;
}

export interface CreateCheckoutSessionParams {
  region: PaymentRegion;
  orderId: string;
  items: OrderItem[];
  customerEmail: string;
  connectedAccountId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  preferenceId?: string;
  error?: string;
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  const {
    region,
    orderId,
    items,
    customerEmail,
    connectedAccountId,
    successUrl,
    cancelUrl,
    metadata,
  } = params;

  if (!items || items.length === 0) {
    return { success: false, error: "No items provided for checkout." };
  }

  try {
    if (region === "international") {
      return await createStripeCheckoutSession({
        orderId,
        items,
        customerEmail,
        connectedAccountId,
        successUrl,
        cancelUrl,
        metadata,
      });
    } else {
      return await createMercadoPagoPreference({
        orderId,
        items,
        customerEmail,
        successUrl,
        cancelUrl,
        metadata,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown payment error";
    console.error("[createCheckoutSession] Error:", message);
    return { success: false, error: message };
  }
}

async function createStripeCheckoutSession(params: {
  orderId: string;
  items: OrderItem[];
  customerEmail: string;
  connectedAccountId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<CheckoutSessionResult> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set.");
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20",
  });

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map((item) => ({
    price_data: {
      currency: item.currency.toLowerCase(),
      product_data: {
        name: item.name,
        description: item.description,
        ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
      },
      unit_amount: Math.round(item.unit_price * 100),
    },
    quantity: item.quantity,
  }));

  const totalAmountCents = params.items.reduce(
    (sum, item) => sum + Math.round(item.unit_price * 100) * item.quantity,
    0
  );

  const applicationFeeAmount = Math.round(totalAmountCents * PLATFORM_FEE_PERCENT);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: params.customerEmail,
    line_items: lineItems,
    success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${params.orderId}`,
    cancel_url: `${params.cancelUrl}?order_id=${params.orderId}`,
    metadata: {
      orderId: params.orderId,
      platform: "moda-ia",
      ...params.metadata,
    },
    payment_intent_data: {
      metadata: {
        orderId: params.orderId,
        platform: "moda-ia",
      },
      ...(params.connectedAccountId
        ? {
            application_fee_amount: applicationFeeAmount,
            transfer_data: {
              destination: params.connectedAccountId,
            },
          }
        : {}),
    },
  };

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    success: true,
    checkoutUrl: session.url ?? undefined,
    sessionId: session.id,
  };
}

async function createMercadoPagoPreference(params: {
  orderId: string;
  items: OrderItem[];
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<CheckoutSessionResult> {
  const mpAccessToken = process.env.MP_ACCESS_TOKEN;
  if (!mpAccessToken) {
    throw new Error("MP_ACCESS_TOKEN environment variable is not set.");
  }

  const client = new MercadoPagoConfig({
    accessToken: mpAccessToken,
    options: { timeout: 5000 },
  });

  const preference = new Preference(client);

  const totalAmount = params.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  const marketplaceFee = parseFloat((totalAmount * PLATFORM_FEE_PERCENT).toFixed(2));

  const mpItems = params.items.map((item) => ({
    id: item.id,
    title: item.name,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    currency_id: item.currency.toUpperCase(),
    ...(item.imageUrl ? { picture_url: item.imageUrl } : {}),
  }));

  const preferenceResponse = await preference.create({
    body: {
      items: mpItems,
      payer: {
        email: params.customerEmail,
      },
      back_urls: {
        success: `${params.successUrl}?order_id=${params.orderId}`,
        failure: `${params.cancelUrl}?order_id=${params.orderId}`,
        pending: `${params.successUrl}?order_id=${params.orderId}&status=pending`,
      },
      auto_return: "approved",
      marketplace_fee: marketplaceFee,
      external_reference: params.orderId,
      metadata: {
        orderId: params.orderId,
        platform: "moda-ia",
        ...params.metadata,
      },
      statement_descriptor: "ModaIA",
    },
  });

  if (!preferenceResponse.id) {
    throw new Error("MercadoPago preference creation failed: no ID returned.");
  }

  const checkoutUrl =
    process.env.MP_ENVIRONMENT === "production"
      ? `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${preferenceResponse.id}`
      : `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceResponse.id}`;

  return {
    success: true,
    checkoutUrl,
    preferenceId: preferenceResponse.id,
  };
}