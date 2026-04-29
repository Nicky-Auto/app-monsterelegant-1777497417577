import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

type WebhookHandlerResult = {
  received: boolean;
  event?: string;
  orderId?: string;
  error?: string;
};

export async function POST(req: NextRequest): Promise<NextResponse<WebhookHandlerResult>> {
  const headersList = headers();
  const stripeSignature = headersList.get("stripe-signature");
  const mpSignature = headersList.get("x-signature");
  const mpRequestId = headersList.get("x-request-id");

  const rawBody = await req.text();

  if (stripeSignature) {
    return handleStripeWebhook(rawBody, stripeSignature);
  }

  if (mpSignature || mpRequestId) {
    return handleMercadoPagoWebhook(rawBody, req);
  }

  console.warn("[Webhook] Received request with no recognized signature header.");
  return NextResponse.json(
    { received: false, error: "No recognized webhook signature found." },
    { status: 400 }
  );
}

async function handleStripeWebhook(
  rawBody: string,
  signature: string
): Promise<NextResponse<WebhookHandlerResult>> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeSecretKey) {
    console.error("[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY.");
    return NextResponse.json(
      { received: false, error: "Stripe configuration missing." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error(`[Stripe Webhook] Signature verification failed: ${message}`);
    return NextResponse.json(
      { received: false, error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  console.log(`[Stripe Webhook] Event received: ${event.type} | ID: ${event.id}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleStripeCheckoutCompleted(session);
        return NextResponse.json(
          { received: true, event: event.type, orderId: session.metadata?.orderId },
          { status: 200 }
        );
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleStripePaymentIntentSucceeded(paymentIntent);
        return NextResponse.json(
          { received: true, event: event.type, orderId: paymentIntent.metadata?.orderId },
          { status: 200 }
        );
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleStripePaymentFailed(paymentIntent);
        return NextResponse.json(
          { received: true, event: event.type, orderId: paymentIntent.metadata?.orderId },
          { status: 200 }
        );
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        await handleStripeDispute(dispute);
        return NextResponse.json(
          { received: true, event: event.type },
          { status: 200 }
        );
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        return NextResponse.json({ received: true, event: event.type }, { status: 200 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Handler error";
    console.error(`[Stripe Webhook] Error processing event ${event.type}: ${message}`);
    return NextResponse.json(
      { received: false, error: `Event processing failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handleStripeCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.warn("[Stripe] checkout.session.completed received without orderId in metadata.");
    return;
  }
  console.log(`[Stripe] Checkout completed for Order ID: ${orderId}`);
  console.log(`[Stripe] Session ID: ${session.id}`);
  console.log(`[Stripe] Customer Email: ${session.customer_email}`);
  console.log(`[Stripe] Amount Total: ${(session.amount_total ?? 0) / 100} ${session.currency?.toUpperCase()}`);
  console.log(`[Stripe] Payment Status: ${session.payment_status}`);
}

async function handleStripePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) {
    console.warn("[Stripe] payment_intent.succeeded received without orderId in metadata.");
    return;
  }
  console.log(`[Stripe] PaymentIntent succeeded for Order ID: ${orderId}`);
  console.log(`[Stripe] PaymentIntent ID: ${paymentIntent.id}`);
  console.log(`[Stripe] Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);
}

async function handleStripePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) {
    console.warn("[Stripe] payment_intent.payment_failed received without orderId in metadata.");
    return;
  }
  const failureMessage = paymentIntent.last_payment_error?.message ?? "Unknown reason";
  console.error(`[Stripe] Payment FAILED for Order ID: ${orderId}`);
  console.error(`[Stripe] Reason: ${failureMessage}`);
}

async function handleStripeDispute(dispute: Stripe.Dispute): Promise<void> {
  console.warn(`[Stripe] Dispute created for Charge ID: ${dispute.charge}`);
  console.warn(`[Stripe] Dispute Reason: ${dispute.reason}`);
  console.warn(`[Stripe] Dispute Amount: ${dispute.amount / 100} ${dispute.currency.toUpperCase()}`);
}

async function handleMercadoPagoWebhook(
  rawBody: string,
  req: NextRequest
): Promise<NextResponse<WebhookHandlerResult>> {
  const mpAccessToken = process.env.MP_ACCESS_TOKEN;
  const mpWebhookSecret = process.env.MP_WEBHOOK_SECRET;

  if (!mpAccessToken) {
    console.error("[MP Webhook] Missing MP_ACCESS_TOKEN.");
    return NextResponse.json(
      { received: false, error: "MercadoPago configuration missing." },
      { status: 500 }
    );
  }

  if (mpWebhookSecret) {
    const isValid = verifyMercadoPagoSignature(req, rawBody, mpWebhookSecret);
    if (!isValid) {
      console.error("[MP Webhook] Signature verification failed.");
      return NextResponse.json(
        { received: false, error: "MercadoPago webhook signature verification failed." },
        { status: 400 }
      );
    }
  } else {
    console.warn("[MP Webhook] MP_WEBHOOK_SECRET not set. Skipping signature verification.");
  }

  let payload: MPWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as MPWebhookPayload;
  } catch {
    console.error("[MP Webhook] Failed to parse webhook body.");
    return NextResponse.json(
      { received: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  console.log(`[MP Webhook] Event received: ${payload.type} | ID: ${payload.id}`);

  try {
    switch (payload.type) {
      case "payment": {
        await handleMercadoPagoPayment(payload, mpAccessToken);
        return NextResponse.json(
          { received: true, event: payload.type },
          { status: 200 }
        );
      }

      case "merchant_order": {
        await handleMercadoPagoMerchantOrder(payload, mpAccessToken);
        return NextResponse.json(
          { received: true, event: payload.type },
          { status: 200 }
        );
      }

      default:
        console.log(`[MP Webhook] Unhandled event type: ${payload.type}`);
        return NextResponse.json({ received: true, event: payload.type }, { status: 200 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Handler error";
    console.error(`[MP Webhook] Error processing event ${payload.type}: ${message}`);
    return NextResponse.json(
      { received: false, error: `Event processing failed: ${message}` },
      { status: 500 }
    );
  }
}

interface MPWebhookPayload {
  id: string | number;
  type: string;
  action?: string;
  data?: { id: string };
  live_mode?: boolean;
  api_version?: string;
  date_created?: string;
  user_id?: number;
}

interface MPPaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  currency_id: string;
  payer?: { email?: string; id?: number };
  payment_method_id?: string;
  payment_type_id?: string;
  fee_details?: Array<{ type: string; amount: number; fee_payer: string }>;
}

async function handleMercadoPagoPayment(
  payload: MPWebhookPayload,
  accessToken: string
): Promise<void> {
  const paymentId = payload.data?.id;
  if (!paymentId) {
    console.warn("[MP] Payment webhook received without payment ID.");
    return;
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch MP payment ${paymentId}: ${response.status} - ${errorText}`);
  }

  const payment = (await response.json()) as MPPaymentResponse;
  const orderId = payment.external_reference;

  console.log(`[MP] Payment ID: ${payment.id}`);
  console.log(`[MP] Status: ${payment.status} | Detail: ${payment.status_detail}`);
  console.log(`[MP] Order Reference: ${orderId}`);
  console.log(`[MP] Amount: ${payment.transaction_amount} ${payment.currency_id}`);
  console.log(`[MP] Payer Email: ${payment.payer?.email}`);

  switch (payment.status) {
    case "approved":
      console.log(`[MP] Payment APPROVED for Order ID: ${orderId}`);
      break;
    case "pending":
    case "in_process":
      console.log(`[MP] Payment PENDING for Order ID: ${orderId}`);
      break;
    case "rejected":
      console.error(`[MP] Payment REJECTED for Order ID: ${orderId} | Reason: ${payment.status_detail}`);
      break;
    case "cancelled":
      console.log(`[MP] Payment CANCELLED for Order ID: ${orderId}`);
      break;
    case "refunded":
    case "charged_back":
      console.warn(`[MP] Payment ${payment.status.toUpperCase()} for Order ID: ${orderId}`);
      break;
    default:
      console.log(`[MP] Unhandled payment status: ${payment.status} for Order ID: ${orderId}`);
  }
}

async function handleMercadoPagoMerchantOrder(
  payload: MPWebhookPayload,
  accessToken: string
): Promise<void> {
  const orderId = payload.data?.id;
  if (!orderId) {
    console.warn("[MP] merchant_order webhook received without order ID.");
    return;
  }

  const response = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch MP merchant_order ${orderId}: ${response.status} - ${errorText}`);
  }

  const merchantOrder = await response.json();
  console.log(`[MP] Merchant Order ID: ${merchantOrder.id}`);
  console.log(`[MP] Merchant Order Status: ${merchantOrder.status}`);
  console.log(`[MP] External Reference: ${merchantOrder.external_reference}`);
}

function verifyMercadoPagoSignature(
  req: NextRequest,
  body: string,
  secret: string
): boolean {
  try {
    const xSignature = req.headers.get("x-signature") ?? "";
    const xRequestId = req.headers.get("x-request-id") ?? "";
    const url = new URL(req.url);
    const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";

    const parts = xSignature.split(",");
    let ts = "";
    let hash = "";

    for (const part of parts) {
      const [key, value] = part.trim().split("=");
      if (key === "ts") ts = value ?? "";
      if (key === "v1") hash = value ?? "";
    }

    if (!ts || !hash) {
      console.warn("[MP] Missing ts or v1 in x-signature header.");
      return false;
    }

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const expectedHash = createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");

    const hashBuffer = Buffer.from(hash, "hex");
    const expectedBuffer = Buffer.from(expectedHash, "hex");

    if (hashBuffer.length !== expectedBuffer.length) {
      console.warn("[MP] Signature buffer length mismatch.");
      return false;
    }

    return timingSafeEqual(hashBuffer, expectedBuffer);
  } catch (err) {
    console.error("[MP] Error verifying signature:", err);
    return false;
  }
}