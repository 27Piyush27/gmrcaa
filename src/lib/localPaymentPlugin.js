/**
 * Local Payment API — Vite Dev Plugin
 *
 * This plugin runs a payment server INSIDE the Vite dev server so there's no
 * need for the Supabase CLI or deployed edge functions during local development.
 *
 * Routes handled:
 *   POST /api/create-razorpay-order   → creates a Razorpay order
 *   POST /api/verify-razorpay-payment → verifies payment signature
 */


import { loadEnv } from "vite";
import crypto from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────















// ─── Helpers ──────────────────────────────────────────────────────────────────


function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => data += chunk);
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function jsonResponse(
res,
data,
status = 200)
{
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// ─── Route: Create Razorpay Order ─────────────────────────────────────────────

async function handleCreateOrder(
body,
res)
{
  // Load non-VITE_ vars explicitly for the dev server plugin
  const env = loadEnv("development", process.cwd(), "");
  const KEY_ID = env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const KEY_SECRET = env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;

  if (!KEY_ID || !KEY_SECRET) {
    console.error("[Payment API] Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
    return jsonResponse(
      res,
      {
        error:
        "Payment gateway not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file."
      },
      500
    );
  }

  const { amount: directAmount, currency = "INR", description = "Service Payment" } = body;

  if (!directAmount || Number(directAmount) <= 0) {
    return jsonResponse(res, { error: "A positive amount is required." }, 400);
  }

  const baseAmount = Number(directAmount);
  const gstAmount = Math.round(baseAmount * 0.18 * 100) / 100;
  const totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100;
  const amountPaise = Math.round(totalAmount * 100);

  const receipt = `rcpt_${Date.now()}`;

  const rzpPayload = {
    amount: amountPaise,
    currency,
    receipt,
    notes: {
      description,
      service_request_id: body.service_request_id ?? "standalone"
    }
  };

  console.log("[Payment API] Creating Razorpay order:", { amountPaise, currency, receipt });

  try {
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`
      },
      body: JSON.stringify(rzpPayload)
    });

    if (!rzpRes.ok) {
      const errText = await rzpRes.text();
      console.error("[Payment API] Razorpay error:", rzpRes.status, errText);
      return jsonResponse(
        res,
        { error: "Failed to create payment order. Check your Razorpay credentials." },
        500
      );
    }

    const rzpOrder = await rzpRes.json();
    console.log("[Payment API] Razorpay order created:", rzpOrder.id);

    return jsonResponse(res, {
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      payment_id: `local_${Date.now()}`, // local dev placeholder
      key_id: KEY_ID,
      base_amount: baseAmount,
      gst_amount: gstAmount,
      total: totalAmount
    });
  } catch (err) {
    console.error("[Payment API] Network error:", err);
    return jsonResponse(res, { error: "Network error reaching Razorpay." }, 500);
  }
}

// ─── Route: Verify Razorpay Payment ───────────────────────────────────────────

async function handleVerifyPayment(
body,
res)
{
  const env = loadEnv("development", process.cwd(), "");
  const KEY_SECRET = env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;

  if (!KEY_SECRET) {
    return jsonResponse(res, { error: "Payment gateway not configured." }, 500);
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return jsonResponse(
      res,
      { error: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature" },
      400
    );
  }

  // HMAC-SHA256 verification
  const message = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto.
  createHmac("sha256", KEY_SECRET).
  update(message).
  digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.error("[Payment API] Signature verification failed for order:", razorpay_order_id);
    return jsonResponse(res, { success: false, error: "Payment signature verification failed." }, 400);
  }

  console.log("[Payment API] Payment verified successfully:", razorpay_payment_id);

  return jsonResponse(res, {
    success: true,
    message: "Payment verified successfully.",
    payment: {
      id: body.payment_id,
      status: "completed",
      razorpay_payment_id
    }
  });
}

// ─── Vite Plugin ──────────────────────────────────────────────────────────────

export default function localPaymentPlugin() {
  return {
    name: "local-payment-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // CORS headers for all /api routes
        if (req.url?.startsWith("/api/")) {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

          if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
          }
        }

        // ── POST /api/create-razorpay-order ──────────────────────────────
        if (req.url === "/api/create-razorpay-order" && req.method === "POST") {
          const body = await readBody(req);
          return handleCreateOrder(body, res);
        }

        // ── POST /api/verify-razorpay-payment ────────────────────────────
        if (req.url === "/api/verify-razorpay-payment" && req.method === "POST") {
          const body = await readBody(req);
          return handleVerifyPayment(body, res);
        }

        next();
      });
    }
  };
}