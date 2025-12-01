import crypto from "node:crypto";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export type StripeCheckoutSessionResponse = {
  id: string;
  url: string | null;
  payment_intent?: string | null;
};

export type StripeLineItem = {
  id: string;
  quantity: number | null;
  price: {
    id: string;
    product: string | StripeProduct;
    unit_amount: number | null;
  } | null;
};

export type StripeProduct = {
  id: string;
  metadata: Record<string, string>;
};

const STRIPE_API_BASE = "https://api.stripe.com/v1";

const toFormData = (params: Record<string, string | number | null | undefined>) => {
  const form = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    form.append(key, String(value));
  });

  return form;
};

const stripeRequest = async <T>(
  path: string,
  body: URLSearchParams,
  method: "POST" | "GET" = "POST",
) => {
  const url = `${STRIPE_API_BASE}${path}`;
  const response = await fetch(method === "GET" ? `${url}?${body.toString()}` : url, {
    method,
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: method === "POST" ? body : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Stripe API error (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
};

export const createCheckoutSession = async (params: {
  lineItems: {
    name: string;
    amount: number;
    quantity: number;
    bookId: string;
  }[];
  successUrl: string;
  cancelUrl: string;
  orderId: string;
  userId: string;
}): Promise<StripeCheckoutSessionResponse> => {
  const form = toFormData({
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.orderId,
    "metadata[orderId]": params.orderId,
    "metadata[userId]": params.userId,
    "payment_intent_data[metadata][orderId]": params.orderId,
    "payment_intent_data[metadata][userId]": params.userId,
  });

  params.lineItems.forEach((item, index) => {
    form.append(`line_items[${index}][price_data][currency]`, "jpy");
    form.append(
      `line_items[${index}][price_data][product_data][name]`,
      item.name,
    );
    form.append(
      `line_items[${index}][price_data][product_data][metadata][bookId]`,
      item.bookId,
    );
    form.append(
      `line_items[${index}][price_data][unit_amount]`,
      String(item.amount),
    );
    form.append(`line_items[${index}][quantity]`, String(item.quantity));
  });

  return stripeRequest<StripeCheckoutSessionResponse>(`/checkout/sessions`, form);
};

export const listCheckoutSessionLineItems = async (
  sessionId: string,
): Promise<StripeLineItem[]> => {
  const form = toFormData({
    "expand[0]": "data.price.product",
  });

  const response = await stripeRequest<{ data: StripeLineItem[] }>(
    `/checkout/sessions/${sessionId}/line_items`,
    form,
    "GET",
  );

  return response.data;
};

export const verifyStripeSignature = (rawBody: string, signature: string) => {
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }

  const parts = signature.split(",").reduce<Record<string, string>>((acc, item) => {
    const [key, value] = item.split("=");
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const timestamp = parts.t;
  const v1 = parts.v1;

  if (!timestamp || !v1) {
    return false;
  }

  const payload = `${timestamp}.${rawBody}`;
  const computedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload, "utf8")
    .digest("hex");

  const expected = Buffer.from(computedSignature, "hex");
  const provided = Buffer.from(v1, "hex");

  if (expected.length !== provided.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, provided);
};
