/**
 * send-contact-email — Supabase Edge Function
 * Called when a visitor submits the Contact Us form.
 * 1. Inserts the inquiry into `contact_inquiries` table.
 * 2. Sends an email notification to info@gmrindia.com via Resend.
 * 3. Sends a confirmation email to the visitor.
 *
 * Expected POST body:
 * {
 *   name: string,
 *   email: string,
 *   subject: string,
 *   message: string
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* ── Email HTML for GMR Team (info@gmrindia.com) ─────────────────────── */
function buildTeamNotificationHtml(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  return `
<!DOCTYPE html>
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
        <span class="value">${params.name}</span>
      </div>
      <div class="row">
        <span class="label">Email</span>
        <span class="value"><a href="mailto:${params.email}" style="color:#2563eb;text-decoration:none">${params.email}</a></span>
      </div>
      <div class="row">
        <span class="label">Subject</span>
        <span class="value">${params.subject}</span>
      </div>

      <div class="message-box">
        <span class="label" style="margin-bottom:8px">Message</span>
        ${params.message}
      </div>

      <a href="mailto:${params.email}?subject=Re: ${encodeURIComponent(params.subject)}" class="cta">Reply to ${params.name} →</a>
    </div>
    <div class="footer">
      Received on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
    </div>
  </div>
</body>
</html>`;
}

/* ── Confirmation email for the visitor ──────────────────────────────── */
function buildConfirmationHtml(name: string): string {
  return `
<!DOCTYPE html>
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
      <h2>Thank you, ${name}!</h2>
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

/* ── Main handler ────────────────────────────────────────────────────── */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return json({ error: "name, email, subject, and message are required" }, 400);
    }

    // ── 1. Insert into contact_inquiries ────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase
      .from("contact_inquiries")
      .insert({ name, email, subject, message, status: "new" });

    if (dbError) {
      console.error("DB insert error:", dbError);
      // Don't fail the request — still try to send email
    }

    // ── 2. Send email to GMR team ───────────────────────────────────
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.log(`[EMAIL NOT SENT - No RESEND_API_KEY]\nTo: info@gmrindia.com\nFrom: ${name} <${email}>\nSubject: ${subject}\nMessage: ${message}`);
      return json({ success: true, saved: !dbError, emailSent: false, reason: "RESEND_API_KEY not configured" });
    }

    // Send to GMR team
    const teamEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GMR Website <noreply@gmrassociates.com>",
        to: ["info@gmrindia.com"],
        reply_to: email,
        subject: `[Website Contact] ${subject}`,
        html: buildTeamNotificationHtml({ name, email, subject, message }),
      }),
    });

    const teamEmailData = await teamEmailRes.json();
    if (!teamEmailRes.ok) {
      console.error("Resend team email error:", teamEmailData);
    }

    // ── 3. Send confirmation to visitor ─────────────────────────────
    const confirmRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GMR & Associates <noreply@gmrassociates.com>",
        to: [email],
        subject: "We've received your message — GMR & Associates",
        html: buildConfirmationHtml(name),
      }),
    });

    const confirmData = await confirmRes.json();
    if (!confirmRes.ok) {
      console.error("Resend confirmation email error:", confirmData);
    }

    return json({
      success: true,
      saved: !dbError,
      emailSent: teamEmailRes.ok,
      confirmationSent: confirmRes.ok,
    });
  } catch (err) {
    console.error("send-contact-email error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
