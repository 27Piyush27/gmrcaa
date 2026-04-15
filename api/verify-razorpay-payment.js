import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!KEY_SECRET) {
    return res.status(500).json({ error: "Payment gateway not configured." });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    payment_id,
    service_request_id
  } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      error: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature"
    });
  }

  // HMAC-SHA256 verification
  const message = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(message)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.error("[Payment API] Signature verification failed for order:", razorpay_order_id);
    return res.status(400).json({ success: false, error: "Payment signature verification failed." });
  }

  console.log("[Payment API] Payment verified successfully:", razorpay_payment_id);

  // ── Update service_request status to "paid" in Supabase ─────────────────
  let dbUpdated = false;
  if (service_request_id) {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        const { error: updateError } = await supabase
          .from("service_requests")
          .update({
            status: "paid",
            payment_id: razorpay_payment_id,
            paid_at: new Date().toISOString()
          })
          .eq("id", service_request_id);

        if (updateError) {
          console.error("[Payment API] Failed to update service_request:", updateError.message);
        } else {
          dbUpdated = true;
          console.log("[Payment API] service_request", service_request_id, "→ status: paid");
        }
      } catch (dbErr) {
        console.error("[Payment API] Supabase update error:", dbErr.message);
      }
    } else {
      console.warn("[Payment API] Supabase credentials not configured — skipping DB update.");
    }
  }

  return res.status(200).json({
    success: true,
    message: "Payment verified successfully.",
    db_updated: dbUpdated,
    payment: {
      id: payment_id,
      status: "completed",
      razorpay_payment_id
    }
  });
}
