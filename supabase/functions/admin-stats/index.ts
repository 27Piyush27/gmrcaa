/**
 * admin-stats — Aggregated dashboard statistics endpoint
 * Access: admin and ca roles only
 * Method: GET
 * Returns: JSON with KPIs for the admin dashboard
 */

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
    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

    try {
        // ── Auth ─────────────────────────────────────────────────────────────
        const authHeader = req.headers.get("Authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

        // Service role to bypass RLS for aggregate reads
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Verify identity and role via user JWT
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr || !user) return json({ error: "Unauthorized" }, 401);

        // Role gate: admin or ca only
        const { data: roleRow } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .in("role", ["admin", "ca"])
            .maybeSingle();

        if (!roleRow) return json({ error: "Forbidden: admin or CA access required" }, 403);

        // ── Fetch stats in parallel ───────────────────────────────────────────
        const [
            { count: totalClients },
            { count: totalRequests },
            { count: pendingRequests },
            { count: inProgressRequests },
            { count: completedRequests },
            { count: paidRequests },
            { count: cancelledRequests },
            { count: openInquiries },
            { data: revenueData },
            { data: monthlyData },
            { data: topServices },
        ] = await Promise.all([
            supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "client"),
            supabaseAdmin.from("service_requests").select("*", { count: "exact", head: true }),
            supabaseAdmin.from("service_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
            supabaseAdmin.from("service_requests").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
            supabaseAdmin.from("service_requests").select("*", { count: "exact", head: true }).eq("status", "completed"),
            supabaseAdmin.from("service_requests").select("*", { count: "exact", head: true }).eq("status", "paid"),
            supabaseAdmin.from("service_requests").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
            supabaseAdmin.from("contact_inquiries").select("*", { count: "exact", head: true }).eq("status", "open"),
            supabaseAdmin.from("payments").select("total_amount").eq("status", "completed"),
            // Last 6 months breakdown
            supabaseAdmin.from("payments")
                .select("total_amount, created_at")
                .eq("status", "completed")
                .gte("created_at", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),
            // Top services by request count
            supabaseAdmin.from("service_requests")
                .select("service_id, services(name)")
                .neq("status", "cancelled"),
        ]);

        // Compute total revenue
        const totalRevenue = (revenueData ?? []).reduce(
            (acc, p) => acc + Number(p.total_amount ?? 0), 0
        );

        // Compute monthly buckets (last 6 months)
        const monthlyBuckets: Record<string, number> = {};
        for (const p of monthlyData ?? []) {
            const month = new Date(p.created_at).toLocaleString("en-IN", {
                month: "short", year: "numeric", timeZone: "Asia/Kolkata",
            });
            monthlyBuckets[month] = (monthlyBuckets[month] ?? 0) + Number(p.total_amount ?? 0);
        }
        const monthlyRevenue = Object.entries(monthlyBuckets)
            .map(([month, amount]) => ({ month, amount: Math.round(amount) }))
            .sort((a, b) => new Date(`01 ${a.month}`).getTime() - new Date(`01 ${b.month}`).getTime());

        // Count requests per service
        const serviceCounts: Record<string, { name: string; count: number }> = {};
        for (const sr of topServices ?? []) {
            const id = sr.service_id as string;
            const name = (sr.services as { name: string } | null)?.name ?? id;
            if (!serviceCounts[id]) serviceCounts[id] = { name, count: 0 };
            serviceCounts[id].count++;
        }
        const serviceBreakdown = Object.values(serviceCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        // Revenue this month
        const monthStart = new Date();
        monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
        const revenueThisMonth = (monthlyData ?? [])
            .filter((p) => new Date(p.created_at) >= monthStart)
            .reduce((acc, p) => acc + Number(p.total_amount ?? 0), 0);

        return json({
            overview: {
                total_clients: totalClients ?? 0,
                total_requests: totalRequests ?? 0,
                open_inquiries: openInquiries ?? 0,
                total_revenue: Math.round(totalRevenue),
                revenue_this_month: Math.round(revenueThisMonth),
            },
            status_breakdown: {
                pending: pendingRequests ?? 0,
                in_progress: inProgressRequests ?? 0,
                completed: completedRequests ?? 0,
                paid: paidRequests ?? 0,
                cancelled: cancelledRequests ?? 0,
            },
            monthly_revenue: monthlyRevenue,
            service_breakdown: serviceBreakdown,
            generated_at: new Date().toISOString(),
        });

    } catch (err) {
        console.error("admin-stats error:", err);
        return json({ error: "Internal server error" }, 500);
    }
});
