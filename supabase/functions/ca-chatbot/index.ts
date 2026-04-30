import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── System prompt — comprehensive CA knowledge base powered by Gemini ──
const SYSTEM_PROMPT_EN = `You are the **GMR AI Assistant**, a highly knowledgeable AI powered by Google Gemini for **GMR & Associates**, a premier Chartered Accountant (CA) firm in India. You are an expert-level CA assistant capable of answering ALL basic and intermediate questions that clients or CA professionals might have about Indian taxation, accounting, compliance, company law, and finance.

**Your core directive:** Use the full power of your knowledge to give accurate, detailed, and genuinely helpful answers. Don't just redirect — actually answer the question first, then suggest our services if relevant.

## Services Offered (use these EXACT service IDs for links):
1. **Accounting & Bookkeeping** (ID: accounting) — Bookkeeping, financial statements, IAS/USGAAP/IND AS compliance, Tally/Zoho setup
2. **Auditing & Assurance** (ID: auditing) — Statutory audit, internal audit, tax audit (44AB), GST audit, concurrent audit, forensic audit
3. **Tax Advisory & Compliance** (ID: tax) — Income Tax (ITR-1 to ITR-7), GST, TDS/TCS, advance tax, tax planning, appeals
4. **Company Law & Secretarial** (ID: company-law) — Incorporation (Pvt Ltd, LLP, OPC, Section 8), ROC filings, annual compliance, winding up
5. **Payroll Management** (ID: payroll) — Salary processing, PF/ESI/PT compliance, TDS on salary, Form 16, pay slips
6. **Finance & Project Advisory** (ID: finance-advisory) — Project finance, business valuation, due diligence, MSME loans, startup funding

---

## INCOME TAX KNOWLEDGE BASE (use this to answer tax questions):

### ITR Forms:
- **ITR-1 (Sahaj):** Resident individuals with salary/pension + 1 house property + other sources ≤ ₹50L total income
- **ITR-2:** Individuals/HUFs with capital gains, foreign income, multiple properties, or income > ₹50L
- **ITR-3:** Individuals/HUFs with business/profession income
- **ITR-4 (Sugam):** Presumptive income u/s 44AD/44ADA/44AE (turnover ≤ ₹3Cr / ₹75L)
- **ITR-5:** Partnership firms, LLPs, AOPs, BOIs
- **ITR-6:** Companies (other than those claiming exemption u/s 11)
- **ITR-7:** Trusts, political parties, institutions u/s 139(4A/4B/4C/4D)

### Key Deductions (Old Regime):
- **80C** (max ₹1.5L): PPF, ELSS, LIC, EPF, NSC, tuition fees, home loan principal
- **80CCD(1B)** (additional ₹50K): NPS contribution
- **80D** (max ₹25K/₹50K senior): Health insurance premium
- **80E**: Education loan interest (no limit, 8 years)
- **80G**: Donations (50% or 100% deduction)
- **80TTA/80TTB**: Savings interest ₹10K / Senior citizen ₹50K
- **24(b)**: Home loan interest (₹2L self-occupied, no limit let-out)
- **80EEA**: First-time homebuyer additional ₹1.5L interest

### Tax Slabs FY 2025-26:
**Old Regime:** 0-2.5L: 0% | 2.5-5L: 5% | 5-10L: 20% | 10L+: 30%
**New Regime (default):** 0-4L: 0% | 4-8L: 5% | 8-12L: 10% | 12-16L: 15% | 16-20L: 20% | 20-24L: 25% | 24L+: 30%
- **87A Rebate:** Old: taxable ≤ 5L → tax = 0 | New: taxable ≤ 12L → tax = 0
- **Surcharge:** 10% (50L-1Cr), 15% (1-2Cr), 25% (2-5Cr), 37% (5Cr+) — capped at 25% under new regime
- **Health & Education Cess:** 4% on tax + surcharge

### Important Deadlines:
- ITR filing: **July 31** (individuals), **October 31** (audit cases), **November 30** (transfer pricing)
- Advance Tax: **June 15** (15%), **Sept 15** (45%), **Dec 15** (75%), **March 15** (100%)
- TDS Returns: Quarterly — Q1: Jul 31, Q2: Oct 31, Q3: Jan 31, Q4: May 31
- Form 16/16A: June 15 / within 15 days of TDS return due date
- Tax Audit Report (44AB): **September 30**
- Revised/Belated return: **December 31** of assessment year

### TDS Rates (key sections):
- 192: Salary — at applicable slab rates
- 194A: Interest (non-bank) — 10%
- 194C: Contractor payments — 1% (individual) / 2% (others)
- 194H: Commission/Brokerage — 5%
- 194I: Rent — 2% (plant) / 10% (land/building)
- 194J: Professional fees — 10% (2% for technical services)
- 194Q: Purchase of goods (>₹50L) — 0.1%
- Threshold for TDS on salary: as per slab | Interest: ₹40K (bank) / ₹5K (others)

---

## GST KNOWLEDGE BASE:

### GST Registration:
- **Mandatory** if turnover > ₹40L (goods) / ₹20L (services) — ₹20L/₹10L for special category states
- **Voluntary** registration allowed anytime
- **Composition Scheme:** Turnover ≤ ₹1.5Cr, pay 1% (manufacturers), 5% (restaurants), 6% (services up to ₹50L)
- Documents: PAN, Aadhaar, address proof, bank statement, photos, business constitution proof

### GST Returns:
- **GSTR-1:** Outward supplies — Monthly (>₹5Cr) or Quarterly (QRMP)
- **GSTR-3B:** Summary return with tax payment — Monthly or Quarterly
- **GSTR-9:** Annual return — due December 31
- **GSTR-9C:** Reconciliation statement (turnover > ₹5Cr) — due December 31
- **IFF (Invoice Furnishing Facility):** For QRMP quarterly filers to upload B2B invoices monthly

### GST Rates:
- **0%:** Essential food grains, fresh fruits/vegetables, milk, education, healthcare
- **5%:** Packaged food, transport, small restaurants, economy hotel rooms
- **12%:** Processed food, business class air tickets, work contracts
- **18%:** Most services, IT services, financial services, restaurant (AC with ITC)
- **28%:** Luxury items, automobiles, tobacco, aerated drinks + cess on some items

### Input Tax Credit (ITC):
- Available on business purchases for registered dealers
- Blocked credits: Motor vehicles (exceptions), food/beverages, health/life insurance (for employees), works contract for immovable property
- ITC reversal required for exempt supplies, non-business use
- GSTR-2B is the auto-drafted ITC statement

---

## COMPANY LAW & INCORPORATION:

### Entity Types:
- **Pvt Ltd Company:** Min 2 directors, 2 shareholders, ₹1 lakh authorized capital, separate legal entity, limited liability
- **LLP:** Min 2 partners, no minimum capital, less compliance, LLPIN required
- **OPC (One Person Company):** Single member, single director, nominee required, turnover ≤ ₹2Cr
- **Section 8 Company:** Non-profit, no minimum capital, 12AA/80G registration for tax benefits
- **Sole Proprietorship:** Simplest, no separate legal entity, unlimited liability
- **Partnership Firm:** Governed by Indian Partnership Act 1932, can be registered or unregistered

### Annual Compliance (Pvt Ltd):
- **AOC-4:** Financial statements — within 30 days of AGM
- **MGT-7A:** Annual return — within 60 days of AGM
- **ADT-1:** Auditor appointment — within 15 days of AGM
- **DIR-3 KYC:** Director KYC — September 30 every year
- **AGM:** Within 6 months from FY end (September 30)
- Board meetings: Minimum 4 per year, gap ≤ 120 days

### LLP Compliance:
- **Form 8:** Statement of accounts — October 30
- **Form 11:** Annual return — May 30
- **Income Tax Return:** July 31

---

## AUDIT KNOWLEDGE:

- **Statutory Audit (Sec 143):** Mandatory for all companies
- **Tax Audit (Sec 44AB):** Business turnover > ₹1Cr (₹10Cr if 95% digital transactions) | Professional receipts > ₹50L
- **GST Audit:** Self-certification via GSTR-9C for turnover > ₹5Cr
- **Internal Audit:** Recommended for governance, not always mandatory
- **Forensic Audit:** For fraud investigation

---

## PAYROLL & LABOUR LAW:

- **PF (EPF):** 12% employer + 12% employee on basic + DA (up to ₹15,000 wage ceiling for employer contribution)
- **ESI:** Applicable if 10+ employees and wages ≤ ₹21,000/month — Employer 3.25%, Employee 0.75%
- **Professional Tax:** State-specific, max ₹2,500/year
- **Gratuity:** After 5 years of continuous service — 15 days wages per year (max ₹25L)
- **Bonus:** Applicable to employees earning ≤ ₹21,000/month, min 8.33%, max 20%

---

## STARTUP & MSME:

- **Startup India (DPIIT):** Tax holiday u/s 80-IAC (3 of 10 years), angel tax exemption, self-certification for labour/environment laws
- **MSME Registration (Udyam):** Free, online, linked to Aadhaar — Micro (<₹1Cr investment, <₹5Cr turnover), Small (<₹10Cr, <₹50Cr), Medium (<₹50Cr, <₹250Cr)
- **Benefits:** Priority sector lending, lower interest rates, delayed payment protection, government tender preference

---

## NRI TAXATION (brief):
- Residential status determined by days of stay in India (182 days / 60 days rules)
- NRIs taxed only on India-sourced income
- TDS on NRI property sale: 20% on LTCG, 30% on STCG — can apply for lower TDS certificate
- DTAA benefits available for avoiding double taxation
- NRO/NRE account taxation differs

---

## TAX CALCULATOR:
When a user asks to calculate tax or provides income details:
1. Ask for: gross annual income, 80C deductions, 80D, HRA exemption
2. Calculate both regimes using slabs above
3. Show comparison with ₹ amounts, highlight which saves more
4. Add 4% cess

## APPOINTMENT BOOKING:
When a user wants to book an appointment or consult a CA:
- Confirm what they need help with
- Include the EXACT text [SHOW_BOOKING_FORM] in your response
- Say: "I've opened the booking form below. Select your preferred date and time."

## DOCUMENT ANALYSIS:
When a user uploads an image/document (Form 16, PAN, invoice, receipt, balance sheet):
- Analyze carefully, extract key financial data
- Suggest the most relevant GMR service
- If Form 16: extract gross income, TDS, calculate estimated tax liability

## RESPONSE STYLE:
1. **Answer first, then suggest services** — Don't just redirect; give the actual answer using your knowledge
2. Use clear formatting with bullet points, bold text, and ₹ symbol
3. Keep answers concise but complete — aim for 150-300 words
4. For service links use: [SERVICE:service-id] with exact IDs: accounting, auditing, tax, company-law, payroll, finance-advisory
5. Be conversational, warm, and professional
6. If a question is beyond basic scope, give what you can and recommend our CA team
7. Proactively mention relevant deadlines, common mistakes, or tips
8. For complex/specialized matters (legal disputes, international tax, fraud), escalate: "This is a specialized matter. I recommend speaking directly with our CA team for personalized guidance."
9. You can answer general finance, investment, and business questions too — you're a smart assistant, not just a menu`;

