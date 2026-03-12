import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth ─────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service role client for trusted DB writes
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      console.error("Auth error:", userErr);
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = user.id;

    // ── Parse body ───────────────────────────────────────────────────────
    const body = await req.json();
    const {
      service_request_id,
      amount: directAmount,
      currency = "INR",
      description = "Service Payment",
    } = body;

    // ── Validate Razorpay credentials ─────────────────────────────────────
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Razorpay credentials not configured");
      return json({ error: "Payment gateway not configured. Please contact support." }, 500);
    }

    let baseAmount: number;
    let gstAmount: number;
    let totalAmount: number;
    let relatedServiceRequestId: string | null = null;

    // ── Mode A: Service-linked payment (service_request_id provided) ──────
    if (service_request_id) {
      relatedServiceRequestId = service_request_id;

      // Idempotency: return existing pending order
      const idempotencyKey = `${userId}:${service_request_id}:order`;
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id, razorpay_order_id, amount, status")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existingPayment?.status === "pending" && existingPayment.razorpay_order_id) {
        console.log("Returning existing pending order:", existingPayment.razorpay_order_id);
        const existingBase = Number(existingPayment.amount);
        const existingGst = Math.round(existingBase * 0.18 * 100) / 100;
        const existingTotal = Math.round((existingBase + existingGst) * 100) / 100;
        return json({
          order_id: existingPayment.razorpay_order_id,
          amount: Math.round(existingTotal * 100),
          currency,
          payment_id: existingPayment.id,
          key_id: razorpayKeyId,
          base_amount: existingBase,
          gst_amount: existingGst,
          total: existingTotal,
        });
      }

      // Validate service request
      const { data: sr, error: srErr } = await supabase
        .from("service_requests")
        .select("id, status, amount, user_id")
        .eq("id", service_request_id)
        .single();

      if (srErr || !sr) {
        console.error("Service request error:", srErr);
        return json({ error: "Service request not found." }, 404);
      }
      if (sr.user_id !== userId) return json({ error: "Forbidden" }, 403);

      if (sr.status === "paid") {
        return json({ error: "This service has already been paid for." }, 400);
      }
      if (sr.status === "cancelled") {
        return json({ error: "This service request has been cancelled." }, 400);
      }
      if (sr.status !== "completed") {
        const msgs: Record<string, string> = {
          pending: "Service is still pending. Payment is enabled after completion.",
          in_progress: "Service is still in progress. Payment is enabled after completion.",
        };
        return json({ error: msgs[sr.status] ?? "Service is not ready for payment." }, 400);
      }
      if (!sr.amount || Number(sr.amount) <= 0) {
        return json({ error: "Final amount has not been set by the CA yet." }, 400);
      }

      baseAmount = Number(sr.amount);
      gstAmount = Math.round(baseAmount * 0.18 * 100) / 100;
      totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100;
    }
    // ── Mode B: Standalone payment (direct amount, e.g. package plans) ───
    else if (directAmount && Number(directAmount) > 0) {
      baseAmount = Number(directAmount);
      gstAmount = Math.round(baseAmount * 0.18 * 100) / 100;
      totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100;
      relatedServiceRequestId = null;
    } else {
      return json({ error: "Provide either service_request_id or a positive amount." }, 400);
    }

    const amountPaise = Math.round(totalAmount * 100);

    // ── Create Razorpay order ──────────────────────────────────────────────
    const receipt = `rcpt_${Date.now()}`;
    const rzpPayload = {
      amount: amountPaise,
      currency,
      receipt,
      notes: {
        user_id: userId,
        service_request_id: relatedServiceRequestId ?? "standalone",
        description,
      },
    };

    console.log("Creating Razorpay order:", { amountPaise, currency, receipt });

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
      body: JSON.stringify(rzpPayload),
    });

    if (!rzpRes.ok) {
      const errText = await rzpRes.text();
      console.error("Razorpay order creation failed:", rzpRes.status, errText);
      return json({ error: "Failed to create payment order. Please try again." }, 500);
    }

    const rzpOrder = await rzpRes.json();
    console.log("Razorpay order created:", rzpOrder.id);

    // ── Persist payment record using admin client ─────────────────────────
    const idempotencyKey = service_request_id
      ? `${userId}:${service_request_id}:order`
      : `${userId}:standalone:${receipt}`;

    const { data: payment, error: dbErr } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        service_request_id: relatedServiceRequestId,
        amount: baseAmount,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        currency,
        razorpay_order_id: rzpOrder.id,
        status: "pending",
        description,
        idempotency_key: idempotencyKey,
        metadata: { razorpay_receipt: receipt },
      })
      .select("id")
      .single();

    if (dbErr) {
      console.error("DB insert error:", dbErr);
      return json({ error: "Failed to record payment. Please contact support." }, 500);
    }

    console.log("Payment record created:", payment.id);

    return json({
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,   // paise
      currency: rzpOrder.currency,
      payment_id: payment.id,
      key_id: razorpayKeyId,
      base_amount: baseAmount,
      gst_amount: gstAmount,
      total: totalAmount,
    });

  } catch (err) {
    console.error("create-razorpay-order unhandled error:", err);
    return json({ error: "Internal server error. Please try again." }, 500);
  }
});
