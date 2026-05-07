import { createClient } from "@supabase/supabase-js";

// ── HTML sanitization to prevent XSS in email templates ──────────────
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(req, res) {
  // CORS — restrict to known origins only (matches payment API security)
  const origin = req.headers?.origin || "";
  const allowedOrigins = [
    "https://chartered-insight-hub-32-3d4b2fdf-main.vercel.app",
    "http://localhost:8080",
    "http://localhost:5173",
  ];
  const isAllowed = allowedOrigins.includes(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin);
  res.setHeader("Access-Control-Allow-Origin", isAllowed ? origin : allowedOrigins[0]);
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "name, email, subject, and message are required" });
  }

  // ── 1. Save to Supabase ──────────────────────────────────────────────
  let saved = false;
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error: dbError } = await supabase
        .from("contact_inquiries")
        .insert({ name, email, subject, message, status: "new" });

      if (dbError) {
        console.error("[Contact API] DB insert error:", dbError);
      } else {
        saved = true;
      }
    } else {
      console.warn("[Contact API] Supabase credentials not configured, skipping DB save");
    }
  } catch (dbErr) {
    console.error("[Contact API] DB error:", dbErr);
  }

  // ── 2. Send emails via Resend ────────────────────────────────────────
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error("[Contact API] RESEND_API_KEY not set in environment variables");
    return res.status(200).json({
      success: true,
      saved,
      emailSent: false,
      confirmationSent: false,
      reason: "RESEND_API_KEY not configured — add it to Vercel environment variables",
    });
  }

  let emailSent = false;
  let confirmationSent = false;

  try {
    // Send notification to GMR team
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
        html: buildTeamNotificationHtml({ name, email, subject, message }),
      }),
    });

    const teamData = await teamRes.json();
    if (teamRes.ok) {
      emailSent = true;
      console.log("[Contact API] Team notification sent:", teamData.id);
    } else {
      console.error("[Contact API] Resend team email error:", teamData);
    }
  } catch (err) {
    console.error("[Contact API] Team email network error:", err);
  }

  try {
    // Send confirmation to the visitor
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
        html: buildConfirmationHtml(name),
      }),
    });

    const confirmData = await confirmRes.json();
    if (confirmRes.ok) {
      confirmationSent = true;
      console.log("[Contact API] Confirmation email sent:", confirmData.id);
    } else {
      console.error("[Contact API] Resend confirmation error:", confirmData);
    }
  } catch (err) {
    console.error("[Contact API] Confirmation email network error:", err);
  }

  return res.status(200).json({
    success: true,
    saved,
    emailSent,
    confirmationSent,
  });
}

/* ── Email HTML for GMR Team (info@gmrindia.com) ─────────────────────── */
function buildTeamNotificationHtml({ name, email, subject, message }) {
  // Sanitize all user-supplied values before inserting into HTML
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);
  const now = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 24px; }
    .card { background: #fff; border-radius: 12px; max-width: 560px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #0a0a0a; padding: 24px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 18px; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 12px; }
    .body { padding: 24px 32px; }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 99px; background: #eff6ff; color: #2563eb; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
    .row { padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .label { color: #888; display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .value { font-weight: 500; color: #111; }
    .message-box { background: #f9f9f9; border-radius: 8px; padding: 16px; font-size: 14px; color: #333; margin-top: 16px; line-height: 1.6; white-space: pre-wrap; }
    .cta { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #0a0a0a; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px; }
    .footer { padding: 16px 32px; background: #fafafa; text-align: center; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>📬 New Contact Form Inquiry</h1>
      <p>GMR & Associates — Website Contact Form</p>
    </div>
    <div class="body">
      <div class="badge">New Inquiry</div>
      <div class="row">
        <span class="label">Name</span>
        <span class="value">${safeName}</span>
      </div>
      <div class="row">
        <span class="label">Email</span>
        <span class="value"><a href="mailto:${safeEmail}" style="color:#2563eb;text-decoration:none">${safeEmail}</a></span>
      </div>
      <div class="row">
        <span class="label">Subject</span>
        <span class="value">${safeSubject}</span>
      </div>
      <div class="message-box">
        <span class="label" style="margin-bottom:8px">Message</span>
        ${safeMessage}
      </div>
      <a href="mailto:${safeEmail}?subject=Re: ${encodeURIComponent(subject)}" class="cta">Reply to ${safeName} →</a>
    </div>
    <div class="footer">
      Received on ${now}
    </div>
  </div>
</body>
</html>`;
}

/* ── Confirmation email for the visitor ──────────────────────────────── */
function buildConfirmationHtml(name) {
  const safeName = escapeHtml(name);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 24px; }
    .card { background: #fff; border-radius: 12px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #0a0a0a; padding: 24px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 18px; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 12px; }
    .body { padding: 28px 32px; font-size: 14px; color: #555; line-height: 1.7; }
    .body h2 { color: #111; font-size: 16px; margin: 0 0 12px; }
    .cta { display: block; text-align: center; margin-top: 20px; padding: 12px; background: #0a0a0a; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .footer { padding: 16px 32px; background: #fafafa; text-align: center; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>GMR & Associates</h1>
      <p>Chartered Accountants</p>
    </div>
    <div class="body">
      <h2>Thank you, ${safeName}!</h2>
      <p>We've received your message and our team will get back to you within <strong>24 hours</strong>.</p>
      <p>If your inquiry is urgent, feel free to call us directly:</p>
      <p style="color:#111;font-weight:500">📞 +91 98712 09393 (Gurgaon)<br/>📞 +91 98710 84875 (Delhi)</p>
      <a href="https://gmrassociates.com" class="cta">Visit Our Website →</a>
    </div>
    <div class="footer">
      GMR & Associates · Chartered Accountants<br/>
      H.No.43, SF, Sector-7, Gurugram | AB 38, Shalimar Bagh, Delhi<br/>
      info@gmrindia.com
    </div>
  </div>
</body>
</html>`;
}
