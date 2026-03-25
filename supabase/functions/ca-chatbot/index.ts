import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── System prompt (bilingual, with tax-calc + booking instructions) ──
const SYSTEM_PROMPT_EN = `You are an AI assistant for GMR & Associates, a professional Chartered Accountant (CA) firm in India. Your role is to help clients choose the right CA service and answer basic CA-related queries.

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

## Tax Calculator Feature:
When a user asks to calculate their tax, asks "what is my tax", or provides income details:
- Ask them for: gross annual income, 80C deductions, 80D deductions, and HRA exemption
- Calculate using these slabs for FY 2025-26:

**Old Regime:** 0-2.5L: 0%, 2.5-5L: 5%, 5-10L: 20%, 10L+: 30%
**New Regime:** 0-4L: 0%, 4-8L: 5%, 8-12L: 10%, 12-16L: 15%, 16-20L: 20%, 20-24L: 25%, 24L+: 30%

- Old regime taxable income = gross income - 80C (max 1.5L) - 80D (max 75K) - HRA
- New regime taxable income = gross income (no deductions)
- Apply 87A rebate: Old regime: if taxable <= 5L, tax = 0; New regime: if taxable <= 12L, tax = 0
- Add 4% cess on final tax
- Show BOTH regime results, highlight which saves more, use ₹ symbol

## Appointment Booking Feature:
When a user wants to book an appointment, schedule a meeting, or consult a CA:
- Confirm what they want help with
- Then include the EXACT text [SHOW_BOOKING_FORM] in your response (the frontend will render an inline booking widget)
- Say: "I've opened the booking form below. Select your preferred date and time."

## Document Analysis Feature:
When a user uploads an image/document (Form 16, PAN card, invoice, receipt, balance sheet, etc.):
- Analyze the document carefully
- Extract key financial information (income, TDS, taxes paid, invoice amounts, etc.)
- Suggest the most relevant GMR service based on the document
- Recommend next steps
- If it's a Form 16, extract: gross income, TDS deducted, and calculate estimated tax liability

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

const SYSTEM_PROMPT_HI = `आप GMR & Associates के AI सहायक हैं, जो भारत में एक पेशेवर चार्टर्ड अकाउंटेंट (CA) फर्म है। आपकी भूमिका ग्राहकों को सही CA सेवा चुनने और बुनियादी CA-संबंधित प्रश्नों का उत्तर देने में मदद करना है।

**कृपया हिंदी में उत्तर दें।**

## प्रदान की जाने वाली सेवाएँ (लिंक के लिए इन EXACT सेवा IDs का उपयोग करें):
1. **लेखा और बहीखाता** (ID: accounting)
2. **ऑडिटिंग और आश्वासन** (ID: auditing)
3. **कर सलाह और अनुपालन** (ID: tax) - आयकर फाइलिंग, GST पंजीकरण, TDS अनुपालन
4. **कंपनी कानून और सचिवीय** (ID: company-law) - कंपनी निगमन, ROC फाइलिंग
5. **पेरोल प्रबंधन** (ID: payroll) - वेतन प्रसंस्करण, PF/ESI अनुपालन
6. **वित्त और परियोजना सलाह** (ID: finance-advisory)

## कर कैलकुलेटर:
जब उपयोगकर्ता टैक्स कैलकुलेशन माँगे, तो उनसे पूछें: सकल वार्षिक आय, 80C कटौती, 80D कटौती, और HRA छूट।
दोनों व्यवस्थाओं (पुरानी और नई) के तहत गणना करें और सबसे अच्छा विकल्प बताएं।

## अपॉइंटमेंट बुकिंग:
जब उपयोगकर्ता अपॉइंटमेंट बुक करना चाहे, तो उनकी ज़रूरत पुष्ट करें और [SHOW_BOOKING_FORM] शामिल करें।

## दस्तावेज़ विश्लेषण:
जब उपयोगकर्ता कोई इमेज/दस्तावेज़ अपलोड करे, उसका विश्लेषण करें और उचित सेवा सुझाएं।

