import crypto from "crypto";

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

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id } = req.body || {};

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

  return res.status(200).json({
    success: true,
    message: "Payment verified successfully.",
    payment: {
      id: payment_id,
      status: "completed",
      razorpay_payment_id
    }
  });
}
