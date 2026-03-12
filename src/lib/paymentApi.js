/**
 * Payment API Client
 *
 * In development: routes to local Vite dev server endpoints (/api/...)
 * In production:  routes to Supabase edge functions
 *
 * This allows payment flows to work immediately without Supabase CLI.
 */

import { supabase } from "@/integrations/supabase/client";

const isDev = import.meta.env.DEV;






































// ─── Local API fetcher (dev only) ─────────────────────────────────────────────

async function localFetch(endpoint, body) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      const err = data.error || `HTTP ${res.status}`;
      return { data: null, error: new Error(err) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function createRazorpayOrder(
req)
{
  if (isDev) {
    return localFetch("/api/create-razorpay-order", req);
  }

  // Production: use Supabase edge function
  const { data, error } = await supabase.functions.invoke("create-razorpay-order", { body: req });
  if (error) {
    const msg =
    error?.context?.json?.error ||
    error.message ||
    "Failed to create payment order";
    return { data: null, error: new Error(msg) };
  }
  if (data?.error) return { data: null, error: new Error(data.error) };
  return { data: data, error: null };
}

export async function verifyRazorpayPayment(
req)
{
  if (isDev) {
    return localFetch("/api/verify-razorpay-payment", req);
  }

  // Production: use Supabase edge function
  const { data, error } = await supabase.functions.invoke("verify-razorpay-payment", { body: req });
  if (error) {
    const msg =
    error?.context?.json?.error ||
    error.message ||
    "Payment verification failed";
    return { data: null, error: new Error(msg) };
  }
  if (data?.error) return { data: null, error: new Error(data.error) };
  return { data: data, error: null };
}