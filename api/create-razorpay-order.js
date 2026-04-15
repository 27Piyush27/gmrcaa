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

  const KEY_ID = process.env.RAZORPAY_KEY_ID;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!KEY_ID || !KEY_SECRET) {
    console.error("[Payment API] Razorpay credentials missing from environment variables.");
    console.error("[Payment API] KEY_ID present:", !!KEY_ID, "KEY_SECRET present:", !!KEY_SECRET);
    return res.status(500).json({
      error: "Payment gateway not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Vercel environment variables."
    });
  }

  const { amount: directAmount, currency = "INR", description = "Service Payment", service_request_id } = req.body || {};

  if (!directAmount || Number(directAmount) <= 0) {
    return res.status(400).json({ error: "A positive amount is required." });
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
      service_request_id: service_request_id ?? "standalone"
    }
  };

  console.log("[Payment API] Creating Razorpay order:", { amountPaise, currency, receipt, keyPrefix: KEY_ID.substring(0, 10) });

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
      let razorpayError = "Failed to create payment order.";
      try {
        const errJson = JSON.parse(errText);
        razorpayError = errJson.error?.description || errJson.error?.reason || razorpayError;
      } catch {}
      return res.status(500).json({
        error: razorpayError,
        razorpay_status: rzpRes.status
      });
    }

    const rzpOrder = await rzpRes.json();
    console.log("[Payment API] Razorpay order created:", rzpOrder.id);

    return res.status(200).json({
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      payment_id: `pay_${Date.now()}`,
      key_id: KEY_ID,
      base_amount: baseAmount,
      gst_amount: gstAmount,
      total: totalAmount
    });
  } catch (err) {
    console.error("[Payment API] Network error:", err.message || err);
    return res.status(500).json({ error: "Network error reaching Razorpay. Please try again." });
  }
}
