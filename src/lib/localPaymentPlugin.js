/**
 * Local Payment API — Vite Dev Plugin
 *
 * This plugin runs a payment server INSIDE the Vite dev server so there's no
 * need for the Supabase CLI or deployed edge functions during local development.
 *
 * Routes handled:
 *   POST /api/create-razorpay-order   → creates a Razorpay order
 *   POST /api/verify-razorpay-payment → verifies payment signature
 *   POST /api/send-contact-email      → sends contact form email via Resend
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

// ─── Route: Send Contact Email via Resend ─────────────────────────────────────

async function handleSendContactEmail(body, res) {
  const env = loadEnv("development", process.cwd(), "");
  const { name, email, subject, message } = body;

  if (!name || !email || !subject || !message) {
    return jsonResponse(res, { error: "name, email, subject, and message are required" }, 400);
  }

  // Try to save to Supabase
  let saved = false;
  try {
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error: dbError } = await supabase
        .from("contact_inquiries")
        .insert({ name, email, subject, message, status: "new" });
      if (dbError) {
        console.error("[Contact API] DB insert error:", dbError);
      } else {
        saved = true;
      }
    }
  } catch (dbErr) {
    console.error("[Contact API] DB error:", dbErr);
  }

  // Send emails via Resend
  const RESEND_API_KEY = env.RESEND_API_KEY || process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.warn("[Contact API] RESEND_API_KEY not set. Add it to your .env file.");
    return jsonResponse(res, {
      success: true,
      saved,
      emailSent: false,
      confirmationSent: false,
      reason: "RESEND_API_KEY not configured",
    });
  }

  let emailSent = false;
  let confirmationSent = false;

  // Send to GMR team
  try {
    const teamRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GMR Website <onboarding@resend.dev>",
        to: ["info@gmrindia.com"],
        reply_to: email,
        subject: `[Website Contact] ${subject}`,
        html: buildContactTeamHtml({ name, email, subject, message }),
      }),
    });
    const teamData = await teamRes.json();
    emailSent = teamRes.ok;
    if (!teamRes.ok) console.error("[Contact API] Resend team email error:", teamData);
    else console.log("[Contact API] Team notification sent:", teamData.id);
  } catch (err) {
    console.error("[Contact API] Team email error:", err);
  }

  // Send confirmation to visitor
  try {
    const confirmRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GMR & Associates <onboarding@resend.dev>",
        to: [email],
        subject: "We've received your message — GMR & Associates",
        html: buildContactConfirmHtml(name),
      }),
    });
    const confirmData = await confirmRes.json();
    confirmationSent = confirmRes.ok;
    if (!confirmRes.ok) console.error("[Contact API] Resend confirm error:", confirmData);
    else console.log("[Contact API] Confirmation sent:", confirmData.id);
  } catch (err) {
    console.error("[Contact API] Confirmation email error:", err);
  }

  return jsonResponse(res, { success: true, saved, emailSent, confirmationSent });
}

/* ── Email HTML builders for contact form ──────────────────────────── */
function buildContactTeamHtml({ name, email, subject, message }) {
  const now = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:24px}.card{background:#fff;border-radius:12px;max-width:560px;margin:0 auto;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}.header{background:#0a0a0a;padding:24px 32px}.header h1{color:#fff;margin:0;font-size:18px;font-weight:600}.header p{color:rgba(255,255,255,.5);margin:4px 0 0;font-size:12px}.body{padding:24px 32px}.badge{display:inline-block;padding:5px 12px;border-radius:99px;background:#eff6ff;color:#2563eb;font-weight:600;font-size:13px;margin-bottom:16px}.row{padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px}.row:last-child{border-bottom:none}.label{color:#888;display:block;font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}.value{font-weight:500;color:#111}.message-box{background:#f9f9f9;border-radius:8px;padding:16px;font-size:14px;color:#333;margin-top:16px;line-height:1.6;white-space:pre-wrap}.cta{display:inline-block;margin-top:20px;padding:10px 20px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:13px}.footer{padding:16px 32px;background:#fafafa;text-align:center;font-size:11px;color:#999}</style></head><body><div class="card"><div class="header"><h1>📬 New Contact Form Inquiry</h1><p>GMR &amp; Associates — Website Contact Form</p></div><div class="body"><div class="badge">New Inquiry</div><div class="row"><span class="label">Name</span><span class="value">${name}</span></div><div class="row"><span class="label">Email</span><span class="value"><a href="mailto:${email}" style="color:#2563eb;text-decoration:none">${email}</a></span></div><div class="row"><span class="label">Subject</span><span class="value">${subject}</span></div><div class="message-box"><span class="label" style="margin-bottom:8px">Message</span>${message}</div><a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" class="cta">Reply to ${name} →</a></div><div class="footer">Received on ${now}</div></div></body></html>`;
}

function buildContactConfirmHtml(name) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:24px}.card{background:#fff;border-radius:12px;max-width:520px;margin:0 auto;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}.header{background:#0a0a0a;padding:24px 32px}.header h1{color:#fff;margin:0;font-size:18px;font-weight:600}.header p{color:rgba(255,255,255,.5);margin:4px 0 0;font-size:12px}.body{padding:28px 32px;font-size:14px;color:#555;line-height:1.7}.body h2{color:#111;font-size:16px;margin:0 0 12px}.cta{display:block;text-align:center;margin-top:20px;padding:12px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px}.footer{padding:16px 32px;background:#fafafa;text-align:center;font-size:11px;color:#999}</style></head><body><div class="card"><div class="header"><h1>GMR &amp; Associates</h1><p>Chartered Accountants</p></div><div class="body"><h2>Thank you, ${name}!</h2><p>We've received your message and our team will get back to you within <strong>24 hours</strong>.</p><p>If your inquiry is urgent, feel free to call us directly:</p><p style="color:#111;font-weight:500">📞 +91 98712 09393 (Gurgaon)<br/>📞 +91 98710 84875 (Delhi)</p><a href="https://gmrassociates.com" class="cta">Visit Our Website →</a></div><div class="footer">GMR &amp; Associates · Chartered Accountants<br/>H.No.43, SF, Sector-7, Gurugram | AB 38, Shalimar Bagh, Delhi<br/>info@gmrindia.com</div></div></body></html>`;
}

// ─── Route: Chat via Gemini ───────────────────────────────────────────────────

async function handleChat(body, res) {
  const env = loadEnv("development", process.cwd(), "");
  const GEMINI_KEY = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!GEMINI_KEY) {
    return jsonResponse(res, { error: { message: "Gemini API key not configured locally." } }, 500);
  }

  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`;

  try {
    const resp = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      return jsonResponse(res, errData, resp.status);
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    const reader = resp.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err) {
    console.error("[Chat API] Error:", err);
    return jsonResponse(res, { error: { message: "Failed to communicate with Gemini API" } }, 500);
  }
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

        // ── POST /api/send-contact-email ─────────────────────────────────
        if (req.url === "/api/send-contact-email" && req.method === "POST") {
          const body = await readBody(req);
          return handleSendContactEmail(body, res);
        }

        // ── POST /api/chat ───────────────────────────────────────────────
        if (req.url === "/api/chat" && req.method === "POST") {
          const body = await readBody(req);
          return handleChat(body, res);
        }

        next();
      });
    }
  };
}