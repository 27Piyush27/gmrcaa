import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare, X, Send, Trash2, ArrowRight, Mic, MicOff,
  Image as ImageIcon, Globe, Calendar, Calculator, Bell, Sparkles,
  Loader2, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown,
  Moon, Sun, History, ChevronLeft, Search, FileText, Paperclip, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { servicesData } from "@/lib/servicesData";
import { resolveServiceIdForDb } from "@/lib/serviceIdResolver";
import { notifyStaff } from "@/lib/notifications";

// ── constants ──────────────────────────────────────────────────────────
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ca-chatbot`;
const SUPABASE_CLIENT_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    reader.onload = () => resolve(reader.result.split(",")[1]);
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
  const [lang, setLang] = useState("en");
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
      setInput(Array.from(e.results).map((r) => r[0].transcript).join(""));
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
    // Remove last assistant message
    setMessages((prev) => {
      const idx = prev.length - 1;
      if (prev[idx]?.role === "assistant") return prev.slice(0, idx);
      return prev;
    });
    setTimeout(() => sendMessage(lastUserMsg.content, true), 100);
  };

  // ── Send message ──────────────────────────────────────────────────
  const sendMessage = async (text, isRegen = false) => {
    if ((!text.trim() && !pendingFiles.length) || isLoading) return;

    const userMsg = {
      role: "user",
      content: text.trim() || (isHindi ? "इस डॉक्यूमेंट का विश्लेषण करें" : "Analyze this document"),
    };
    // Attach first image for API (multi-file: send first image, show all in UI)
    if (pendingFiles.length > 0) {
      userMsg.image = {
        base64: pendingFiles[0].base64,
        mimeType: pendingFiles[0].mimeType,
        preview: pendingFiles[0].preview,
        isSupportedByAI: pendingFiles[0].isSupportedByAI
      };
      userMsg.allFiles = pendingFiles.map((f) => ({ preview: f.preview, name: f.file.name, isPdf: f.isPdf }));
      
      const hasSupportedFiles = pendingFiles.some(f => f.isSupportedByAI);
      if (!hasSupportedFiles && !text.trim()) {
        userMsg.content = isHindi ? "मैंने कुछ दस्तावेज़ साझा किए हैं।" : "I have shared some documents.";
      }
    }

    const updatedMessages = isRegen ? [...messages, userMsg] : [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setShowBookingForm(false);
    setSuggestions([]);

    let convId = conversationId;
    if (user) convId = await ensureConversation();

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
      const geminiContents = updatedMessages.map((m) => {
        const parts = [];
        if (m.content) {
          parts.push({ text: m.content });
        }
        if (m.image && m.image.isSupportedByAI) {
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

      const systemPrompt = isStaff 
        ? `You are an expert CA administrative assistant for GMR & Associates. You help CAs and Admins manage their platform, clients, and workflow. Use markdown for formatting. If the user wants to navigate to an admin feature or tool on the website, output EXACTLY [NAVIGATE: /route-name] in your response. Available admin routes: /admin, /admin/tasks, /admin/services, /admin/team, /admin/appointments, /admin/blog. Current language constraint: ${lang === 'hi' ? 'Respond in Hindi.' : 'Respond in English.'}`
        : `You are an expert Chartered Accountant AI for GMR & Associates. You provide tax, audit, and financial advice. Use markdown for formatting. If the user asks for a service, output exactly [SHOW_BOOKING_FORM] in your response. If the user wants to navigate to a feature or tool on the website, output EXACTLY [NAVIGATE: /route-name] in your response. Available routes: /tax-calculator, /dashboard, /appointments, /resources, /services, /contact, /ai-tax-optimizer, /risk-assessment, /cash-flow-forecast. If the user explicitly asks to purchase or request a specific service offered by us, output exactly [REQUEST_SERVICE:service-id] where service-id is one of: income-tax-filing, gst-registration, gst-return-filing, company-incorporation, audit-assurance, compliance-services, tds-compliance, payroll-management, project-finance. Current language constraint: ${lang === 'hi' ? 'Respond in Hindi.' : 'Respond in English.'}`;

      // Fallback for Vercel deployment if env var is not set in Vercel dashboard
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyAZh5GmMwuw6nPJ8BkrxRRE5zGOg6PTlj0";
      if (!GEMINI_KEY) throw new Error("Gemini API key is not configured");

      const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`;

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

      const upsertAssistant = (content) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: "assistant", content }];
        });
      };

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
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }

      if (assistantContent.includes("[SHOW_BOOKING_FORM]")) {
        setShowBookingForm(true);
        assistantContent = assistantContent.replace(/\[SHOW_BOOKING_FORM\]/g, "");
        upsertAssistant(assistantContent);
      }

      // Check for navigation commands
      const navMatch = assistantContent.match(/\[NAVIGATE:\s*(\/[a-zA-Z0-9-]+)\]/);
      if (navMatch) {
        const route = navMatch[1];
        assistantContent = assistantContent.replace(/\[NAVIGATE:\s*\/[a-zA-Z0-9-]+\]/g, "");
        upsertAssistant(assistantContent);
        toast.success(`Navigating to ${route.replace('/', '')}...`);
        setTimeout(() => navigate(route), 1500); // 1.5s delay so user can read message
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
      clearPendingFiles();
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
        appointment_date: new Date(`${formData.date}T${(() => { const [t, p] = formData.time.split(' '); let [h, m] = t.split(':').map(Number); if (p === 'PM' && h !== 12) h += 12; if (p === 'AM' && h === 12) h = 0; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`; })()}`).toISOString(),
        time_slot: formData.time.replace(/\s+/g, '').replace(/(AM|PM)/, ' $1').trim(),
        meeting_type: formData.type, duration_minutes: 30, service_type: formData.topic || 'Tax Consultation',
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
        "appointment"
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
    const combinedRegex = /\[(SERVICE|REQUEST_SERVICE):([\w-]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    combinedRegex.lastIndex = 0;

    while ((match = combinedRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      parts.push({ type: match[1], id: match[2] });
      lastIndex = combinedRegex.lastIndex;
    }
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
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
      <div className="mx-2 p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />{isHindi ? "त्वरित अपॉइंटमेंट बुक करें" : "Quick Book Appointment"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {dates.map((d) => (
            <button key={d} onClick={() => setBk((p) => ({ ...p, date: d }))}
              className={cn("text-[10px] px-2 py-1 rounded-lg border transition-all",
                bk.date === d ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:border-primary/40")}>{new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</button>
          ))}
        </div>
        {bk.date && <div className="flex flex-wrap gap-1.5 animate-in fade-in duration-200">
          {times.map((t) => (
            <button key={t} onClick={() => setBk((p) => ({ ...p, time: t }))}
              className={cn("text-[10px] px-2 py-1 rounded-lg border transition-all",
                bk.time === t ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:border-primary/40")}>{t}</button>
          ))}
        </div>}
        {bk.time && <div className="flex gap-1.5 animate-in fade-in duration-200">
          {[{ val: "video", lbl: "Video" }, { val: "phone", lbl: isHindi ? "फ़ोन" : "Phone" }, { val: "in_person", lbl: isHindi ? "ऑफ़िस" : "Office" }].map((t) => (
            <button key={t.val} onClick={() => setBk((p) => ({ ...p, type: t.val }))}
              className={cn("text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                bk.type === t.val ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:border-primary/40")}>{t.lbl}</button>
          ))}
        </div>}
        {bk.date && bk.time && <Button size="sm" className="w-full h-8 text-xs rounded-lg gap-1.5" onClick={() => handleInlineBooking(bk)}>
          <Calendar className="h-3 w-3" />{isHindi ? "बुक करें" : "Confirm Booking"}
        </Button>}
      </div>
    );
  };

  const DeadlinePanel = () => (
    <div className="mx-2 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2 animate-in slide-in-from-bottom-2 duration-300">
      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Bell className="h-3.5 w-3.5 text-amber-500" />{isHindi ? "आगामी कर समयसीमाएँ" : "Upcoming Tax Deadlines"}
      </p>
      {upcomingDeadlines.length === 0
        ? <p className="text-[11px] text-muted-foreground">{isHindi ? "अगले 60 दिनों में कोई समयसीमा नहीं" : "No deadlines in the next 60 days"}</p>
        : upcomingDeadlines.map((d, i) => (
          <div key={i} className={cn("text-[11px] px-2.5 py-1.5 rounded-lg border",
            d.daysLeft <= 15 ? "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400" :
            d.daysLeft <= 30 ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400" :
            "border-border/50 text-muted-foreground")}>{d.text}</div>
        ))}
      <Button size="sm" variant="ghost" className="w-full h-7 text-[10px]"
        onClick={() => { setShowDeadlines(false); sendMessage(isHindi ? "मुझे कर समयसीमाओं के बारे में विस्तार से बताएं" : "Tell me more about upcoming tax deadlines and what I need to prepare"); }}>
        {isHindi ? "AI से और जानें →" : "Ask AI for details →"}
      </Button>
    </div>
  );

  // ── Tax Lookup Widget ─────────────────────────────────────────────
  const TaxLookupWidget = () => {
    const [income, setIncome] = useState("");
    const [result, setResult] = useState(null);
    const calc = () => {
      const inc = Number(income);
      if (!inc || inc < 0) return;
      setResult(calculateTax(inc));
    };
    return (
      <div className="mx-2 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Calculator className="h-3.5 w-3.5 text-blue-500" />{isHindi ? "त्वरित टैक्स लुकअप" : "Quick Tax Lookup"}
        </p>
        <div className="flex gap-2">
          <input type="number" placeholder={isHindi ? "वार्षिक आय (₹)" : "Annual Income (₹)"}
            value={income} onChange={(e) => setIncome(e.target.value)}
            className="flex-1 h-8 text-xs px-3 rounded-lg border border-border/50 bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
          <Button size="sm" className="h-8 text-xs px-3 rounded-lg" onClick={calc}>
            {isHindi ? "गणना" : "Calculate"}
          </Button>
        </div>
        {result && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            <div className={cn("flex justify-between text-[11px] px-2.5 py-1.5 rounded-lg border",
              result.better === "old" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50")}>
              <span>{isHindi ? "पुरानी व्यवस्था" : "Old Regime"}</span>
              <span className="font-semibold">₹{result.oldTax.toLocaleString("en-IN")}</span>
            </div>
            <div className={cn("flex justify-between text-[11px] px-2.5 py-1.5 rounded-lg border",
              result.better === "new" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50")}>
              <span>{isHindi ? "नई व्यवस्था" : "New Regime"}</span>
              <span className="font-semibold">₹{result.newTax.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium text-center">
              ✓ {result.better === "new" ? (isHindi ? "नई व्यवस्था बेहतर" : "New Regime saves more") : (isHindi ? "पुरानी व्यवस्था बेहतर" : "Old Regime saves more")}
              {" — "}₹{Math.abs(result.oldTax - result.newTax).toLocaleString("en-IN")} {isHindi ? "बचत" : "saved"}
            </p>
            <Button size="sm" variant="ghost" className="w-full h-7 text-[10px]"
              onClick={() => { setShowTaxLookup(false); sendMessage(isHindi ? `मेरी आय ₹${income} है, विस्तृत टैक्स प्लानिंग बताएं` : `My income is ₹${income}, give me detailed tax planning advice`); }}>
              {isHindi ? "AI से विस्तृत सलाह लें →" : "Get detailed AI advice →"}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const ShareModal = () => (
    <div className="mx-2 p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5 text-primary" />
        {isHindi ? "CA को दस्तावेज़ भेजें" : "Share Document with CA"}
      </p>
      <select className="w-full text-xs p-1.5 rounded-md border border-border/50 bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
        value={selectedReqId} onChange={(e) => setSelectedReqId(e.target.value)}>
        <option value="">{isHindi ? "सेवा चुनें" : "Select Service"}</option>
        {serviceRequests.map((req) => (
          <option key={req.id} value={req.id}>{req.services?.name}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleShareToCA} disabled={!selectedReqId || sharingLoading}>
          {sharingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : (isHindi ? "शेयर करें" : "Share with CA")}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowShareModal(false)}>
          {isHindi ? "रद्द करें" : "Cancel"}
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
      toast.success(isHindi ? `${successCount} दस्तावेज़ CA को भेजे गए` : `${successCount} document(s) shared with CA!`);
      setShowShareModal(false);
      clearPendingFiles();
    } catch (err) {
      console.error("Share document error:", err);
      toast.error(isHindi ? "दस्तावेज़ शेयर करने में त्रुटि" : "Failed to share documents");
    } finally {
      setSharingLoading(false);
    }
  };

  // ── Chat History Panel ────────────────────────────────────────────
  const HistoryPanel = () => (
    <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm flex flex-col rounded-3xl overflow-hidden animate-in slide-in-from-left-4 duration-200">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
        <h3 className="font-semibold text-sm flex-1">{isHindi ? "चैट इतिहास" : "Chat History"}</h3>
      </div>
      <ScrollArea className="flex-1 p-3">
        {historyLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : pastConversations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">{isHindi ? "कोई पिछली चैट नहीं" : "No past conversations"}</p>
        ) : (
          <div className="space-y-1.5">
            {pastConversations.map((conv) => (
              <button key={conv.id} onClick={() => loadConversation(conv.id)}
                className="w-full text-left px-3 py-2.5 rounded-xl border border-border/50 hover:bg-secondary/50 hover:border-foreground/10 transition-all text-xs space-y-0.5">
                <p className="font-medium text-foreground truncate">{conv.title}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(conv.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════
  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-hero transition-all duration-300 hover:scale-110",
          "bg-primary text-primary-foreground",
          !isOpen && "animate-[pulse-ring_2s_ease-in-out_infinite]",
          isOpen && "rotate-90"
        )}
        aria-label="Open AI Assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {!isOpen && upcomingDeadlines.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-background animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] flex flex-col rounded-3xl border border-border/50 glass-frosted shadow-hero overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300",
          themeClass
        )}>

          {/* History overlay */}
          {showHistory && <HistoryPanel />}

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground leading-none">
                  {isHindi ? "GMR AI सहायक" : "GMR AI Assistant"}
                </h3>
                <span className="text-[9px] text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  {isHindi ? "ऑनलाइन" : "Online"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" title={isHindi ? "Switch to English" : "हिंदी में बदलें"}
                onClick={() => setLang(lang === "en" ? "hi" : "en")}>
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              {/* Theme toggle */}
              <Button variant="ghost" size="icon" className="h-7 w-7"
                title={chatTheme === "dark" ? "Light mode" : "Dark mode"}
                onClick={() => setChatTheme((t) => t === "dark" ? "light" : "dark")}>
                {chatTheme === "dark" ? <Sun className="h-3.5 w-3.5 text-muted-foreground" /> : <Moon className="h-3.5 w-3.5 text-muted-foreground" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 relative"
                onClick={() => { setShowDeadlines(!showDeadlines); setDeadlineBadge(false); }}
                title={isHindi ? "कर समयसीमाएँ" : "Tax Deadlines"}>
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                {deadlineBadge && upcomingDeadlines.length > 0 && <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-500" />}
              </Button>
              {/* History */}
              {user && <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => { setShowHistory(true); loadHistory(); }} title={isHindi ? "इतिहास" : "History"}>
                <History className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearChat}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/50 overflow-x-auto scrollbar-hide">
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border border-border/60 bg-secondary/40 hover:bg-secondary transition-colors whitespace-nowrap text-muted-foreground hover:text-foreground">
              <ImageIcon className="h-3 w-3" /> {isHindi ? "डॉक्यूमेंट" : "Document"}
            </button>
            <button onClick={() => sendMessage(isHindi ? "मेरा टैक्स कैलकुलेट करो" : "Calculate my tax")}
              className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border border-border/60 bg-secondary/40 hover:bg-secondary transition-colors whitespace-nowrap text-muted-foreground hover:text-foreground">
              <Calculator className="h-3 w-3" /> {isHindi ? "टैक्स गणना" : "Tax Calc"}
            </button>
            <button onClick={() => { setShowTaxLookup(!showTaxLookup); setShowDeadlines(false); }}
              className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-colors whitespace-nowrap text-blue-600 dark:text-blue-400 hover:text-blue-700">
              <Search className="h-3 w-3" /> {isHindi ? "टैक्स लुकअप" : "Tax Lookup"}
            </button>
            <button onClick={() => sendMessage(isHindi ? "मुझे अपॉइंटमेंट बुक करनी है" : "I want to book an appointment")}
              className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border border-border/60 bg-secondary/40 hover:bg-secondary transition-colors whitespace-nowrap text-muted-foreground hover:text-foreground">
              <Calendar className="h-3 w-3" /> {isHindi ? "बुकिंग" : "Book"}
            </button>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap">
              {isHindi ? "हिंदी" : "EN"}
            </span>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {showDeadlines && <DeadlinePanel />}
            {showTaxLookup && <TaxLookupWidget />}

            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {isHindi ? "👋 नमस्ते! मैं आपका CA सहायक हूँ। मैं कैसे मदद कर सकता हूँ?" : "👋 Hello! I'm your CA assistant. How can I help you today?"}
                </p>
                <div className="grid gap-2">
                  {quickOptions.map((opt) => (
                    <button key={opt} onClick={() => sendMessage(opt)}
                      className="text-left text-xs px-3.5 py-2.5 rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary hover:border-foreground/20 hover:scale-[1.02] transition-all duration-200 text-foreground">{opt}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                    <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm relative group break-words overflow-x-hidden",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md"
                    )}>
                      {/* Bot avatar for assistant */}
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center">
                            <Sparkles className="h-2.5 w-2.5 text-primary" />
                          </div>
                          <span className="text-[9px] font-medium text-muted-foreground">GMR AI</span>
                        </div>
                      )}
                      {/* Multi-file thumbnails */}
                      {msg.allFiles && (
                        <div className="flex gap-1.5 mb-2">
                          {msg.allFiles.map((f, fi) => (
                            <img key={fi} src={f.preview} alt={f.name} className="w-12 h-12 rounded-lg object-cover border border-white/20" />
                          ))}
                        </div>
                      )}
                      {msg.image?.preview && !msg.allFiles && (
                        <img src={msg.image.preview} alt="uploaded" className="w-full max-w-[200px] rounded-lg mb-2" />
                      )}
                      {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                    </div>

                    {/* Message actions for assistant */}
                    {msg.role === "assistant" && msg.content && (
                      <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Copy */}
                        <button onClick={() => copyMessage(msg.content, i)}
                          className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title={isHindi ? "कॉपी करें" : "Copy"}>
                          {copiedIdx === i ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                        {/* Regenerate (only on last assistant msg) */}
                        {i === messages.length - 1 && (
                          <button onClick={regenerateLastResponse}
                            className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            title={isHindi ? "पुनः उत्तर दें" : "Regenerate"}>
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        )}
                        {/* Rating */}
                        <button onClick={() => setRatings((p) => ({ ...p, [i]: p[i] === "up" ? null : "up" }))}
                          className={cn("p-1 rounded-md hover:bg-secondary transition-colors",
                            ratings[i] === "up" ? "text-emerald-500" : "text-muted-foreground hover:text-foreground")}
                          title={isHindi ? "अच्छा" : "Good response"}>
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button onClick={() => setRatings((p) => ({ ...p, [i]: p[i] === "down" ? null : "down" }))}
                          className={cn("p-1 rounded-md hover:bg-secondary transition-colors",
                            ratings[i] === "down" ? "text-red-500" : "text-muted-foreground hover:text-foreground")}
                          title={isHindi ? "बुरा" : "Poor response"}>
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Premium typing indicator */}
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                    </div>
                    <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground italic animate-pulse">
                          {isHindi ? "GMR AI सोच रहा है..." : "GMR AI is thinking..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Smart suggestions */}
                {!isLoading && suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => { setSuggestions([]); sendMessage(s); }}
                        className="text-[10px] px-2.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:border-primary/40 transition-all duration-200">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showBookingForm && <InlineBookingForm />}
          </ScrollArea>

          {/* Pending file previews */}
          {pendingFiles.length > 0 && (
            <div className="px-3 py-2 border-t border-border/50 flex flex-col gap-2 bg-secondary/30">
              <div className="flex items-center gap-2 overflow-x-auto">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    {f.isPdf || !f.preview ? (
                      <div className="w-10 h-10 rounded-lg border border-border bg-red-500/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-red-500" />
                      </div>
                    ) : (
                      <img src={f.preview} alt={f.file.name} className="w-10 h-10 rounded-lg object-cover border border-border" />
                    )}
                    <button onClick={() => removeFile(i)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[8px]">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{pendingFiles.length}/3</span>
              </div>
              {user && serviceRequests.length > 0 && !showShareModal && (
                <div className="flex items-center">
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setShowShareModal(true)}>
                    {isHindi ? "दस्तावेज़ CA के साथ साझा करें" : "Share to CA Vault"}
                  </Button>
                </div>
              )}
              {showShareModal && <ShareModal />}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
              <input ref={fileInputRef} type="file" accept="*/*" className="hidden" onChange={handleFileSelect} multiple />
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0"
                onClick={() => fileInputRef.current?.click()} disabled={isLoading || pendingFiles.length >= 3}>
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Input value={input} onChange={(e) => setInput(e.target.value)}
                placeholder={isHindi ? "CA सेवाओं के बारे में पूछें..." : "Ask about our CA services..."}
                className="text-sm h-9" disabled={isLoading} />
              <Button type="button" variant="ghost" size="icon"
                className={cn("h-9 w-9 shrink-0", isListening && "text-red-500 animate-pulse")}
                onClick={isListening ? stopListening : startListening} disabled={isLoading}>
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0"
                disabled={isLoading || (!input.trim() && !pendingFiles.length)}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {!user && (
              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                <button onClick={() => navigate("/auth")} className="underline hover:text-foreground">{isHindi ? "साइन इन करें" : "Sign in"}</button>{" "}
                {isHindi ? "चैट इतिहास सहेजने के लिए" : "to save chat history & access all features"}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}