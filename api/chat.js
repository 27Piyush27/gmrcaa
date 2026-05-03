export const config = {
  runtime: 'edge',
};

// ── In-memory rate limiter (per-instance, resets on cold start) ────────────
const RATE_LIMIT_WINDOW_MS = 60_000; // 60 seconds
const RATE_LIMIT_MAX = 20; // max requests per window per IP
const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

// Periodic cleanup to prevent memory leaks (every 100 requests)
let cleanupCounter = 0;
function maybeCleanup() {
  if (++cleanupCounter % 100 !== 0) return;
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) rateLimitMap.delete(ip);
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Rate limit check
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  maybeCleanup();
  if (isRateLimited(clientIP)) {
    return new Response(JSON.stringify({ error: { message: 'Too many requests. Please wait a moment and try again.' } }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  try {
    const body = await req.json();
    const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_KEY) {
      return new Response(JSON.stringify({ error: { message: 'Gemini API key is not configured on the server.' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`;

    const resp = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      return new Response(JSON.stringify(errData), {
        status: resp.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return the stream directly to the client
    return new Response(resp.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: { message: error.message || 'Internal Server Error' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