## नियम:
1. कभी भी विशिष्ट कानूनी सलाह न दें
2. जटिल मामलों के लिए हमारी CA टीम से सलाह लें
3. सेवा लिंक: [SERVICE:service-id] प्रारूप में दें
4. ₹ चिह्न का उपयोग करें
5. उत्तर संक्षिप्त, पेशेवर और सहायक रखें`;

/** Convert messages to Gemini format, supporting multimodal (image) */
function toGeminiContents(
  messages: { role: string; content: string; image?: { base64: string; mimeType: string } }[]
) {
  return messages.map((m) => {
    const parts: any[] = [{ text: m.content }];
    if (m.image?.base64) {
      parts.push({
        inline_data: {
          mime_type: m.image.mimeType,
          data: m.image.base64,
        },
      });
    }
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts,
    };
  });
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

function fallbackReplyFor(userText: string, lang: string) {
  const q = userText.toLowerCase();
  const isHi = lang === "hi";

  if (q.includes("new company") || q.includes("start company") || q.includes("incorporat") || q.includes("llp") || q.includes("opc") ||
      q.includes("नई कंपनी") || q.includes("कंपनी शुरू")) {
    return isHi
      ? `बढ़िया विकल्प! नया व्यवसाय शुरू करने के लिए हम निगमन और अनुपालन में मदद कर सकते हैं।\n\nसुझाई सेवाएँ:\n- कंपनी कानून [SERVICE:company-law]\n- कर सलाह [SERVICE:tax]`
      : `Great choice. For starting a new business, we can help with incorporation and compliance.\n\nRecommended services:\n- Company Law & Secretarial [SERVICE:company-law]\n- Tax Advisory & Compliance [SERVICE:tax]`;
  }

  if (q.includes("itr") || q.includes("income tax") || q.includes("tds") || q.includes("gst") ||
      q.includes("आयकर") || q.includes("टैक्स") || q.includes("जीएसटी")) {
    return isHi
      ? `मैं कर और GST अनुपालन में मदद कर सकता हूँ।\n\nसुझाई सेवा:\n- कर सलाह [SERVICE:tax]`
      : `I can help you with tax and GST compliance.\n\nRecommended service:\n- Tax Advisory & Compliance [SERVICE:tax]`;
  }

  return isHi
    ? `मैं अभी उच्च ट्रैफ़िक पर हूँ, लेकिन मदद कर सकता हूँ।\n\nलोकप्रिय सेवाएँ:\n- कर सलाह [SERVICE:tax]\n- कंपनी कानून [SERVICE:company-law]\n- पेरोल [SERVICE:payroll]`
    : `I'm temporarily handling high traffic, but I can still help.\n\nPopular options:\n- Tax Advisory & Compliance [SERVICE:tax]\n- Company Law & Secretarial [SERVICE:company-law]\n- Payroll Management [SERVICE:payroll]`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, lang = "en" } = await req.json();
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

    // Select system prompt based on language
    const systemPrompt = lang === "hi" ? SYSTEM_PROMPT_HI : SYSTEM_PROMPT_EN;

    // Check if any message has an image (multimodal)
    const hasImage = messages.some((m: any) => m.image?.base64);

    // Call the Gemini streaming API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: toGeminiContents(messages),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: hasImage ? 2048 : 1024,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errText);

      if (geminiResponse.status === 429) {
        const lastUserMessage =
          [...messages].reverse().find((m: { role: string; content: string }) => m.role === "user")?.content ?? "";
        return sseTextResponse(fallbackReplyFor(lastUserMessage, lang), 200);
      }
      return sseTextResponse(
        lang === "hi"
          ? "मुझे एक अस्थायी AI सेवा समस्या हो रही है। कृपया अपनी आवश्यकता साझा करें।"
          : "I'm facing a temporary AI service issue right now. Please share your requirement, and I'll guide you with the right service options."
      );
    }

    // Transform Gemini SSE stream → OpenAI-compatible SSE stream
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
                const chunk = {
                  id: `chatcmpl-${chunkIndex++}`,
                  object: "chat.completion.chunk",
                  created: Math.floor(Date.now() / 1000),
                  model: "gemini-2.0-flash",
                  choices: [
                    { index: 0, delta: { content: text }, finish_reason: null },
                  ],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }

              const finishReason = parsed?.candidates?.[0]?.finishReason;
              if (finishReason && finishReason !== "STOP") {
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