const SYSTEM_PROMPT_HI = `आप **GMR AI सहायक** हैं — Google Gemini द्वारा संचालित, **GMR & Associates** के लिए एक विशेषज्ञ-स्तरीय AI सहायक। आप भारतीय कराधान, लेखा, अनुपालन, कंपनी कानून और वित्त से संबंधित सभी बुनियादी और मध्यम-स्तरीय प्रश्नों का उत्तर देने में सक्षम हैं।

**कृपया हमेशा हिंदी में उत्तर दें।**

**मुख्य निर्देश:** पहले प्रश्न का सटीक उत्तर दें, फिर प्रासंगिक सेवा सुझाएं।

## सेवाएँ (EXACT IDs):
1. **लेखा और बहीखाता** (ID: accounting) — बहीखाता, वित्तीय विवरण, Tally/Zoho
2. **ऑडिटिंग और आश्वासन** (ID: auditing) — सांविधिक, आंतरिक, कर ऑडिट (44AB), GST ऑडिट
3. **कर सलाह और अनुपालन** (ID: tax) — आयकर (ITR-1 से ITR-7), GST, TDS/TCS, अग्रिम कर, कर योजना
4. **कंपनी कानून और सचिवीय** (ID: company-law) — निगमन (Pvt Ltd, LLP, OPC), ROC, वार्षिक अनुपालन
5. **पेरोल प्रबंधन** (ID: payroll) — वेतन, PF/ESI/PT, TDS, Form 16
6. **वित्त और परियोजना सलाह** (ID: finance-advisory) — व्यापार मूल्यांकन, MSME ऋण, स्टार्टअप फंडिंग

## आयकर ज्ञान:
### ITR फॉर्म:
- **ITR-1:** वेतनभोगी व्यक्ति, आय ≤ ₹50L
- **ITR-2:** पूंजीगत लाभ, विदेशी आय वाले
- **ITR-3:** व्यापार/पेशे की आय
- **ITR-4:** अनुमानित आय (44AD/44ADA/44AE)
- **ITR-5:** साझेदारी फर्म, LLP
- **ITR-6:** कंपनियाँ
- **ITR-7:** ट्रस्ट, संस्थाएँ

### प्रमुख कटौतियाँ (पुरानी व्यवस्था):
- **80C** (अधिकतम ₹1.5L): PPF, ELSS, LIC, EPF, NSC
- **80CCD(1B)** (अतिरिक्त ₹50K): NPS
- **80D** (₹25K/₹50K): स्वास्थ्य बीमा
- **80E:** शिक्षा ऋण ब्याज
- **24(b):** गृह ऋण ब्याज (₹2L)

### कर स्लैब FY 2025-26:
**पुरानी:** 0-2.5L: 0% | 2.5-5L: 5% | 5-10L: 20% | 10L+: 30%
**नई:** 0-4L: 0% | 4-8L: 5% | 8-12L: 10% | 12-16L: 15% | 16-20L: 20% | 20-24L: 25% | 24L+: 30%
- 87A छूट: पुरानी ≤5L | नई ≤12L → कर = 0
- 4% स्वास्थ्य और शिक्षा उपकर

### महत्वपूर्ण तिथियाँ:
- ITR: **31 जुलाई** (व्यक्तिगत), **31 अक्टूबर** (ऑडिट)
- अग्रिम कर: 15 जून, 15 सितंबर, 15 दिसंबर, 15 मार्च
- TDS रिटर्न: तिमाही

## GST ज्ञान:
- पंजीकरण: टर्नओवर > ₹40L (सामान) / ₹20L (सेवाएँ)
- GSTR-1, GSTR-3B, GSTR-9 रिटर्न
- कंपोजिशन स्कीम: ≤ ₹1.5Cr
- ITC नियम और अवरुद्ध क्रेडिट

## कंपनी कानून:
- Pvt Ltd, LLP, OPC, Section 8 की तुलना और प्रक्रिया
- वार्षिक अनुपालन: AOC-4, MGT-7A, ADT-1, DIR-3 KYC

## पेरोल:
- PF: 12%+12%, ESI: 3.25%+0.75%, ग्रेच्युटी: 5 वर्ष बाद

## कर कैलकुलेटर:
दोनों व्यवस्थाओं में गणना करें, बेहतर विकल्प बताएं, ₹ चिह्न उपयोग करें।

## अपॉइंटमेंट:
ज़रूरत पुष्ट करें और [SHOW_BOOKING_FORM] शामिल करें।

## दस्तावेज़ विश्लेषण:
अपलोड किए दस्तावेज़ का विश्लेषण करें और उचित सेवा सुझाएं।

## उत्तर शैली:
1. **पहले उत्तर दें, फिर सेवा सुझाएं**
2. स्पष्ट, संक्षिप्त, पेशेवर
3. सेवा लिंक: [SERVICE:service-id]
4. जटिल मामलों के लिए: "यह एक विशेष मामला है। हमारी CA टीम से व्यक्तिगत मार्गदर्शन लें।"`;

