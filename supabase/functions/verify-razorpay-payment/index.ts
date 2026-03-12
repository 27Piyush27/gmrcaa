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

/** HMAC-SHA256 using the Web Crypto API (Deno native, no node:crypto) */
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth ─────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    // User-scoped client (for reads constrained by RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Service-role client (bypasses RLS — only for trusted writes)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use getUser() — getClaims() is deprecated
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    // ── Parse & validate body ─────────────────────────────────────────────
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !payment_id) {
      return json({ error: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id" }, 400);
    }

    // ── Validate Razorpay secret ──────────────────────────────────────────
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      return json({ error: "Payment gateway not configured" }, 500);
    }

    // ── Verify we own this payment record ─────────────────────────────────
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .select("id, user_id, service_request_id, status, razorpay_order_id")
      .eq("id", payment_id)
      .single();

    if (payErr || !payment) {
      return json({ error: "Payment record not found" }, 404);
    }
    if (payment.user_id !== user.id) {
      return json({ error: "Forbidden" }, 403);
    }
    if (payment.status === "completed") {
      // Idempotent: already verified
      return json({ success: true, message: "Payment already verified." });
    }
    if (payment.razorpay_order_id !== razorpay_order_id) {
      return json({ error: "Order ID mismatch" }, 400);
    }

    // ── HMAC-SHA256 signature verification ───────────────────────────────
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = await hmacSha256Hex(razorpayKeySecret, body);

    if (expectedSignature !== razorpay_signature) {
      console.error("Signature verification failed for order:", razorpay_order_id);

      // Mark payment as failed
      await supabaseAdmin.from("payments").update({
        status: "failed",
        razorpay_payment_id,
        razorpay_signature,
      }).eq("id", payment_id);

      return json({ success: false, error: "Payment signature verification failed." }, 400);
    }

    // ── Update payment as completed ───────────────────────────────────────
    const { data: updatedPayment, error: updateErr } = await supabaseAdmin
      .from("payments")
      .update({
        status: "completed",
        razorpay_payment_id,
        razorpay_signature,
        payment_method: "razorpay",
      })
      .eq("id", payment_id)
      .select()
      .single();

    if (updateErr) {
      console.error("Failed to update payment:", updateErr);
      return json({ error: "Failed to update payment record." }, 500);
    }

    // ── Mark service request as paid (atomic — uses service role) ────────
    if (updatedPayment.service_request_id) {
      const { error: srErr } = await supabaseAdmin
        .from("service_requests")
        .update({ status: "paid", progress: 100 })
        .eq("id", updatedPayment.service_request_id)
        .eq("status", "completed"); // guard: only complete→paid transition

      if (srErr) {
        console.error("Failed to mark service request paid:", srErr);
        // Don't fail the whole response — payment did succeed
      } else {
        console.log("Service request marked paid:", updatedPayment.service_request_id);
        // The DB trigger will insert a notification for the client automatically
      }
    }

    console.log("Payment verified successfully:", payment_id);

    return json({
      success: true,
      message: "Payment verified successfully.",
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        total_amount: updatedPayment.total_amount,
        razorpay_payment_id: updatedPayment.razorpay_payment_id,
      },
    });

  } catch (err) {
    console.error("verify-razorpay-payment error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
