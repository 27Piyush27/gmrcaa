/**
 * send-notification — Internal helper to push in-app notifications
 * Can be called by other edge functions or webhooks.
 * Protected by service-role secret header (X-Internal-Secret).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

const VALID_TYPES = [
    "service_update", "payment_received", "document_uploaded",
    "document_reviewed", "system", "chat", "appointment", "success", "warning", "info"
] as const;

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    try {
        // ── Dual auth: either service-role internal secret OR user JWT ────────
        const internalSecret = req.headers.get("X-Internal-Secret");
        const authHeader = req.headers.get("Authorization") ?? "";

        const expectedSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";
        const isInternal = internalSecret && internalSecret === expectedSecret;
        const isUserJwt = authHeader.startsWith("Bearer ");

        if (!isInternal && !isUserJwt) {
            return json({ error: "Unauthorized" }, 401);
        }

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // If called with a user JWT, verify admin/ca role
        if (!isInternal && isUserJwt) {
            const supabase = createClient(
                Deno.env.get("SUPABASE_URL")!,
                Deno.env.get("SUPABASE_ANON_KEY")!,
                { global: { headers: { Authorization: authHeader } } }
            );
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) return json({ error: "Unauthorized" }, 401);

            const { data: roleRow } = await supabaseAdmin
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id)
                .in("role", ["admin", "ca"])
                .maybeSingle();

            if (!roleRow) return json({ error: "Forbidden" }, 403);
        }

        // ── Parse & validate payload ──────────────────────────────────────────
        const { user_id, type, title, body, data: notifData } = await req.json();

        if (!user_id || typeof user_id !== "string") {
            return json({ error: "user_id is required" }, 400);
        }
        if (!title || !body) {
            return json({ error: "title and body are required" }, 400);
        }
        const notifType = type ?? "system";
        if (!VALID_TYPES.includes(notifType)) {
            return json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` }, 400);
        }

        // Rate limit: max 10 notifications per user per hour (soft guard)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user_id)
            .gte("created_at", oneHourAgo);

        if ((count ?? 0) >= 10) {
            console.warn(`Rate limit hit for user ${user_id}: ${count} notifications in last hour`);
            return json({ error: "Rate limit: too many notifications" }, 429);
        }

        // ── Insert notification ───────────────────────────────────────────────
        const { data: notification, error: insertErr } = await supabaseAdmin
            .from("notifications")
            .insert({
                user_id,
                type: notifType,
                title: String(title).slice(0, 200),
                body: String(body).slice(0, 1000),
                data: notifData ?? {},
            })
            .select("id")
            .single();

        if (insertErr) {
            console.error("Failed to insert notification:", insertErr);
            return json({ error: "Failed to create notification" }, 500);
        }

        return json({ success: true, notification_id: notification.id });

    } catch (err) {
        console.error("send-notification error:", err);
        return json({ error: "Internal server error" }, 500);
    }
});
