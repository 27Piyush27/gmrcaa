import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare, X, Send, Trash2, ArrowRight, Mic, MicOff,
  Image as ImageIcon, Globe, Calendar, Calculator, Bell, Sparkles,
  Loader2, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown,
  Moon, Sun, History, ChevronLeft, Search, FileText, Paperclip, CheckCircle,
  Zap, ShieldCheck, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { servicesData } from "@/lib/servicesData";
import { resolveServiceIdForDb } from "@/lib/serviceIdResolver";
import { notifyStaff } from "@/lib/notifications";
import { getToolPrompt, parseToolCalls, stripToolCalls, executeTool } from "@/lib/agentTools";

// ── constants ──────────────────────────────────────────────────────────
const QUICK_OPTIONS_EN = [
  "I need help filing my Income Tax Return",
  "I want to register for GST",
  "I'm starting a new company",
  "What services do you offer?",
];
const QUICK_OPTIONS_HI = [
  "मुझे इनकम टैक्स रिटर्न दाखिल करने में मदद चाहिए",
  "मुझे GST के लिए रजिस्ट्रेशन करना है",
  "मैं एक नई कंपनी शुरू कर रहा हूँ",
  "आपकी क्या सेवाएँ हैं?",
];

const STAFF_QUICK_OPTIONS_EN = [
  "Show me my pending tasks",
  "What are today's appointments?",
  "Navigate to client dashboard",
  "How do I update a service request?",
];
const STAFF_QUICK_OPTIONS_HI = [
  "मेरे लंबित कार्य दिखाएं",
  "आज की अपॉइंटमेंट क्या हैं?",
  "क्लाइंट डैशबोर्ड पर जाएं",
  "सेवा अनुरोध को कैसे अपडेट करें?",
];

const TAX_DEADLINES = [
  { label: "ITR Filing (Individuals)", date: "2026-07-31", labelHi: "ITR दाखिल (व्यक्तिगत)" },
  { label: "TDS Return – Q1", date: "2026-07-31", labelHi: "TDS रिटर्न – Q1" },
  { label: "GST Annual Return", date: "2026-12-31", labelHi: "GST वार्षिक रिटर्न" },
  { label: "Advance Tax – 1st Instalment", date: "2026-06-15", labelHi: "एडवांस टैक्स – पहली किस्त" },
  { label: "Company Annual Filing (ROC)", date: "2026-10-31", labelHi: "कंपनी वार्षिक फाइलिंग (ROC)" },
];

// ── Smart suggestion mapping ───────────────────────────────────────────
const SUGGESTION_MAP = {
  en: [
    { keywords: ["gst", "goods and service", "gstr"], suggestions: ["GST filing process", "GST registration documents", "Book GST consultation"] },
    { keywords: ["itr", "income tax", "return", "filing"], suggestions: ["ITR filing deadline", "Documents needed for ITR", "Calculate my tax"] },
    { keywords: ["company", "incorporat", "pvt", "llp", "opc", "startup"], suggestions: ["Company types comparison", "Registration process", "Annual compliance checklist"] },
    { keywords: ["tds", "deduct"], suggestions: ["TDS return dates", "Current TDS rates", "File TDS return"] },
    { keywords: ["audit", "assurance"], suggestions: ["Types of audit", "Audit preparation checklist", "Book audit consultation"] },
    { keywords: ["payroll", "salary", "pf", "esi"], suggestions: ["PF/ESI contribution rates", "Payroll services details", "TDS on salary"] },
    { keywords: ["book", "appointment", "consult", "meet"], suggestions: ["View available slots", "Types of consultation", "Office location"] },
    { keywords: ["tax", "save", "deduction", "80c", "80d"], suggestions: ["Tax saving investments", "Section 80C limit", "Compare old vs new regime"] },
  ],
  hi: [
    { keywords: ["gst", "जीएसटी"], suggestions: ["GST फाइलिंग प्रक्रिया", "GST पंजीकरण दस्तावेज़", "GST परामर्श बुक करें"] },
    { keywords: ["itr", "आयकर", "रिटर्न"], suggestions: ["ITR फाइलिंग की अंतिम तिथि", "ITR के लिए दस्तावेज़", "मेरा टैक्स कैलकुलेट करें"] },
    { keywords: ["कंपनी", "निगमन", "स्टार्टअप"], suggestions: ["कंपनी प्रकार तुलना", "पंजीकरण प्रक्रिया", "वार्षिक अनुपालन"] },
    { keywords: ["टैक्स", "बचत", "कटौती"], suggestions: ["टैक्स बचत निवेश", "धारा 80C सीमा", "पुरानी vs नई व्यवस्था"] },
  ],
};

function getSuggestions(text, lang) {
  const q = text.toLowerCase();
  const map = SUGGESTION_MAP[lang] || SUGGESTION_MAP.en;
  for (const entry of map) {
    if (entry.keywords.some((k) => q.includes(k))) {
      return entry.suggestions;
    }
  }
  return [];
}