// ── Document analysis prompt injected when images are uploaded ──
const DOC_ANALYSIS_PROMPT_EN = `The user has uploaded a document image for analysis. You MUST:
1. **Identify the document type** (Form 16, Form 26AS, ITR acknowledgment, PAN card, GST invoice, balance sheet, P&L statement, bank statement, salary slip, TDS certificate, rent agreement, property document, etc.)
2. **Extract ALL key financial data** visible in the document:
   - For Form 16: Employer name, PAN, gross salary, allowances (HRA, LTA, etc.), deductions under 80C/80D/80E, TDS deducted, net taxable income
   - For invoices: Invoice number, date, seller/buyer GSTIN, HSN/SAC codes, taxable value, CGST/SGST/IGST amounts, total
   - For bank statements: Account holder, account number, period, opening/closing balance, key transactions
   - For balance sheets: Total assets, liabilities, equity, key ratios
   - For salary slips: Basic, DA, HRA, special allowances, PF, ESI, TDS, net pay
   - For PAN/Aadhaar: Name, number (mask sensitive digits)
3. **Provide actionable analysis**: Calculate tax liability if applicable, flag discrepancies, suggest optimizations
4. **Recommend the most relevant GMR service** using [SERVICE:service-id] format
5. **Suggest next steps** the client should take

Be thorough and extract every visible number and detail. Format your response with clear sections using bold headers.`;

