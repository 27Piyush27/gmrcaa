/**
 * Payment API Client
 *
 * In development: routes to local Vite dev server endpoints (/api/...)
 * In production:  routes to Vercel serverless functions (/api/...)
 *
 * Both dev and prod use the same /api/ path convention, so the client
 * code is identical — the routing is handled by the platform.
 */

// ─── API fetcher ──────────────────────────────────────────────────────────────

async function apiFetch(endpoint, body) {
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

export async function createRazorpayOrder(req) {
  return apiFetch("/api/create-razorpay-order", req);
}

export async function verifyRazorpayPayment(req) {
  return apiFetch("/api/verify-razorpay-payment", req);
}