// ── FAQ Interception Mapping ───────────────────────────────────────────
const FAQ_RESPONSES = {
  en: [
    {
      keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "namaste"],
      response: "Hello! 👋 Welcome to **GMR & Associates**. I'm your AI tax assistant powered by Gemini. I can help you with:\n\n- 📋 **Tax filing & advisory**\n- 🏢 **Company incorporation**\n- 📊 **GST compliance**\n- 📄 **Document analysis**\n- 📅 **Booking appointments**\n\nHow can I assist you today?"
    },
    {
      keywords: ["thank you", "thanks", "dhanyavaad", "shukriya", "appreciate"],
      response: "You're welcome! 😊 If you need any further assistance with tax filing, GST, or any of our services, feel free to ask anytime. We're here to help!"
    },
    {
      keywords: ["bye", "goodbye", "see you", "quit", "exit"],
      response: "Goodbye! 👋 Thank you for using GMR Assistant. We're always here when you need us. Have a great day!"
    },
    {
      keywords: ["office hours", "timing", "open", "working hours", "when do you open"],
      response: "Our office is open from **Monday to Saturday, 10:00 AM to 6:30 PM**. We are closed on Sundays and public holidays."
    },
    {
      keywords: ["address", "location", "where are you", "office address", "visit"],
      response: "We have two offices:\n\n📍 **Gurugram**: H.No.43, SF, Sector-7, Gurugram 122001\n📍 **Delhi**: AB 38, Shalimar Bagh, Delhi 110088\n\nYou can visit us during our office hours or book an appointment online."
    },
    {
      keywords: ["contact", "phone", "call", "email", "number", "reach you"],
      response: "You can reach us at:\n\n📞 **Gurugram**: +91 98712 09393\n📞 **Delhi**: +91 98710 84875\n✉️ **Email**: info@gmrindia.com"
    },
    {
      keywords: ["pricing", "cost", "fees", "how much", "charges"],
      response: "Our fees vary depending on the service you require. For standard packages, please visit our [Services](/services) page. For a customized quote, please [Contact Us](/contact) or book a consultation."
    },
    {
      keywords: ["what services", "what do you do", "offerings", "how can you help"],
      response: "We offer a wide range of services including:\n\n- **Income Tax Return (ITR) Filing** — from ₹2,999\n- **GST Registration & Filing** — from ₹999\n- **Company Incorporation** — from ₹9,999\n- **Audit & Assurance** — from ₹15,000\n- **Payroll & TDS Compliance** — from ₹2,499\n- **Project Finance** — from ₹19,999\n\nYou can explore all our services [here](/services)."
    },
    {
      keywords: ["documents for itr", "itr documents", "what do i need for income tax"],
      response: "For basic ITR filing, you typically need:\n- PAN Card\n- Aadhaar Card\n- Form 16 (if salaried)\n- Bank statements for the financial year\n- Investment proofs (like LIC, PPF, for 80C deductions)\n- AIS/TIS from the Income Tax portal\n\nYou can upload these directly in the chat or on your [Dashboard](/dashboard)."
    },
    {
      keywords: ["track status", "check status", "my request status"],
      response: "You can track the live progress of all your active service requests by visiting your [Dashboard](/dashboard). We also send email notifications whenever the status updates."
    },
    {
      keywords: ["do i need gst", "what is gst", "gst registration required", "gst threshold"],
      response: "GST registration is mandatory if:\n\n- **Goods**: Turnover exceeds **₹40 Lakhs** (₹20 Lakhs for NE states)\n- **Services**: Turnover exceeds **₹20 Lakhs** (₹10 Lakhs for NE states)\n- Inter-state sales or e-commerce sellers — **mandatory** regardless of turnover\n\nWe offer GST Registration for **₹1,999**. Would you like to get started?"
    },
    {
      keywords: ["payment methods", "how to pay", "can i pay online", "upi"],
      response: "Yes, we accept 100% secure online payments through Razorpay. You can pay via UPI, Credit/Debit Cards, or Net Banking directly from your client dashboard once your service is marked as completed."
    },
    {
      keywords: ["online consultation", "video call", "virtual meeting"],
      response: "Absolutely! You can book an online video consultation with our Chartered Accountants. Just [Navigate to Appointments](/appointments) and select 'Video Consultation'. [SHOW_BOOKING_FORM]"
    },
    {
      keywords: ["about gmr", "who are you", "about your firm", "about the company", "founded"],
      response: "**GMR & Associates** is a leading Chartered Accountancy firm founded in **2011** by **CA Gaurav Mahajan (FCA, DISA)**. With **15+ years** of experience and **500+ clients**, we specialize in:\n\n- Tax Advisory & Filing\n- GST Compliance\n- Company Law & Incorporation\n- Audit & Assurance\n- Payroll Management\n- Project Finance\n\nOur offices are in **Gurugram** and **Delhi**."
    },
    {
      keywords: ["new regime", "old regime", "which regime", "tax regime comparison", "new vs old"],
      response: "**Tax Regime Comparison (FY 2025-26):**\n\n| Feature | Old Regime | New Regime (Default) |\n|---|---|---|\n| Standard Deduction | ₹50,000 | ₹75,000 |\n| 80C Deductions | ✅ Up to ₹1.5L | ❌ Not available |\n| 80D (Health) | ✅ Up to ₹25K | ❌ Not available |\n| HRA Exemption | ✅ Available | ❌ Not available |\n| Rebate u/s 87A | Up to ₹5L income | Up to ₹12L income |\n\n**Tip:** If your total deductions exceed ~₹3.75 Lakh, the Old Regime may save more. Use our [Tax Calculator](/tax-calculator) for a personalized comparison."
    },
    {
      keywords: ["80c", "section 80c", "tax saving investments", "how to save tax"],
      response: "**Section 80C** allows deductions up to **₹1.5 Lakh** per year (Old Regime only). Eligible investments:\n\n- **PPF** — ₹500 to ₹1.5L/year, tax-free returns\n- **ELSS Mutual Funds** — 3-year lock-in, equity returns\n- **Life Insurance (LIC)** — Premium payments\n- **NSC** — 5-year fixed deposit\n- **EPF/VPF** — Salary deduction\n- **Home Loan Principal** — Repayment\n- **Tuition Fees** — Up to 2 children\n- **5-Year FD** — Tax-saving fixed deposit\n\nWould you like personalized tax planning advice?"
    },
    {
      keywords: ["itr deadline", "filing deadline", "last date", "due date itr"],
      response: "**ITR Filing Deadlines (AY 2026-27):**\n\n- **Individuals (non-audit):** 31st July 2026\n- **Audit cases (businesses):** 31st October 2026\n- **Transfer Pricing cases:** 30th November 2026\n- **Revised/Belated return:** 31st December 2026\n\n⚠️ Late filing attracts a penalty of ₹1,000 to ₹5,000 under Section 234F."
    },
    {
      keywords: ["advance tax", "advance tax due", "advance tax dates"],
      response: "**Advance Tax Due Dates (FY 2025-26):**\n\n| Instalment | Due Date | Cumulative % |\n|---|---|---|\n| 1st | 15th June 2026 | 15% |\n| 2nd | 15th September 2026 | 45% |\n| 3rd | 15th December 2026 | 75% |\n| 4th | 15th March 2027 | 100% |\n\nAdvance tax is applicable if your total tax liability exceeds **₹10,000** in a year."
    },
    {
      keywords: ["tds rate", "tds on salary", "tds rates", "tds percentage"],
      response: "**Common TDS Rates (FY 2025-26):**\n\n- **Salary (Section 192):** As per slab rates\n- **Interest on FD (194A):** 10% (above ₹40K)\n- **Professional fees (194J):** 10%\n- **Rent (194I):** 10% (above ₹2.4L/year)\n- **Property sale (194-IA):** 1% (above ₹50L)\n- **Commission (194H):** 5%\n\nNo TDS if PAN is linked with Aadhaar and income is below threshold."
    },
    {
      keywords: ["nri", "non resident", "nri tax", "nri itr"],
      response: "**NRI Tax Filing:**\n\nNRIs must file ITR in India if:\n- Indian income exceeds **₹2.5 Lakh**\n- Capital gains from Indian assets\n- Rental income from Indian property\n\nWe specialize in NRI taxation including DTAA benefits, TDS refunds, and property-related compliance. Book a consultation for personalized advice. [SHOW_BOOKING_FORM]"
    },
    {
      keywords: ["startup", "startup registration", "register startup", "dpiit"],
      response: "**Startup Registration Services:**\n\n1. **Company Incorporation** (Pvt Ltd/LLP/OPC) — ₹9,999\n2. **DPIIT Startup Recognition** — Tax benefits for 3 years\n3. **MSME/Udyam Registration** — Free government benefits\n4. **GST Registration** — ₹1,999\n5. **Trademark Filing** — Brand protection\n\nWe've helped **100+ startups** incorporate and scale. Shall I request the Company Incorporation service for you?"
    },
    {
      keywords: ["audit required", "when is audit mandatory", "tax audit limit", "audit threshold"],
      response: "**Tax Audit (Section 44AB) is mandatory when:**\n\n- **Business turnover** exceeds ₹1 Crore (₹10 Cr if 95%+ digital transactions)\n- **Professional receipts** exceed ₹50 Lakhs\n- **Presumptive taxation** opted but income declared below prescribed limits\n\nAudit deadline: **30th September** of the assessment year.\n\nOur Audit & Assurance service starts at **₹15,000**."
    },
    {
      keywords: ["form 16", "what is form 16", "form 16 not received"],
      response: "**Form 16** is a TDS certificate issued by your employer showing:\n- Salary income & deductions\n- TDS deducted on salary\n- Tax computation\n\nIf you haven't received Form 16:\n1. Request from your HR/Employer\n2. Download **Form 26AS** from the IT portal (shows all TDS)\n3. Check **AIS (Annual Information Statement)** for complete data\n\nWe can file your ITR even without Form 16 using Form 26AS and payslips."
    },
    {
      keywords: ["huf", "hindu undivided family", "huf benefits"],
      response: "**HUF (Hindu Undivided Family)** is a separate tax entity:\n\n✅ **Benefits:**\n- Separate ₹2.5L basic exemption\n- Separate 80C deduction (₹1.5L)\n- Can own property, run business\n- Lower tax outgo for the family\n\n❌ **Limitations:**\n- Cannot be salaried\n- Only Hindu, Sikh, Jain, Buddhist families\n\nWe can help you set up and manage your HUF. [Contact us](/contact) for details."
    },
    {
      keywords: ["refund", "income tax refund", "refund status", "when will i get refund"],
      response: "**Income Tax Refund Timeline:**\n\n- Refunds are typically processed within **20-45 days** of e-verification\n- Check status on [incometax.gov.in](https://www.incometax.gov.in) → Refund Status\n- Ensure your **bank account is pre-validated** and linked with PAN\n- Refund is credited directly to your bank account via ECS\n\n⚠️ If refund is delayed beyond 60 days, you can raise a grievance on the portal."
    },
    {
      keywords: ["upload documents", "how to upload", "send files", "document vault", "where to put pan"],
      response: "You can securely upload and manage all your tax documents (PAN, Aadhaar, Form 16, Bank Statements) in our encrypted **Document Vault**. Only our authorized CAs have access to these files.\n\n[NAVIGATE: /documents]"
    },
    {
      keywords: ["pay invoice", "billing", "how to pay", "pay ca fee", "invoices"],
      response: "You can view and pay all your pending CA service fees directly through our secure platform using UPI, Credit/Debit cards, or Net Banking. Once paid, the receipt is instantly generated.\n\n[NAVIGATE: /invoices]"
    }
  ],
  hi: [
    {
      keywords: ["हेलो", "नमस्ते", "नमस्कार", "हाय", "शुभ प्रभात"],
      response: "नमस्ते! 👋 **GMR & Associates** में आपका स्वागत है। मैं आपका AI टैक्स सहायक हूँ। मैं आपकी इन चीज़ों में मदद कर सकता हूँ:\n\n- 📋 **टैक्स फाइलिंग और सलाह**\n- 🏢 **कंपनी निगमन**\n- 📊 **GST अनुपालन**\n- 📄 **दस्तावेज़ विश्लेषण**\n- 📅 **अपॉइंटमेंट बुकिंग**\n\nमैं आज आपकी कैसे मदद कर सकता हूँ?"
    },
    {
      keywords: ["धन्यवाद", "शुक्रिया", "थैंक्स"],
      response: "आपका स्वागत है! 😊 अगर आपको टैक्स फाइलिंग, GST या हमारी किसी भी सेवा के बारे में और मदद चाहिए, तो बेझिझक पूछें।"
    },
    {
      keywords: ["ऑफिस का समय", "खुलने का समय", "टाइमिंग", "काम करने का समय"],
      response: "हमारा कार्यालय **सोमवार से शनिवार सुबह 10:00 बजे से शाम 6:30 बजे** तक खुला रहता है। रविवार और सार्वजनिक अवकाश को बंद रहता है।"
    },
    {
      keywords: ["पता", "लोकेशन", "कहाँ हैं", "ऑफिस एड्रेस"],
      response: "हमारे दो कार्यालय हैं:\n\n📍 **गुरुग्राम**: H.No.43, SF, Sector-7, Gurugram 122001\n📍 **दिल्ली**: AB 38, Shalimar Bagh, Delhi 110088\n\nआप हमसे मिल सकते हैं या अपॉइंटमेंट बुक कर सकते हैं।"
    },
    {
      keywords: ["संपर्क", "फोन", "कॉल", "ईमेल", "नंबर"],
      response: "आप हमसे संपर्क कर सकते हैं:\n\n📞 **गुरुग्राम**: +91 98712 09393\n📞 **दिल्ली**: +91 98710 84875\n✉️ **ईमेल**: info@gmrindia.com"
    },
    {
      keywords: ["फीस", "कीमत", "खर्च", "चार्ज"],
      response: "हमारी फीस सेवा पर निर्भर करती है। मानक पैकेजों के लिए, कृपया हमारे [सर्विसेज](/services) पेज पर जाएँ। अनुकूलित कोटेशन के लिए, कृपया [संपर्क करें](/contact) या परामर्श बुक करें।"
    },
    {
      keywords: ["क्या सेवाएं", "आप क्या करते हैं"],
      response: "हम विभिन्न सेवाएं प्रदान करते हैं:\n\n- **इनकम टैक्स रिटर्न (ITR) फाइलिंग** — ₹2,999 से\n- **GST रजिस्ट्रेशन और फाइलिंग** — ₹999 से\n- **कंपनी निगमन** — ₹9,999 से\n- **ऑडिट और एश्योरेंस** — ₹15,000 से\n- **पेरोल और TDS अनुपालन** — ₹2,499 से\n\nआप हमारी सभी सेवाएं [यहाँ](/services) देख सकते हैं।"
    },
    {
      keywords: ["itr के लिए दस्तावेज़", "इनकम टैक्स के लिए क्या चाहिए"],
      response: "मूल ITR फाइलिंग के लिए, आपको आम तौर पर आवश्यकता होती है:\n- पैन कार्ड\n- आधार कार्ड\n- फॉर्म 16 (यदि वेतनभोगी हैं)\n- वित्तीय वर्ष के लिए बैंक स्टेटमेंट\n- निवेश प्रमाण (80C के लिए)\n- AIS/TIS इनकम टैक्स पोर्टल से\n\nआप इन्हें सीधे चैट में या अपने [डैशबोर्ड](/dashboard) पर अपलोड कर सकते हैं।"
    },
    {
      keywords: ["स्टेटस कैसे चेक करें", "मेरा स्टेटस"],
      response: "आप अपने [डैशबोर्ड](/dashboard) पर जाकर अपने सभी सक्रिय सेवा अनुरोधों की लाइव प्रगति को ट्रैक कर सकते हैं।"
    },
    {
      keywords: ["भुगतान कैसे करें", "पेमेंट", "ऑनलाइन पेमेंट"],
      response: "हाँ, हम सुरक्षित ऑनलाइन भुगतान स्वीकार करते हैं। आप UPI, क्रेडिट/डेबिट कार्ड या नेट बैंकिंग के माध्यम से भुगतान कर सकते हैं।"
    },
    {
      keywords: ["जीएमआर के बारे में", "आप कौन हैं", "फर्म के बारे में"],
      response: "**GMR & Associates** एक प्रमुख चार्टर्ड एकाउंटेंसी फर्म है जिसकी स्थापना **2011** में **CA गौरव महाजन (FCA, DISA)** ने की थी। **15+ वर्षों** के अनुभव और **500+ ग्राहकों** के साथ, हम टैक्स सलाह, GST, कंपनी कानून, ऑडिट और प्रोजेक्ट फाइनेंस में विशेषज्ञता रखते हैं।"
    },
    {
      keywords: ["नई व्यवस्था", "पुरानी व्यवस्था", "कौन सी व्यवस्था", "टैक्स व्यवस्था"],
      response: "**टैक्स व्यवस्था तुलना (FY 2025-26):**\n\n- **पुरानी व्यवस्था:** स्टैंडर्ड डिडक्शन ₹50,000। 80C/80D कटौती उपलब्ध। ₹5 लाख तक छूट।\n- **नई व्यवस्था (डिफ़ॉल्ट):** स्टैंडर्ड डिडक्शन ₹75,000। कोई 80C/80D कटौती नहीं। ₹12 लाख तक छूट।\n\nयदि आपकी कुल कटौतियाँ ~₹3.75 लाख से अधिक हैं, तो पुरानी व्यवस्था बेहतर हो सकती है। हमारे [टैक्स कैलकुलेटर](/tax-calculator) का उपयोग करें।"
    },
    {
      keywords: ["80सी", "टैक्स कैसे बचाएं", "निवेश से बचत"],
      response: "**धारा 80C** के तहत **₹1.5 लाख** तक की कटौती (पुरानी व्यवस्था में):\n\n- **PPF** — ₹500 से ₹1.5L/वर्ष\n- **ELSS म्यूचुअल फंड** — 3 साल का लॉक-इन\n- **जीवन बीमा (LIC)** — प्रीमियम\n- **EPF/VPF** — वेतन से कटौती\n- **होम लोन मूलधन** — भुगतान\n- **ट्यूशन फीस** — 2 बच्चों तक\n\nक्या आप व्यक्तिगत टैक्स प्लानिंग सलाह चाहते हैं?"
    },
    {
      keywords: ["itr की अंतिम तिथि", "फाइलिंग डेडलाइन", "आखिरी तारीख"],
      response: "**ITR फाइलिंग की अंतिम तिथियाँ (AY 2026-27):**\n\n- **व्यक्तिगत (बिना ऑडिट):** 31 जुलाई 2026\n- **ऑडिट वाले (व्यापार):** 31 अक्टूबर 2026\n- **संशोधित/विलंबित रिटर्न:** 31 दिसंबर 2026\n\n⚠️ देर से फाइलिंग पर ₹1,000 से ₹5,000 तक जुर्माना (धारा 234F)।"
    },
    {
      keywords: ["जीएसटी जरूरी", "जीएसटी रजिस्ट्रेशन कब", "gst कब लगता है"],
      response: "GST रजिस्ट्रेशन अनिवार्य है यदि:\n\n- **सामान:** टर्नओवर **₹40 लाख** से अधिक\n- **सेवाएं:** टर्नओवर **₹20 लाख** से अधिक\n- अंतर-राज्यीय बिक्री या ई-कॉमर्स — **अनिवार्य**\n\nहम GST रजिस्ट्रेशन **₹1,999** में करते हैं।"
    },
    {
      keywords: ["एनआरआई", "अनिवासी भारतीय", "nri टैक्स"],
      response: "**NRI टैक्स फाइलिंग:**\n\nNRI को भारत में ITR फाइल करना होगा यदि:\n- भारतीय आय **₹2.5 लाख** से अधिक\n- भारतीय संपत्ति से पूंजीगत लाभ\n- भारतीय संपत्ति से किराया\n\nहम DTAA लाभ, TDS रिफंड और संपत्ति अनुपालन में विशेषज्ञ हैं। परामर्श बुक करें। [SHOW_BOOKING_FORM]"
    },
    {
      keywords: ["रिफंड", "इनकम टैक्स रिफंड", "रिफंड कब मिलेगा"],
      response: "**इनकम टैक्स रिफंड:**\n\n- रिफंड आमतौर पर ई-सत्यापन के **20-45 दिनों** में प्रोसेस होता है\n- स्टेटस [incometax.gov.in](https://www.incometax.gov.in) पर चेक करें\n- सुनिश्चित करें कि बैंक खाता **प्री-वैलिडेट** है और PAN से लिंक है\n\n⚠️ 60 दिनों से अधिक देरी होने पर पोर्टल पर शिकायत दर्ज करें।"
    },
    {
      keywords: ["दस्तावेज अपलोड", "डॉक्यूमेंट कैसे भेजें", "फाइल अपलोड"],
      response: "आप अपने सभी टैक्स दस्तावेज़ (PAN, आधार, फॉर्म 16, बैंक स्टेटमेंट) हमारे सुरक्षित **डॉक्यूमेंट वॉल्ट** में अपलोड कर सकते हैं। केवल हमारे अधिकृत CA ही इन फाइलों को देख सकते हैं।\n\n[NAVIGATE: /documents]"
    },
    {
      keywords: ["बिल", "इनवॉइस भुगतान", "फीस कैसे दें", "पेमेंट"],
      response: "आप UPI, क्रेडिट/डेबिट कार्ड या नेट बैंकिंग का उपयोग करके सीधे हमारे सुरक्षित प्लेटफॉर्म के माध्यम से अपनी सभी लंबित CA सेवा फीस देख और चुका सकते हैं।\n\n[NAVIGATE: /invoices]"
    }
  ],
  navigation_staff: [
    { keywords: ["dashboard", "admin panel", "control center", "admin home"], response: "Taking you to the Admin Dashboard. [NAVIGATE: /admin]" },
    { keywords: ["tasks", "my tasks", "todo", "service requests", "kanban"], response: "Opening your Task Board. [NAVIGATE: /admin/tasks]" },
    { keywords: ["services manage", "edit services", "service management"], response: "Taking you to Service Management. [NAVIGATE: /admin/services]" },
    { keywords: ["team", "staff", "manage team"], response: "Navigating to Team Management. [NAVIGATE: /admin/team]" },
    { keywords: ["appointments", "meetings", "calendar manage"], response: "Opening Appointment Management. [NAVIGATE: /admin/appointments]" },
    { keywords: ["blog manage", "posts", "articles edit"], response: "Taking you to the Blog Editor. [NAVIGATE: /admin/blog]" },
    { keywords: ["clients", "manage clients", "customer list"], response: "Taking you to Client Management. [NAVIGATE: /clients]" },
    { keywords: ["calendar", "tax calendar"], response: "Opening the Tax Calendar. [NAVIGATE: /admin/calendar]" },
    { keywords: ["careers manage", "job postings"], response: "Navigating to Careers Management. [NAVIGATE: /admin/careers]" },
    { keywords: ["chatbot docs", "ai documents"], response: "Opening Chatbot Documents. [NAVIGATE: /admin/chatbot-documents]" },
    { keywords: ["job applications", "applicants"], response: "Viewing Job Applications. [NAVIGATE: /admin/job-applications]" },
    { keywords: ["roles", "permissions", "user roles"], response: "Taking you to User Roles Management. [NAVIGATE: /admin/roles]" },
    { keywords: ["testimonials approve", "reviews manage"], response: "Opening Testimonial Approval. [NAVIGATE: /admin/testimonials]" },
    { keywords: ["ai insights", "client analysis"], response: "Navigating to AI Client Insights. [NAVIGATE: /admin/ai-insights]" },
    { keywords: ["workload", "optimizer"], response: "Taking you to the Workload Optimizer. [NAVIGATE: /admin/workload]" },
    { keywords: ["anomalies", "detect errors", "anomaly console"], response: "Opening the Anomaly Console. [NAVIGATE: /admin/anomalies]" },
    { keywords: ["analytics", "reports", "stats", "revenue"], response: "Taking you to Analytics & Reports. [NAVIGATE: /analytics]" }
  ],
  navigation_client: [
    { keywords: ["dashboard", "my profile", "my account"], response: "Taking you to your Client Dashboard. [NAVIGATE: /dashboard]" },
    { keywords: ["profile edit", "settings"], response: "Taking you to your Profile Settings. [NAVIGATE: /profile]" },
    { keywords: ["book appointment", "schedule meeting", "consultation", "talk to ca"], response: "I can help you schedule an appointment right here. Please choose your preferred date and time below: [SHOW_BOOKING_FORM]" },
    { keywords: ["appointments", "meetings", "my bookings"], response: "Navigating to your Appointments. [NAVIGATE: /my-appointments]" },
    { keywords: ["book", "all appointments"], response: "Taking you to the booking page. [NAVIGATE: /appointments]" },
    { keywords: ["services", "all services", "offerings"], response: "Taking you to our Services page. [NAVIGATE: /services]" },
    { keywords: ["contact", "support", "help", "customer care"], response: "Taking you to the Contact Support page. [NAVIGATE: /contact]" },
    { keywords: ["resources", "knowledge base"], response: "Opening the Knowledge Base. [NAVIGATE: /resources]" },
    { keywords: ["tax calculator", "calculate tax"], response: "Taking you to the Tax Calculator. [NAVIGATE: /tax-calculator]" },
    { keywords: ["calculators", "financial tools"], response: "Opening Financial Calculators. [NAVIGATE: /calculators]" },
    { keywords: ["tax optimizer", "ai tax optimizer"], response: "Navigating to the AI Tax Optimizer. [NAVIGATE: /ai-tax-optimizer]" },
    { keywords: ["risk assessment", "audit risk"], response: "Taking you to Risk Assessment. [NAVIGATE: /risk-assessment]" },
    { keywords: ["cash flow", "forecast"], response: "Opening the Cash Flow Forecast tool. [NAVIGATE: /cash-flow-forecast]" },
    { keywords: ["ai tools", "ai hub"], response: "Taking you to the AI Hub. [NAVIGATE: /ai-tools]" },
    { keywords: ["documents", "vault", "files", "upload file", "document vault"], response: "Opening your Secure Document Vault. You can upload PAN, Aadhaar, Form 16, and Bank Statements there. [NAVIGATE: /documents]" },
    { keywords: ["invoices", "bills", "payments", "pay fee", "receipt"], response: "Viewing your Invoice History. You can securely pay your pending CA fees here. [NAVIGATE: /invoices]" },
    { keywords: ["gst tracker", "track gst"], response: "Opening the GST Tracker. [NAVIGATE: /gst-tracker]" },
    { keywords: ["compliance", "score"], response: "Viewing your Compliance Score. [NAVIGATE: /compliance]" },
    { keywords: ["feedback", "suggestions"], response: "Taking you to the Feedback page. [NAVIGATE: /feedback]" },
    { keywords: ["notifications", "alerts"], response: "Managing your Notification Preferences. [NAVIGATE: /notifications]" },
    { keywords: ["blog", "news", "articles"], response: "Opening the Blog. [NAVIGATE: /blog]" },
    { keywords: ["team", "our cas", "staff", "who are you", "partners"], response: "Taking you to our Team page to meet our expert Chartered Accountants. [NAVIGATE: /team]" },
    { keywords: ["careers", "jobs", "hiring"], response: "Opening the Careers page. [NAVIGATE: /careers]" },
    { keywords: ["faq", "frequently asked questions"], response: "Taking you to the FAQ page. [NAVIGATE: /faq]" },
    { keywords: ["home page", "main page", "go home"], response: "Taking you to the Home page. [NAVIGATE: /]" }
  ]
};