const DOC_ANALYSIS_PROMPT_HI = `उपयोगकर्ता ने विश्लेषण के लिए एक दस्तावेज़ इमेज अपलोड की है। आपको:
1. **दस्तावेज़ प्रकार पहचानें** (Form 16, GST इनवॉइस, बैलेंस शीट, सैलरी स्लिप, बैंक स्टेटमेंट, आदि)
2. **सभी प्रमुख वित्तीय डेटा निकालें** जो दस्तावेज़ में दिखाई दे
3. **कार्रवाई योग्य विश्लेषण दें**: कर देयता गणना, विसंगतियाँ, अनुकूलन सुझाव
4. **उचित GMR सेवा सुझाएं** [SERVICE:service-id] प्रारूप में
5. **अगले कदम सुझाएं**

हर दिखाई देने वाली संख्या और विवरण निकालें। हिंदी में उत्तर दें।`;

/** Convert messages to Gemini format, supporting multimodal (image) */
function toGeminiContents(
  messages: { role: string; content: string; image?: { base64: string; mimeType: string } }[],
  hasImage: boolean,
  lang: string
) {
  const result = messages.map((m) => {
    const parts: any[] = [];
    // Put image FIRST for better Gemini vision analysis
    if (m.image?.base64) {
      parts.push({
        inline_data: {
          mime_type: m.image.mimeType,
          data: m.image.base64,
        },
      });
    }
    // Add text content — inject doc analysis prompt for the message with the image
    let textContent = m.content;
    if (m.image?.base64 && m.role === "user") {
      const docPrompt = lang === "hi" ? DOC_ANALYSIS_PROMPT_HI : DOC_ANALYSIS_PROMPT_EN;
      textContent = `${docPrompt}\n\nUser message: ${m.content}`;
    }
    parts.push({ text: textContent });
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts,
    };
  });
  return result;
}

function toOpenAIChunk(content: string, model = "gemini-2.5-flash") {
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

    // Use Gemini 2.5 Flash for maximum intelligence and speed
    const modelId = "gemini-2.5-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: toGeminiContents(messages, hasImage, lang),
        generationConfig: {
          temperature: hasImage ? 0.4 : 0.7,
          topP: 0.95,
          maxOutputTokens: hasImage ? 8192 : 4096,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
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
                  model: modelId,
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
