/**
 * send-status-email — Supabase Edge Function
 * Called when a CA/Admin updates a service request status.
 * Sends an email to the client using Resend (or falls back to console log if key not set).
 *
 * Expected POST body:
 * {
 *   clientEmail: string,
 *   clientName: string,
 *   serviceName: string,
 *   newStatus: "pending" | "in_progress" | "completed" | "paid" | "cancelled",
 *   notes?: string,
 *   amount?: number
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  in_progress: "In Progress",
  completed: "Completed — Payment Due",
  paid: "Paid & Closed",
  cancelled: "Cancelled",
};

const STATUS_EMOJI: Record<string, string> = {
  pending: "⏳",
  in_progress: "🔄",
  completed: "✅",
  paid: "💳",
  cancelled: "❌",
};

function buildEmailHtml(params: {
  clientName: string;
  serviceName: string;
  newStatus: string;
  notes?: string;
  amount?: number;
}): string {
  const label = STATUS_LABELS[params.newStatus] ?? params.newStatus;
  const emoji = STATUS_EMOJI[params.newStatus] ?? "📋";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 24px; }
    .card { background: #fff; border-radius: 12px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #0a0a0a; padding: 28px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 13px; }
    .body { padding: 28px 32px; }
    .status-badge { display: inline-block; padding: 6px 14px; border-radius: 99px; background: #f0fdf4; color: #16a34a; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .label { color: #888; }
    .value { font-weight: 500; color: #111; }
    .notes { background: #f9f9f9; border-radius: 8px; padding: 14px; font-size: 13px; color: #555; margin-top: 16px; }
    .cta { display: block; text-align: center; margin-top: 24px; padding: 12px; background: #0a0a0a; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .footer { padding: 16px 32px; background: #fafafa; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>GMR &amp; Associates</h1>
      <p>Chartered Accountants · Service Update</p>
    </div>
    <div class="body">
      <p style="color:#555;font-size:15px;margin-top:0">Hi <strong>${params.clientName}</strong>,</p>
      <p style="color:#555;font-size:14px">Your service request has been updated.</p>

      <div class="status-badge">${emoji} Status: ${label}</div>

      <div>
        <div class="row"><span class="label">Service</span><span class="value">${params.serviceName}</span></div>
        ${params.amount ? `<div class="row"><span class="label">Amount</span><span class="value">₹${params.amount.toLocaleString("en-IN")}</span></div>` : ""}
        <div class="row"><span class="label">Updated</span><span class="value">${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></div>
      </div>

      ${params.notes ? `<div class="notes"><strong>Note from CA:</strong> ${params.notes}</div>` : ""}

      ${params.newStatus === "completed" ? `<p style="color:#16a34a;font-size:13px;margin-top:16px">✅ Your service is complete! Please log in to make the payment.</p>` : ""}

      <a href="https://gmrassociates.com/dashboard" class="cta">View Your Dashboard →</a>
    </div>
    <div class="footer">GMR &amp; Associates · Chartered Accountants · Mumbai, India<br/>support@gmrassociates.com</div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const { clientEmail, clientName, serviceName, newStatus, notes, amount } = body;

    if (!clientEmail || !clientName || !serviceName || !newStatus) {
      return json({ error: "clientEmail, clientName, serviceName, newStatus are required" }, 400);
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const subject = `Service Update: ${STATUS_LABELS[newStatus] ?? newStatus} — ${serviceName}`;
    const html = buildEmailHtml({ clientName, serviceName, newStatus, notes, amount });

    if (!RESEND_API_KEY) {
      // Fallback: log to console (for development / when Resend key not set)
      console.log(`[EMAIL NOT SENT - No RESEND_API_KEY]\nTo: ${clientEmail}\nSubject: ${subject}`);
      return json({ success: true, sent: false, reason: "RESEND_API_KEY not configured" });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GMR & Associates <noreply@gmrassociates.com>",
        to: [clientEmail],
        subject,
        html,
      }),
    });

    const resData = await res.json();

    if (!res.ok) {
      console.error("Resend error:", resData);
      return json({ success: false, error: resData }, 500);
    }

    return json({ success: true, sent: true, id: resData.id });
  } catch (err) {
    console.error("send-status-email error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