function getFaqResponse(text, lang, isStaff) {
  const q = text.toLowerCase();
  
  // 1. Check navigation commands based on role
  const navMap = isStaff ? FAQ_RESPONSES.navigation_staff : FAQ_RESPONSES.navigation_client;
  for (const entry of navMap) {
    if (entry.keywords.some((k) => q.includes(k.toLowerCase()))) {
      return entry.response;
    }
  }

  // 2. Check general FAQs
  const faqMap = FAQ_RESPONSES[lang] || FAQ_RESPONSES.en;
  for (const entry of faqMap) {
    if (entry.keywords.some((k) => q.includes(k.toLowerCase()))) {
      return entry.response;
    }
  }
  
  return null;
}

// ── helpers ─────────────────────────────────────────────────────────────
function getDaysUntil(dateStr) {
  const target = new Date(dateStr + "T23:59:59");
  return Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24));
}

function getUpcomingDeadlines(lang = "en") {
  return TAX_DEADLINES
    .map((d) => ({ ...d, daysLeft: getDaysUntil(d.date) }))
    .filter((d) => d.daysLeft > 0 && d.daysLeft <= 60)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .map((d) => ({
      text: lang === "hi"
        ? `${d.labelHi} — ${d.daysLeft} दिन शेष (${d.date})`
        : `${d.label} — ${d.daysLeft} days left (${d.date})`,
      daysLeft: d.daysLeft,
    }));
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // Return the FULL data URL (e.g. "data:image/png;base64,xxxx")
    // so that the downstream split(',')[1] in sendMessage always works correctly.
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Tax calculation helper for inline widget
function calculateTax(income) {
  const inc = Number(income) || 0;
  // Old Regime
  let oldTax = 0;
  if (inc > 1000000) oldTax = 12500 + 100000 + (inc - 1000000) * 0.30;
  else if (inc > 500000) oldTax = 12500 + (inc - 500000) * 0.20;
  else if (inc > 250000) oldTax = (inc - 250000) * 0.05;
  if (inc <= 500000) oldTax = 0; // 87A rebate

  // New Regime
  let newTax = 0;
  const slabs = [[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]];
  let prev = 0;
  for (const [limit, rate] of slabs) {
    if (inc <= prev) break;
    const taxable = Math.min(inc, limit) - prev;
    newTax += taxable * rate;
    prev = limit;
  }
  if (inc <= 1200000) newTax = 0; // 87A rebate

  oldTax = Math.round(oldTax * 1.04); // 4% cess
  newTax = Math.round(newTax * 1.04);
  return { oldTax, newTax, better: newTax <= oldTax ? "new" : "old" };
}

// ── component ──────────────────────────────────────────────────────────
export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const { language: lang } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [showDeadlines, setShowDeadlines] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]); // multi-file
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [deadlineBadge, setDeadlineBadge] = useState(false);
  // New feature states
  const [ratings, setRatings] = useState({}); // { msgIndex: 'up'|'down' }
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [chatTheme, setChatTheme] = useState("auto"); // auto | dark | light
  const [showHistory, setShowHistory] = useState(false);
  const [pastConversations, setPastConversations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showTaxLookup, setShowTaxLookup] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const [serviceRequests, setServiceRequests] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState("");

  // Agentic AI state
  const [isExecutingTool, setIsExecutingTool] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  
  // Custom Training Knowledge
  const [aiTrainingData, setAiTrainingData] = useState([]);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();
  const isStaff = role === "admin" || role === "ca";

  const isHindi = lang === "hi";
  const quickOptions = isStaff 
    ? (isHindi ? STAFF_QUICK_OPTIONS_HI : STAFF_QUICK_OPTIONS_EN)
    : (isHindi ? QUICK_OPTIONS_HI : QUICK_OPTIONS_EN);
  const upcomingDeadlines = getUpcomingDeadlines(lang);

  // Resolve theme class
  const themeClass = chatTheme === "dark" ? "dark" : chatTheme === "light" ? "light-forced" : "";

  useEffect(() => {
    if (isOpen && upcomingDeadlines.length > 0 && messages.length === 0) {
      setDeadlineBadge(true);
    }
  }, [isOpen, upcomingDeadlines.length, messages.length]);

  useEffect(() => {
    if (user && isOpen) {
      supabase.from("service_requests")
        .select("id, services(name), status")
        .eq("user_id", user.id)
        .neq("status", "completed")
        .then(({ data }) => setServiceRequests(data || []));
    }
  }, [user, isOpen]);

  // Fetch AI Training Knowledge when chatbot opens
  useEffect(() => {
    if (isOpen) {
      supabase.from("ai_knowledge_base")
        .select("title, content, type")
        .eq("is_active", true)
        .then(({ data, error }) => {
          if (!error && data) {
            setAiTrainingData(data);
          }
        });
    }
  }, [isOpen]);

  const handleRequestService = async (serviceId) => {
    if (!user) {
      toast.error(isHindi ? "सेवा का अनुरोध करने के लिए कृपया लॉगिन करें" : "Please login to request a service");
      navigate("/auth", { state: { redirectTo: `/services` } });
      return;
    }
    try {
      const selectedService = servicesData.find((s) => s.id === serviceId);
      if (!selectedService) return;
      
      const backendServiceId = selectedService.backendServiceId ?? serviceId;
      const serviceIdForDb = await resolveServiceIdForDb(backendServiceId, selectedService.title);
      
      const { data: existing } = await supabase
        .from("service_requests")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("service_id", serviceIdForDb)
        .in("status", ["pending", "in_progress", "completed"]);

      if (existing?.length > 0) {
        toast.info(isHindi ? "आपके पास पहले से ही इस सेवा के लिए एक सक्रिय अनुरोध है।" : "You already have an active request for this service.");
        navigate("/dashboard");
        return;
      }
      
      const { error } = await supabase.from("service_requests").insert({
        user_id: user.id,
        service_id: serviceIdForDb,
        status: "pending",
        progress: 0
      });
      
      if (error) throw error;
      toast.success(isHindi ? "सेवा का सफलतापूर्वक अनुरोध किया गया!" : "Service requested successfully! Track progress on your dashboard.");
      navigate("/dashboard");
      notifyStaff(
        "New Service Request",
        `A client requested the ${selectedService.title} service via the Chatbot.`,
        "service_update"
      );
    } catch (err) {
      console.error(err);
      toast.error(isHindi ? "सेवा का अनुरोध करने में विफल।" : "Failed to request service.");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]") || scrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, showDeadlines, showBookingForm, showTaxLookup]);

  // ── Voice ─────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert(isHindi ? "आपका ब्राउज़र वॉइस इनपुट सपोर्ट नहीं करता" : "Your browser doesn't support voice input");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = isHindi ? "hi-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join("");
      setInput(transcript);
      // Auto-send when the final result is received (user stopped speaking)
      if (e.results[e.results.length - 1]?.isFinal) {
        setTimeout(() => {
          if (transcript.trim()) sendMessage(transcript);
        }, 300);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isHindi]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // ── Multi-file handling ───────────────────────────────────────────
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newFiles = [];
    for (const file of files.slice(0, 3 - pendingFiles.length)) {
      if (file.size > 20 * 1024 * 1024) {
        alert(isHindi ? "फ़ाइल 20MB से छोटी होनी चाहिए" : "File must be smaller than 20MB");
        continue;
      }
      const base64 = await fileToBase64(file);
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      const isSupportedByAI = isImage || isPdf;
      newFiles.push({
        file,
        preview: isImage ? URL.createObjectURL(file) : null,
        base64,
        mimeType: file.type || "application/octet-stream",
        isPdf,
        isSupportedByAI
      });
    }
    setPendingFiles((prev) => [...prev, ...newFiles].slice(0, 3));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx) => {
    setPendingFiles((prev) => {
      if (prev[idx]?.preview) URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const clearPendingFiles = () => {
    pendingFiles.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setPendingFiles([]);
    setShowShareModal(false);
  };

  // ── Chat History ──────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data } = await supabase
        .from("chat_conversations")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setPastConversations(data || []);
    } catch (err) {
      console.error("History load error:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  const loadConversation = async (convId) => {
    try {
      const { data } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      if (data?.length) {
        setMessages(data.map((m) => ({ role: m.role, content: m.content })));
        setConversationId(convId);
      }
      setShowHistory(false);
    } catch (err) {
      console.error("Load conversation error:", err);
    }
  };

  // ── Conversation persistence ──────────────────────────────────────
  const ensureConversation = useCallback(async () => {
    if (!user || conversationId) return conversationId;
    const { data } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id, title: "AI Assistant Chat" })
      .select("id")
      .single();
    if (data) {
      setConversationId(data.id);
      return data.id;
    }
    return null;
  }, [user, conversationId]);

  // ── Copy message ──────────────────────────────────────────────────
  const copyMessage = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch { /* ignore */ }
  };

  // ── Regenerate ────────────────────────────────────────────────────
  const regenerateLastResponse = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;
    
    // Safely slice the array without relying on async state closures
    let newMessages = [...messages];
    if (newMessages[newMessages.length - 1]?.role === "assistant") {
      newMessages = newMessages.slice(0, -1);
    }
    
    sendMessage(lastUserMsg.content, true, newMessages);
  };

  // ── Send message ──────────────────────────────────────────────────
  const sendMessage = async (text, isRegen = false, explicitMessages = null) => {
    if ((!text.trim() && !pendingFiles.length) || isLoading) return;

    const userMsg = {
      role: "user",
      content: text.trim() || (isHindi ? "इस डॉक्यूमेंट का विश्लेषण करें" : "Analyze this document"),
    };
    // Attach images for API (multi-file: send all supported files)
    if (pendingFiles.length > 0) {
      userMsg.images = pendingFiles.filter(f => f.isSupportedByAI).map(f => ({
        base64: f.base64,
        mimeType: f.mimeType,
        preview: f.preview
      }));
      userMsg.allFiles = pendingFiles.map((f) => ({ preview: f.preview, name: f.file.name, isPdf: f.isPdf }));
      
      const hasSupportedFiles = pendingFiles.some(f => f.isSupportedByAI);
      if (!hasSupportedFiles && !text.trim()) {
        userMsg.content = isHindi ? "मैंने कुछ दस्तावेज़ साझा किए हैं।" : "I have shared some documents.";
      }
    }

    const baseMessages = explicitMessages || messages;
    const updatedMessages = isRegen ? baseMessages : [...baseMessages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setShowBookingForm(false);
    setSuggestions([]);

    let convId = conversationId;
    if (user) convId = await ensureConversation();

    if (user && convId && !isRegen) {
      await supabase.from("chat_messages").insert({
        conversation_id: convId, role: "user", content: userMsg.content,
      });
    }

    // Upload files to Supabase Storage so CAs can view them later
    if (user && pendingFiles.length > 0) {
      for (const pending of pendingFiles) {
        try {
          const safeName = pending.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filePath = `${user.id}/chatbot/${Date.now()}_${safeName}`;
          await supabase.storage
            .from("client-uploads")
            .upload(filePath, pending.file, { cacheControl: "3600", upsert: false });
        } catch (err) {
          console.error("Failed to upload chatbot file:", err);
        }
      }
    }

    let assistantContent = "";

    try {
      // Convert our messages to Gemini format for full multimodal support
      // OPTIMIZATION: Only send the last 5 messages to save Gemini tokens
      const recentMessages = updatedMessages.slice(-5);
      
      const geminiContents = recentMessages.map((m) => {
        const parts = [];
        if (m.content) {
          parts.push({ text: m.content });
        }
        if (m.images && m.images.length > 0) {
           m.images.forEach(img => {
             const base64Data = img.base64.split(',')[1] || img.base64;
             parts.push({
               inlineData: {
                 mimeType: img.mimeType,
                 data: base64Data
               }
             });
           });
        } else if (m.image && m.image.isSupportedByAI) {
           // Fallback for any messages in state before this fix
           const base64Data = m.image.base64.split(',')[1] || m.image.base64;
           parts.push({
             inlineData: {
               mimeType: m.image.mimeType,
               data: base64Data
             }
           });
        }
        if (parts.length === 0) {
          parts.push({ text: " " });
        }
        return {
          role: m.role === "assistant" ? "model" : "user",
          parts: parts
        };
      });

      const companyContext = `
COMPANY IDENTITY:
- Name: GMR & Associates, Chartered Accountants
- Founded: 2011 | 15+ years of professional experience
- Partner: CA Gaurav Mahajan (FCA, DISA)
- Offices: Gurugram (H.No.43, SF, Sector-7, Gurugram 122001) & Delhi (AB 38, Shalimar Bagh, Delhi 110088)
- Contact: Gurugram: +91 98712 09393 | Delhi: +91 98710 84875
- Email: info@gmrindia.com | Website: gmrindia.com
- Office Hours: Monday to Saturday, 10:00 AM to 6:30 PM (Closed on Sundays & public holidays)
- Specialization: Tax advisory, GST, Company Law, Audit & Assurance, Payroll, Project Finance
- Clientele: 500+ clients including startups, SMEs, HNIs, and NRIs

KEY TAX KNOWLEDGE (FY 2025-26 / AY 2026-27):
- ITR filing deadline (non-audit individuals): 31st July 2026
- ITR filing deadline (audit cases): 31st October 2026
- Advance Tax instalments: 15 Jun (15%), 15 Sep (45%), 15 Dec (75%), 15 Mar (100%)
- Section 80C limit: ₹1.5 Lakh (PPF, ELSS, LIC, NSC, home loan principal, etc.)
- Section 80D (Health Insurance): ₹25,000 self + ₹25,000 parents (₹50,000 if senior citizen)
- New Tax Regime (default): Standard deduction ₹75,000. No 80C/80D deductions. Rebate u/s 87A up to ₹12 Lakh.
- Old Tax Regime: Standard deduction ₹50,000. All deductions available. Rebate u/s 87A up to ₹5 Lakh.
- GST Registration threshold: ₹40 Lakh goods / ₹20 Lakh services (₹10 Lakh for NE states)
- GST rates: 5%, 12%, 18%, 28%. Composition scheme: up to ₹1.5 Cr turnover.
- TDS on salary: As per applicable slab rates. Form 16 issued by employer.
`;

      const servicesContext = `
SERVICES & PRICING:
` + servicesData.map(s => `- ${s.title} (ID: ${s.id}): ₹${s.price}. ${s.shortDesc}. Duration: ${s.duration}.`).join('\n');

      const behaviorRules = `
RESPONSE RULES:
1. Be professional, warm, and concise. Use markdown formatting (bold, lists, headers) for clarity.
2. When the user asks about a service, quote the exact price and duration from SERVICES above.
3. For tax questions, cite relevant sections (e.g., "under Section 80C") and mention current limits.
4. Never fabricate information. If unsure, recommend booking a consultation with our CA.
5. Proactively suggest next steps (e.g., "Would you like me to book an appointment?" or "Shall I request this service for you?").
6. Keep responses under 250 words unless the user asks for detailed analysis.
7. For document analysis (images/PDFs), extract key financial data and provide actionable insights.
8. If the user wants to upload documents (PAN, Aadhaar, Form 16, Bank statements), tell them they can do so in the Secure Document Vault. Use the [NAVIGATE: /documents] command to take them there.
9. If the user wants to pay fees or asks about bills, tell them they can view and pay all invoices in the Invoice section. Use the [NAVIGATE: /invoices] command to take them there.
`;

      const customTrainingContext = aiTrainingData.length > 0 ? `
FIRM CUSTOM KNOWLEDGE & RULES:
${aiTrainingData.map(k => `[${k.type.toUpperCase()}] ${k.title}: ${k.content}`).join('\n')}
` : "";

      const agentToolPrompt = getToolPrompt(role || 'client');

      const staffRules = `You are the expert CA administrative assistant for GMR & Associates. You help CAs and Admins manage the platform, track clients, and optimize workflows.
${behaviorRules}
COMMANDS:
- To show the appointment booking form: output exactly [SHOW_BOOKING_FORM]
- To navigate user to a page: output exactly [NAVIGATE: /route-name].
  Available admin routes: /admin, /admin/tasks, /admin/services, /admin/team, /admin/appointments, /admin/blog, /clients, /admin/calendar, /admin/careers, /admin/chatbot-documents, /admin/job-applications, /admin/roles, /admin/testimonials, /admin/ai-insights, /admin/workload, /admin/anomalies, /analytics.
  Available client routes: /tax-calculator, /dashboard, /appointments, /services, /contact, /documents, /gst-tracker, /compliance, /blog, /team, /careers.
${agentToolPrompt}
${companyContext}
${servicesContext}
${customTrainingContext}
Language: ${lang === 'hi' ? 'Respond in Hindi (Devanagari script). Use professional Hindi.' : 'Respond in English.'}`;

      const clientRules = `You are the expert AI assistant for GMR & Associates, Chartered Accountants. You provide tax advisory, audit guidance, financial planning help, and service information.
${behaviorRules}
COMMANDS:
- To show the appointment booking form: output exactly [SHOW_BOOKING_FORM]
- To navigate user to a page: output exactly [NAVIGATE: /route-name]. Available routes: /tax-calculator, /dashboard, /appointments, /my-appointments, /resources, /services, /contact, /ai-tax-optimizer, /risk-assessment, /cash-flow-forecast, /documents, /gst-tracker, /compliance, /blog, /team, /careers, /calculators.
${agentToolPrompt}
${companyContext}
${servicesContext}
${customTrainingContext}
Language: ${lang === 'hi' ? 'Respond in Hindi (Devanagari script). Use professional Hindi.' : 'Respond in English.'}`;

      const systemPrompt = isStaff ? staffRules : clientRules;

      // ── Helper to update the last assistant message in state ─────────
      const upsertAssistant = (content) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      // ── FAQ Interception: MUST run BEFORE the API call ──────────────
      // This saves Gemini tokens for basic questions and navigation
      if (!pendingFiles.length) {
        let faqMatch = getFaqResponse(text, lang, isStaff);
        if (faqMatch) {
          await new Promise((r) => setTimeout(r, 500)); // Simulate thinking delay
          
          let navRoute = null;
          let showBooking = false;
          
          const navMatchFaq = faqMatch.match(/\[NAVIGATE:\s*(\/[a-zA-Z0-9-/]*)\]/);
          if (navMatchFaq) {
            navRoute = navMatchFaq[1];
            faqMatch = faqMatch.replace(/\[NAVIGATE:\s*\/[a-zA-Z0-9-/]*\]/g, "");
          }
          
          if (faqMatch.includes("[SHOW_BOOKING_FORM]")) {
            showBooking = true;
            faqMatch = faqMatch.replace(/\[SHOW_BOOKING_FORM\]/g, "");
          }
          
          let currentContent = "";
          const words = faqMatch.split(" ");
          
          for (let i = 0; i < words.length; i++) {
            currentContent += words[i] + " ";
            upsertAssistant(currentContent);
            await new Promise((r) => setTimeout(r, 30)); // typing effect
          }
          
          if (user && convId) {
            await supabase.from("chat_messages").insert({
              conversation_id: convId, role: "assistant", content: faqMatch,
            });
          }
          
          if (showBooking) {
            setShowBookingForm(true);
          }
          
          if (navRoute) {
            toast.success(`Navigating to ${navRoute.replace('/', '')}...`);
            setTimeout(() => navigate(navRoute), 1000);
          } else {
            setSuggestions(getSuggestions(faqMatch, lang));
          }
          setIsLoading(false);
          clearPendingFiles();
          return; // Exit early — no API call needed!
        }
      }

      // ── Gemini API Call (only if FAQ didn't match) ──────────────────
      const URL = `/api/chat`;

      const resp = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: geminiContents,
          systemInstruction: { role: "user", parts: [{ text: systemPrompt }] }
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Failed to get response from Gemini");
      }
      
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (delta) { assistantContent += delta; upsertAssistant(assistantContent); }
          } catch (e) {
            console.warn("Failed to parse Gemini SSE line:", line);
          }
        }
      }

      if (assistantContent.includes("[SHOW_BOOKING_FORM]")) {
        setShowBookingForm(true);
        assistantContent = assistantContent.replace(/\[SHOW_BOOKING_FORM\]/g, "");
        upsertAssistant(assistantContent);
      }

      // Check for navigation commands
      const navMatch = assistantContent.match(/\[NAVIGATE:\s*(\/[a-zA-Z0-9-/]*)\]/);
      if (navMatch) {
        const route = navMatch[1];
        assistantContent = assistantContent.replace(/\[NAVIGATE:\s*\/[a-zA-Z0-9-/]*\]/g, "");
        upsertAssistant(assistantContent);
        toast.success(`Navigating to ${route.replace('/', '')}...`);
        setTimeout(() => navigate(route), 1500);
      }

      // Handle [REQUEST_SERVICE:service-id] commands from Gemini (legacy)
      const reqServiceMatch = assistantContent.match(/\[REQUEST_SERVICE:([\w-]+)\]/);
      if (reqServiceMatch) {
        const svcId = reqServiceMatch[1];
        assistantContent = assistantContent.replace(/\[REQUEST_SERVICE:[\w-]+\]/g, "");
        upsertAssistant(assistantContent);
        handleRequestService(svcId);
      }

      // ── AGENTIC AI: Parse and execute tool calls ────────────────────
      const toolCalls = parseToolCalls(assistantContent);
      if (toolCalls.length > 0) {
        // Strip tool call syntax from displayed message
        const cleanContent = stripToolCalls(assistantContent);
        upsertAssistant(cleanContent);
        assistantContent = cleanContent;

        setIsExecutingTool(true);

        for (const call of toolCalls) {
          // Check if tool needs confirmation
          if (call.tool?.requiresConfirmation) {
            setPendingConfirmation({
              toolName: call.toolName,
              params: call.params,
              description: call.tool.description,
              convId,
            });
            // Don't execute yet — wait for user to confirm via the UI
            setIsExecutingTool(false);
            setIsLoading(false);
            clearPendingFiles();
            return; // Exit early, confirmation handler will resume
          }

          // Execute the tool immediately
          const toolResult = await executeTool(call.toolName, call.params, {
            userId: user?.id,
            role: role || "client",
          });

          // Feed the tool result back as a system message for the AI to summarize
          const toolResultText = `\n\n⚡ **Tool Result** (${call.toolName}):\n\`\`\`json\n${JSON.stringify(toolResult, null, 2)}\n\`\`\``;
          assistantContent += toolResultText;
          upsertAssistant(assistantContent);

          // Now make a second API call to let AI summarize the tool result naturally
          const summaryContents = [
            { role: "user", parts: [{ text: text.trim() || "Analyze this" }] },
            { role: "model", parts: [{ text: stripToolCalls(assistantContent) }] },
            { role: "user", parts: [{ text: `The tool "${call.toolName}" returned this result. Summarize it in a human-friendly, professional way using markdown formatting. Do NOT output any more tool calls. Just present the data beautifully.\n\nResult: ${JSON.stringify(toolResult)}` }] },
          ];

          try {
            const summaryResp = await fetch(`/api/chat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: summaryContents,
                systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
              }),
            });

            if (summaryResp.ok) {
              const summaryReader = summaryResp.body.getReader();
              const summaryDecoder = new TextDecoder();
              let summaryBuffer = "";
              let summaryContent = "";

              while (true) {
                const { done, value } = await summaryReader.read();
                if (done) break;
                summaryBuffer += summaryDecoder.decode(value, { stream: true });
                let newlineIdx;
                while ((newlineIdx = summaryBuffer.indexOf("\n")) !== -1) {
                  let line = summaryBuffer.slice(0, newlineIdx);
                  summaryBuffer = summaryBuffer.slice(newlineIdx + 1);
                  if (line.endsWith("\r")) line = line.slice(0, -1);
                  if (!line.startsWith("data: ")) continue;
                  const jsonStr = line.slice(6).trim();
                  if (jsonStr === "[DONE]") break;
                  try {
                    const parsed = JSON.parse(jsonStr);
                    const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (delta) {
                      summaryContent += delta;
                      upsertAssistant(summaryContent);
                    }
                  } catch { /* skip malformed */ }
                }
              }

              if (summaryContent) {
                assistantContent = summaryContent;
              }
            }
          } catch (summaryErr) {
            console.warn("Tool summary API call failed, showing raw result:", summaryErr);
          }
        }
        setIsExecutingTool(false);
      }

      // Generate smart suggestions
      setSuggestions(getSuggestions(assistantContent, lang));

      if (user && convId && assistantContent) {
        await supabase.from("chat_messages").insert({
          conversation_id: convId, role: "assistant", content: assistantContent,
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      const fallback =
        /rate limit|429/i.test(errorMsg)
          ? isHindi ? "मैं अभी उच्च ट्रैफ़िक पर हूँ। कृपया कुछ सेकंड बाद पुनः प्रयास करें।"
            : "I'm getting high traffic right now. Please try again in a few seconds."
          : `Sorry, ${errorMsg}. Please try again.`;
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
    } finally {
      setIsLoading(false);
      setIsExecutingTool(false);
      clearPendingFiles();
    }
  };

  // ── Agentic AI: Handle confirmation ──────────────────────────────
  const handleConfirmAction = async (confirmed) => {
    const conf = pendingConfirmation;
    setPendingConfirmation(null);
    if (!confirmed || !conf) return;

    setIsExecutingTool(true);
    setIsLoading(true);

    try {
      const toolResult = await executeTool(conf.toolName, conf.params, {
        userId: user?.id,
        role: role || "client",
      });

      const resultMsg = toolResult.success
        ? toolResult.message || `✅ Action completed successfully.\n\`\`\`json\n${JSON.stringify(toolResult.data, null, 2)}\n\`\`\``
        : `❌ Action failed: ${toolResult.error}`;

      setMessages(prev => [...prev, { role: "assistant", content: resultMsg }]);

      if (user && conf.convId) {
        await supabase.from("chat_messages").insert({
          conversation_id: conf.convId, role: "assistant", content: resultMsg,
        });
      }

      if (toolResult.success) {
        toast.success(isHindi ? "कार्रवाई सफल!" : "Action completed!");
      }
    } catch (err) {
      console.error("Confirmation execution error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: `❌ Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
      setIsExecutingTool(false);
    }
  };

  const clearChat = () => {
    setMessages([]); setConversationId(null); setShowBookingForm(false);
    setShowDeadlines(false); setShowTaxLookup(false); clearPendingFiles();
    setRatings({}); setSuggestions([]);
  };

  // ── Inline booking ────────────────────────────────────────────────
  const handleInlineBooking = async (formData) => {
    if (!user) { navigate("/auth"); return; }
    try {
      const { error } = await supabase.from("appointments").insert({
        user_id: user.id,
        full_name: profile?.name || user.email?.split('@')[0] || 'Client',
        email: profile?.email || user.email || '',
        phone: profile?.phone || null,
        appointment_date: new Date(`${formData.date}T${(() => { const [t, p] = formData.time.split(' '); let [h, m] = t.split(':').map(Number); if (p === 'PM' && h !== 12) h += 12; if (p === 'AM' && h === 12) h = 0; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`; })()}`).toISOString(),
        date: formData.date,
        time_slot: formData.time.replace(/\s+/g, '').replace(/(AM|PM)/, ' $1').trim(),
        meeting_type: formData.type, 
        type: formData.type === "in-person" ? "in_person" : (formData.type || "video"),
        duration_minutes: 30, 
        service_type: formData.topic || 'Tax Consultation',
        topic: formData.topic || 'Tax Consultation',
        notes: formData.notes || null, status: "pending",
      });
      if (error) throw error;
      setShowBookingForm(false);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: isHindi
          ? `✅ आपकी अपॉइंटमेंट **${formData.date}** को **${formData.time}** पर बुक हो गई है!`
          : `✅ Your appointment has been booked for **${formData.date}** at **${formData.time}**! We'll confirm shortly.`,
      }]);
      notifyStaff(
        "Chatbot Appointment Booked",
        `A client booked a ${formData.type} appointment via the Chatbot for ${formData.date} at ${formData.time}.`,
        "service_update"
      );
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: isHindi ? "❌ बुकिंग में त्रुटि हुई। कृपया पुनः प्रयास करें।" : "❌ Booking failed. Please try again.",
      }]);
    }
  };

  // ── Render markdown ───────────────────────────────────────────────
  const renderContent = (content) => {
    let cleanContent = content.replace(/\[SHOW_BOOKING_FORM\]/g, "").replace(/\[NAVIGATE:\s*\/[a-zA-Z0-9-/]*\]/g, "");
    cleanContent = cleanContent.replace(/\[(SHOW_BOOKING_FORM|NAVIGATE)[^\]]*$/, "");

    const combinedRegex = /\[(SERVICE|REQUEST_SERVICE):([\w-]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    combinedRegex.lastIndex = 0;

    while ((match = combinedRegex.exec(cleanContent)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: cleanContent.slice(lastIndex, match.index) });
      }
      parts.push({ type: match[1], id: match[2] });
      lastIndex = combinedRegex.lastIndex;
    }
    if (lastIndex < cleanContent.length) {
      parts.push({ type: 'text', content: cleanContent.slice(lastIndex) });
    }

    const mdComponents = {
      p: ({ children }) => <p className="mb-2 last:mb-0 break-words whitespace-pre-wrap">{children}</p>,
      ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
      li: ({ children }) => <li className="mb-1 break-words">{children}</li>,
      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      a: ({ children, href }) => <a href={href} className="text-blue-500 hover:underline break-all" target="_blank" rel="noopener noreferrer">{children}</a>,
    };

    if (parts.length === 1 && parts[0].type === 'text') {
      return <ReactMarkdown components={mdComponents}>{content}</ReactMarkdown>;
    }

    return parts.map((part, i) => {
      if (part.type === 'SERVICE') {
        return (
          <Button key={i} size="sm" variant="accent" className="my-1 text-xs" onClick={() => navigate(`/services/${part.id}`)}>
            {isHindi ? "सेवा देखें" : "View Service"} <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        );
      }
      if (part.type === 'REQUEST_SERVICE') {
        return (
          <Button key={i} size="sm" className="my-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all active:scale-95" onClick={() => handleRequestService(part.id)}>
            {isHindi ? "सेवा का अनुरोध करें" : "Request Service"} <CheckCircle className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        );
      }
      return part.content ? <ReactMarkdown key={i} components={mdComponents}>{part.content}</ReactMarkdown> : null;
    });
  };

  // ── Sub-components ────────────────────────────────────────────────

  const InlineBookingForm = () => {
    const [bk, setBk] = useState({ date: "", time: "", type: "video", topic: "advisory", notes: "" });
    const today = new Date();
    const dates = [];
    for (let i = 1; i <= 14 && dates.length < 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      if (d.getDay() !== 0) dates.push(d.toISOString().split("T")[0]);
    }
    const times = ["10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];
    return (
      <div className="mx-2 mb-3 p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm space-y-4 animate-in slide-in-from-bottom-2 duration-300">
        <p className="text-[13px] font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
          <Calendar className="h-4 w-4" /> Quick Book Appointment
        </p>
        <div className="flex flex-wrap gap-2">
          {dates.map((d) => (
            <button key={d} onClick={() => setBk((p) => ({ ...p, date: d }))}
              className={cn("text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all",
                bk.date === d ? "bg-black text-white dark:bg-white dark:text-black border-transparent" : "border-gray-200 dark:border-white/20 hover:border-black dark:hover:border-white text-gray-700 dark:text-gray-300")}>
              {new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </button>
          ))}
        </div>
        {bk.date && (
          <div className="flex flex-wrap gap-2 animate-in fade-in duration-200">
            {times.map((t) => (
              <button key={t} onClick={() => setBk((p) => ({ ...p, time: t }))}
                className={cn("text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all",
                  bk.time === t ? "bg-black text-white dark:bg-white dark:text-black border-transparent" : "border-gray-200 dark:border-white/20 hover:border-black dark:hover:border-white text-gray-700 dark:text-gray-300")}>
                {t}
              </button>
            ))}
          </div>
        )}
        {bk.time && (
          <div className="flex gap-2 animate-in fade-in duration-200">
            {[{ val: "video", lbl: "Video" }, { val: "phone", lbl: "Phone" }, { val: "in_person", lbl: "Office" }].map((t) => (
              <button key={t.val} onClick={() => setBk((p) => ({ ...p, type: t.val }))}
                className={cn("text-[12px] font-medium px-3.5 py-1.5 rounded-full border transition-all",
                  bk.type === t.val ? "bg-black text-white dark:bg-white dark:text-black border-transparent" : "border-gray-200 dark:border-white/20 hover:border-black dark:hover:border-white text-gray-700 dark:text-gray-300")}>
                {t.lbl}
              </button>
            ))}
          </div>
        )}
        {bk.date && bk.time && (
          <Button size="sm" className="w-full h-9 mt-2 text-[13px] rounded-xl bg-black text-white dark:bg-white dark:text-black shadow-sm gap-1.5" onClick={() => handleInlineBooking(bk)}>
            <Calendar className="h-3.5 w-3.5" /> Confirm Booking
          </Button>
        )}
      </div>
    );
  };

  const DeadlinePanel = () => (
    <div className="mx-2 mb-3 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 space-y-3 animate-in slide-in-from-bottom-2 duration-300 shadow-sm">
      <p className="text-[13px] font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
        <Bell className="h-4 w-4 text-amber-500" /> Upcoming Tax Deadlines
      </p>
      {upcomingDeadlines.length === 0 ? (
        <p className="text-[12px] text-gray-500">No deadlines in the next 60 days</p>
      ) : (
        upcomingDeadlines.map((d, i) => (
          <div key={i} className={cn("text-[12px] px-3 py-2 rounded-xl border bg-white dark:bg-[#1C1C1E] shadow-sm",
            d.daysLeft <= 15 ? "border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400" :
            d.daysLeft <= 30 ? "border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400" :
            "border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300")}>{d.text}</div>
        ))
      )}
      <Button size="sm" variant="ghost" className="w-full h-8 text-[11px] font-medium text-amber-700 dark:text-amber-400"
        onClick={() => { setShowDeadlines(false); sendMessage("Tell me more about upcoming tax deadlines and what I need to prepare"); }}>
        Ask AI for details →
      </Button>
    </div>
  );

  const TaxLookupWidget = () => {
    const [income, setIncome] = useState("");
    const [result, setResult] = useState(null);
    const calc = () => {
      const inc = Number(income);
      if (!inc || inc < 0) return;
      setResult(calculateTax(inc));
    };
    return (
      <div className="mx-2 mb-3 p-4 rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 space-y-3 animate-in slide-in-from-bottom-2 duration-300 shadow-sm">
        <p className="text-[13px] font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
          <Calculator className="h-4 w-4 text-blue-500" /> Quick Tax Lookup
        </p>
        <div className="flex gap-2">
          <input type="number" placeholder="Annual Income (₹)"
            value={income} onChange={(e) => setIncome(e.target.value)}
            className="flex-1 h-9 text-[13px] px-3 rounded-xl border border-gray-200 dark:border-white/20 bg-white dark:bg-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-blue-500/30 shadow-sm" />
          <Button size="sm" className="h-9 text-[13px] px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm" onClick={calc}>
            Calculate
          </Button>
        </div>
        {result && (
          <div className="space-y-2 animate-in fade-in duration-200 mt-2">
            <div className={cn("flex justify-between text-[12px] px-3 py-2 rounded-xl border shadow-sm",
              result.better === "old" ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : "border-gray-100 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-700 dark:text-gray-300")}>
              <span>Old Regime</span>
              <span className="font-semibold">₹{result.oldTax.toLocaleString("en-IN")}</span>
            </div>
            <div className={cn("flex justify-between text-[12px] px-3 py-2 rounded-xl border shadow-sm",
              result.better === "new" ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : "border-gray-100 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-700 dark:text-gray-300")}>
              <span>New Regime</span>
              <span className="font-semibold">₹{result.newTax.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium text-center mt-2">
              ✓ {result.better === "new" ? "New Regime saves more" : "Old Regime saves more"}
              {" — "}₹{Math.abs(result.oldTax - result.newTax).toLocaleString("en-IN")} saved
            </p>
            <Button size="sm" variant="ghost" className="w-full h-8 text-[11px] font-medium text-blue-600 dark:text-blue-400"
              onClick={() => { setShowTaxLookup(false); sendMessage(`My income is ₹${income}, give me detailed tax planning advice`); }}>
              Get detailed AI advice →
            </Button>
          </div>
        )}
      </div>
    );
  };

  const ShareModal = () => (
    <div className="mx-2 mb-3 p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 space-y-3 animate-in slide-in-from-bottom-2 duration-300 shadow-sm">
      <p className="text-[13px] font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
        <FileText className="h-4 w-4" /> Share Document with CA
      </p>
      <select className="w-full text-[13px] p-2.5 rounded-xl border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
        value={selectedReqId} onChange={(e) => setSelectedReqId(e.target.value)}>
        <option value="">Select Service</option>
        {serviceRequests.map((req) => (
          <option key={req.id} value={req.id}>{req.services?.name}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 h-9 text-[13px] rounded-xl bg-black text-white dark:bg-white dark:text-black shadow-sm" onClick={handleShareToCA} disabled={!selectedReqId || sharingLoading}>
          {sharingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share with CA"}
        </Button>
        <Button size="sm" variant="ghost" className="h-9 text-[13px] rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white" onClick={() => setShowShareModal(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const handleShareToCA = async () => {
    if (!user || !pendingFiles.length || !selectedReqId) return;
    setSharingLoading(true);
    let successCount = 0;
    try {
      for (const pending of pendingFiles) {
        const file = pending.file;
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${selectedReqId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("client-uploads")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from("client_documents").insert({
          user_id: user.id,
          service_request_id: selectedReqId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
        });
        if (dbError) throw dbError;
        successCount++;
      }
      toast.success(`${successCount} document(s) shared with CA!`);
      setShowShareModal(false);
      clearPendingFiles();
    } catch (err) {
      console.error("Share document error:", err);
      toast.error("Failed to share documents");
    } finally {
      setSharingLoading(false);
    }
  };

  const HistoryPanel = () => (
    <div className="absolute inset-0 z-20 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl flex flex-col rounded-[28px] overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-white/5">
        <button onClick={() => setShowHistory(false)} className="h-8 w-8 rounded-full flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="font-semibold text-[15px] flex-1 text-gray-900 dark:text-white">Chat History</h3>
      </div>
      <ScrollArea className="flex-1 p-4">
        {historyLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : pastConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <History className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-[13px]">No past conversations</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {pastConversations.map((conv) => (
              <button key={conv.id} onClick={() => loadConversation(conv.id)}
                className="w-full text-left px-4 py-3.5 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-white/10 bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                <p className="font-medium text-[14px] text-gray-900 dark:text-white truncate mb-1">{conv.title}</p>
                <p className="text-[11px] text-gray-500">{new Date(conv.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center justify-center w-[56px] h-[56px] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-transform duration-300",
          "bg-black text-white dark:bg-white dark:text-black hover:scale-105 active:scale-95",
          !isOpen && "animate-[pulse-ring_2s_ease-in-out_infinite]",
          isOpen && "rotate-90 scale-90 hover:scale-95"
        )}
        aria-label="Open AI Assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        {!isOpen && upcomingDeadlines.length > 0 && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white dark:border-black animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className={cn(
          "fixed bottom-[96px] right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-8rem)] flex flex-col rounded-[28px] border border-gray-200/50 dark:border-white/10 bg-white dark:bg-[#1C1C1E] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-400",
          themeClass
        )}>

          {showHistory && <HistoryPanel />}

          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center border border-gray-100 dark:border-white/10">
                <Sparkles className="h-4 w-4 text-black dark:text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white leading-tight tracking-tight">
                  GMR Assistant
                </h3>
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 relative"
                onClick={() => { setShowDeadlines(!showDeadlines); setDeadlineBadge(false); }}
                title="Tax Deadlines">
                <Calendar className="h-4 w-4" />
                {deadlineBadge && upcomingDeadlines.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />}
              </Button>
              {user && (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                  onClick={() => { setShowHistory(true); loadHistory(); }} title="History">
                  <History className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={clearChat} title="Clear Chat">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-5 bg-white dark:bg-[#1C1C1E]" ref={scrollRef}>
            {showDeadlines && <DeadlinePanel />}
            {showTaxLookup && <TaxLookupWidget />}

            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full pt-10 pb-4 space-y-6">
                <div className="w-16 h-16 rounded-[20px] bg-gray-50 dark:bg-white/5 flex items-center justify-center border border-gray-100 dark:border-white/10 shadow-sm">
                  <Sparkles className="h-8 w-8 text-black dark:text-white" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-medium text-gray-900 dark:text-white text-lg tracking-tight">How can I help you?</h4>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">Ask me about taxes, audits, or our services.</p>
                </div>
                <div className="grid gap-2 w-full mt-4">
                  {quickOptions.map((opt) => (
                    <button key={opt} onClick={() => sendMessage(opt)}
                      className="text-left text-[13px] font-medium px-4 py-3.5 rounded-[16px] border border-gray-200/60 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 hover:-translate-y-[1px] transition-all duration-300 text-gray-700 dark:text-gray-300 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-2">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col group", msg.role === "user" ? "items-end" : "items-start")}>
                    <div className={cn("max-w-[85%] rounded-[24px] px-4 py-3 text-[14px] leading-relaxed relative break-words shadow-sm",
                      msg.role === "user"
                        ? "bg-black text-white dark:bg-white dark:text-black rounded-br-[8px]"
                        : "bg-[#F5F5F7] dark:bg-[#2C2C2E] text-gray-900 dark:text-white rounded-bl-[8px]"
                    )}>
                      {msg.allFiles && (
                        <div className="flex gap-2 mb-3">
                          {msg.allFiles.map((f, fi) => (
                            <img key={fi} src={f.preview} alt={f.name} className="w-16 h-16 rounded-[14px] object-cover border border-black/10 dark:border-white/10 shadow-sm" />
                          ))}
                        </div>
                      )}
                      {msg.image?.preview && !msg.allFiles && (
                        <img src={msg.image.preview} alt="uploaded" className="w-full max-w-[200px] rounded-[14px] mb-3 shadow-sm" />
                      )}
                      {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                    </div>

                    {msg.role === "assistant" && msg.content && (
                      <div className="flex items-center gap-1 mt-1.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyMessage(msg.content, i)}
                          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                          {copiedIdx === i ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                        {i === messages.length - 1 && (
                          <button onClick={regenerateLastResponse}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        )}
                        <button onClick={() => setRatings((p) => ({ ...p, [i]: p[i] === "up" ? null : "up" }))}
                          className={cn("p-1.5 rounded-full transition-colors",
                            ratings[i] === "up" ? "text-blue-500 bg-blue-50 dark:bg-blue-500/10" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white")}>
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button onClick={() => setRatings((p) => ({ ...p, [i]: p[i] === "down" ? null : "down" }))}
                          className={cn("p-1.5 rounded-full transition-colors",
                            ratings[i] === "down" ? "text-red-500 bg-red-50 dark:bg-red-500/10" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white")}>
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex items-start">
                    <div className="bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-[24px] rounded-bl-[8px] px-5 py-4 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Agentic AI: Tool Execution Indicator */}
                {isExecutingTool && (
                  <div className="flex items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 rounded-[20px] rounded-bl-[8px] px-5 py-4 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <Zap className="h-4 w-4 text-amber-500 animate-pulse" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          {isHindi ? "कार्रवाई निष्पादित हो रही है..." : "Executing action..."}
                        </span>
                        <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Agentic AI: Confirmation Card */}
                {pendingConfirmation && (
                  <div className="flex items-start animate-in fade-in slide-in-from-bottom-3 duration-400">
                    <div className="w-full max-w-[340px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200 dark:border-blue-500/20 rounded-[20px] rounded-bl-[8px] p-5 shadow-md">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                          {isHindi ? "पुष्टि आवश्यक" : "Confirmation Required"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                        {isHindi ? "कार्रवाई:" : "Action:"} <span className="text-gray-800 dark:text-gray-200">{pendingConfirmation.toolName.replace(/_/g, " ")}</span>
                      </p>
                      {pendingConfirmation.params && Object.keys(pendingConfirmation.params).length > 0 && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-black/20 rounded-lg p-2.5 mb-3 font-mono">
                          {Object.entries(pendingConfirmation.params).map(([k, v]) => (
                            <div key={k}><span className="text-gray-400">{k}:</span> {String(v)}</div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmAction(true)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm hover:shadow-md"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {isHindi ? "पुष्टि करें" : "Confirm"}
                        </button>
                        <button
                          onClick={() => handleConfirmAction(false)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-600 dark:text-gray-300 text-xs font-semibold transition-all"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {isHindi ? "रद्द करें" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!isLoading && suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => { setSuggestions([]); sendMessage(s); }}
                        className="text-[12px] font-medium px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-all duration-200 shadow-sm">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showBookingForm && <InlineBookingForm />}
          </ScrollArea>

          <div className="p-4 bg-white dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-white/5 z-10">
            {messages.length > 0 && (
              <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-[11px] font-medium px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap shadow-sm">
                  <ImageIcon className="h-3 w-3" /> Document
                </button>
                <button onClick={() => { setShowTaxLookup(!showTaxLookup); setShowDeadlines(false); }}
                  className="flex items-center gap-1.5 text-[11px] font-medium px-3.5 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors whitespace-nowrap shadow-sm">
                  <Search className="h-3 w-3" /> Tax Lookup
                </button>
              </div>
            )}

            {pendingFiles.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="relative flex-shrink-0 group">
                    {f.isPdf || !f.preview ? (
                      <div className="w-14 h-14 rounded-[14px] bg-gray-100 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-white/10 shadow-sm">
                        <FileText className="h-6 w-6 text-gray-500" />
                      </div>
                    ) : (
                      <img src={f.preview} alt={f.file.name} className="w-14 h-14 rounded-[14px] object-cover border border-gray-200 dark:border-white/10 shadow-sm" />
                    )}
                    <button onClick={() => removeFile(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {user && serviceRequests.length > 0 && !showShareModal && (
                  <Button size="sm" variant="outline" className="h-14 rounded-[14px] text-[11px] px-3 border-dashed" onClick={() => setShowShareModal(true)}>
                    Send to CA
                  </Button>
                )}
              </div>
            )}
            
            {showShareModal && pendingFiles.length > 0 && <ShareModal />}

            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="relative flex items-end gap-2 bg-[#F5F5F7] dark:bg-[#2C2C2E] p-1.5 rounded-[28px] border border-gray-200/50 dark:border-white/5 transition-colors focus-within:border-gray-300 dark:focus-within:border-white/20 focus-within:bg-white dark:focus-within:bg-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <input ref={fileInputRef} type="file" accept="*/*" className="hidden" onChange={handleFileSelect} multiple />
              
              <button type="button" className="h-[44px] w-[44px] flex shrink-0 items-center justify-center rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                onClick={() => fileInputRef.current?.click()} disabled={isLoading || pendingFiles.length >= 3}>
                <Paperclip className="h-5 w-5" />
              </button>
              
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 max-h-32 min-h-[44px] py-3 px-1 bg-transparent text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none" 
                disabled={isLoading} 
              />
              
              <button type="button" 
                className={cn("h-[44px] w-[44px] shrink-0 flex items-center justify-center rounded-full transition-colors", 
                  isListening ? "text-red-500 bg-red-50 dark:bg-red-500/10 animate-pulse" : "text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10")}
                onClick={isListening ? stopListening : startListening} disabled={isLoading}>
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              
              <button type="submit" 
                className="h-[44px] w-[44px] shrink-0 flex items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-sm"
                disabled={isLoading || (!input.trim() && !pendingFiles.length)}>
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
            
            {!user && (
              <p className="text-[11px] text-gray-400 mt-3 mb-1 text-center font-medium">
                <button onClick={() => navigate("/auth")} className="text-gray-900 dark:text-white hover:underline">Sign in</button> to save chat history
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}