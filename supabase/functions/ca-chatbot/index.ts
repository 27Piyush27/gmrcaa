import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI assistant for GMR & Associates, a professional Chartered Accountant (CA) firm in India. Your role is to help clients choose the right CA service and answer basic CA-related queries.

## Services Offered (use these EXACT service IDs for links):
1. **Accounting & Bookkeeping** (ID: accounting) - Precision bookkeeping, financial statements, system design compliant with IAS/USGAAP/IND AS
2. **Auditing & Assurance** (ID: auditing) - Statutory, internal, and tax audits for financial accuracy and governance
3. **Tax Advisory & Compliance** (ID: tax) - Income Tax filing (ITR-1 to ITR-7), GST registration & returns, TDS compliance, tax planning
4. **Company Law & Secretarial** (ID: company-law) - Company incorporation (Pvt Ltd, LLP, OPC), ROC filings, annual compliance
5. **Payroll Management** (ID: payroll) - Salary processing, PF/ESI compliance, TDS, pay slips
6. **Finance & Project Advisory** (ID: finance-advisory) - Project financing, business valuation, due diligence, financial modeling

## Guided Questions Flow:
- First ask: "Are you a salaried individual, self-employed professional, or a business owner?"
- Based on answer, narrow down relevant services
- For businesses: Ask about GST, compliance, audit needs
- For individuals: Ask about ITR type, TDS, investments
- For new businesses: Ask about incorporation type (Pvt Ltd, LLP, OPC)

## Key FAQs:
- ITR filing deadline: July 31 (individuals), October 31 (audit cases)
- GST return frequency: Monthly (GSTR-3B), Quarterly (QRMP scheme)
- Company annual compliance: AGM within 6 months of FY end
- TDS return deadlines: Quarterly (Jul 31, Oct 31, Jan 31, May 31)

## Important Rules:
1. NEVER provide specific legal advice or tax computation guarantees
2. Always recommend consulting our CA team for complex matters
3. When a user selects a service, provide the service ID so they can be redirected. Use this format: [SERVICE:service-id]. ONLY use these exact IDs: accounting, auditing, tax, company-law, payroll, finance-advisory
4. For complex queries, suggest contacting our team: Phone: provided on contact page, or WhatsApp
5. Keep responses concise, professional, and helpful
6. Use ₹ for Indian Rupee amounts
7. When listing documents needed, be specific to the service
8. If a user seems to need multiple services, suggest a consultation package

## Escalation Triggers:
- Legal disputes or notices from tax authorities
- Complex restructuring or merger queries
- International taxation questions
- Queries about past non-compliance or penalties
For these, say: "This is a specialized matter. I recommend speaking directly with our CA team for personalized guidance. You can reach us through our contact page or WhatsApp."`;

/** Convert OpenAI-style messages to Gemini format */
function toGeminiContents(messages: { role: string; content: string }[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

function toOpenAIChunk(content: string, model = "gemini-2.0-flash") {
  return {
    id: `chatcmpl-fallback-${Date.now()}`,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, delta: { content }, finish_reason: null }],
  };
}

function sseTextResponse(content: string, status = 200) {
  const payload = `data: ${JSON.stringify(toOpenAIChunk(content))}\n\ndata: [DONE]\n\n`;
  return new Response(payload, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function fallbackReplyFor(userText: string) {
  const q = userText.toLowerCase();

  if (q.includes("new company") || q.includes("start company") || q.includes("incorporat") || q.includes("llp") || q.includes("opc")) {
    return `Great choice. For starting a new business, we can help with incorporation and compliance.\n\nFor quick guidance, please share your preferred entity type: Pvt Ltd, LLP, or OPC.\n\nRecommended services:\n- Company Law & Secretarial [SERVICE:company-law]\n- Tax Advisory & Compliance [SERVICE:tax]\n\nCommon documents: PAN, Aadhaar, address proof of directors/partners, registered office proof, and business activity details.`;
  }

  if (q.includes("itr") || q.includes("income tax") || q.includes("tds") || q.includes("gst")) {
    return `I can help you with tax and GST compliance.\n\nRecommended service:\n- Tax Advisory & Compliance [SERVICE:tax]\n\nTell me whether you are salaried, self-employed, or running a business, and I’ll list exact documents and next steps.`;
  }

  return `I’m temporarily handling high traffic, but I can still help.\n\nPlease tell me whether you are a salaried individual, self-employed professional, or business owner, and I’ll suggest the best CA service.\n\nPopular options:\n- Tax Advisory & Compliance [SERVICE:tax]\n- Company Law & Secretarial [SERVICE:company-law]\n- Payroll Management [SERVICE:payroll]`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    // Optionally save messages if user is authenticated
    const authHeader = req.headers.get("authorization");
    if (authHeader && conversationId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "user") {
        await supabase.from("chat_messages").insert({
          conversation_id: conversationId,
          role: "user",
          content: lastMsg.content,
        });
      }
    }

    // Call the Gemini streaming API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: toGeminiContents(messages),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errText);

      if (geminiResponse.status === 429) {
        const lastUserMessage =
          [...messages].reverse().find((m: { role: string; content: string }) => m.role === "user")?.content ?? "";
        return sseTextResponse(fallbackReplyFor(lastUserMessage), 200);
      }
      return sseTextResponse(
        "I’m facing a temporary AI service issue right now. Please share your requirement, and I’ll guide you with the right service options."
      );
    }

    // Transform Gemini SSE stream → OpenAI-compatible SSE stream
    // so the existing AIChatbot.tsx frontend works without modification.
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    (async () => {
      const reader = geminiResponse.body!.getReader();
      let buffer = "";
      let chunkIndex = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                // Emit OpenAI-compatible SSE chunk
                const chunk = {
                  id: `chatcmpl-${chunkIndex++}`,
                  object: "chat.completion.chunk",
                  created: Math.floor(Date.now() / 1000),
                  model: "gemini-2.0-flash",
                  choices: [
                    {
                      index: 0,
                      delta: { content: text },
                      finish_reason: null,
                    },
                  ],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }

              // Check if this is the final chunk
              const finishReason = parsed?.candidates?.[0]?.finishReason;
              if (finishReason && finishReason !== "STOP") {
                // Send final done marker
                const doneChunk = {
                  id: `chatcmpl-${chunkIndex++}`,
                  object: "chat.completion.chunk",
                  created: Math.floor(Date.now() / 1000),
                  model: "gemini-2.0-flash",
                  choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(doneChunk)}\n\n`));
              }
            } catch {
              // Ignore malformed chunks
            }
          }
        }
      } finally {
        await writer.write(encoder.encode("data: [DONE]\n\n"));
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ca-chatbot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
