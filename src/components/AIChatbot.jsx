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

// ── FAQ Interception Mapping ───────────────────────────────────────────
const FAQ_RESPONSES = {
  en: [
    {
      keywords: ["office hours", "timing", "open", "working hours", "when do you open"],
      response: "Our office is open from **Monday to Saturday, 10:00 AM to 6:30 PM**. We are closed on Sundays and public holidays."
    },
    {
      keywords: ["address", "location", "where are you", "office address", "visit"],
      response: "We have two offices:\n\n📍 **Gurugram**: H.No.43, SF, Sector-7, Gurugram\n📍 **Delhi**: AB 38, Shalimar Bagh, Delhi\n\nYou can visit us during our office hours or book an appointment online."
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
      response: "We offer a wide range of services including:\n\n- Income Tax Return (ITR) Filing\n- GST Registration & Filing\n- Company Incorporation\n- Audit & Assurance\n- Payroll & TDS Compliance\n\nYou can explore all our services [here](/services)."
    }
  ],
  hi: [
    {
      keywords: ["ऑफिस का समय", "खुलने का समय", "टाइमिंग", "काम करने का समय"],
      response: "हमारा कार्यालय **सोमवार से शनिवार सुबह 10:00 बजे से शाम 6:30 बजे** तक खुला रहता है। रविवार और सार्वजनिक अवकाश को बंद रहता है।"
    },
    {
      keywords: ["पता", "लोकेशन", "कहाँ हैं", "ऑफिस एड्रेस"],
      response: "हमारे दो कार्यालय हैं:\n\n📍 **गुरुग्राम**: H.No.43, SF, Sector-7, Gurugram\n📍 **दिल्ली**: AB 38, Shalimar Bagh, Delhi\n\nआप हमसे मिल सकते हैं या अपॉइंटमेंट बुक कर सकते हैं।"
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
      response: "हम विभिन्न सेवाएं प्रदान करते हैं जिनमें शामिल हैं:\n\n- इनकम टैक्स रिटर्न (ITR) फाइलिंग\n- GST रजिस्ट्रेशन और फाइलिंग\n- कंपनी निगमन\n- ऑडिट\n- पेरोल और TDS अनुपालन\n\nआप हमारी सभी सेवाएं [यहाँ](/services) देख सकते हैं।"
    }
  ],
  navigation_staff: [
    { keywords: ["dashboard", "home", "admin panel"], response: "Taking you to the Admin Dashboard now. [NAVIGATE: /admin]" },
    { keywords: ["tasks", "my tasks", "todo", "service requests"], response: "Opening your Tasks and Service Requests. [NAVIGATE: /admin/tasks]" },
    { keywords: ["services manage", "edit services"], response: "Taking you to Service Management. [NAVIGATE: /admin/services]" },
    { keywords: ["team", "staff", "users"], response: "Navigating to Team Management. [NAVIGATE: /admin/team]" },
    { keywords: ["appointments", "meetings", "calendar"], response: "Opening the Appointments calendar. [NAVIGATE: /admin/appointments]" },
    { keywords: ["blog", "posts", "articles"], response: "Taking you to the Blog Editor. [NAVIGATE: /admin/blog]" }
  ],
  navigation_client: [
    { keywords: ["dashboard", "my profile", "my account"], response: "Taking you to your Client Dashboard. [NAVIGATE: /dashboard]" },
    { keywords: ["appointments", "meetings", "book appointment", "schedule"], response: "Navigating to Appointments. [NAVIGATE: /appointments]" },
    { keywords: ["services", "all services", "offerings"], response: "Taking you to our Services page. [NAVIGATE: /services]" },
    { keywords: ["contact", "support", "help"], response: "Taking you to the Contact Support page. [NAVIGATE: /contact]" },
    { keywords: ["resources", "documents", "downloads"], response: "Opening the Resources section. [NAVIGATE: /resources]" },
    { keywords: ["tax calculator", "calculate tax"], response: "Taking you to the Tax Calculator. [NAVIGATE: /tax-calculator]" },
    { keywords: ["tax optimizer", "ai tax optimizer"], response: "Navigating to the AI Tax Optimizer. [NAVIGATE: /ai-tax-optimizer]" },
    { keywords: ["risk assessment", "audit risk"], response: "Taking you to Risk Assessment. [NAVIGATE: /risk-assessment]" },
    { keywords: ["cash flow", "forecast"], response: "Opening the Cash Flow Forecast tool. [NAVIGATE: /cash-flow-forecast]" },
    { keywords: ["home", "main page"], response: "Taking you to the Home page. [NAVIGATE: /]" }
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

      const systemPrompt = isStaff 
        ? `You are an expert CA administrative assistant for GMR & Associates. You help CAs and Admins manage their platform, clients, and workflow. Use markdown for formatting. If the user wants to navigate to an admin feature or tool on the website, output EXACTLY [NAVIGATE: /route-name] in your response. Available admin routes: /admin, /admin/tasks, /admin/services, /admin/team, /admin/appointments, /admin/blog. Current language constraint: ${lang === 'hi' ? 'Respond in Hindi.' : 'Respond in English.'}`
        : `You are an expert Chartered Accountant AI for GMR & Associates. You provide tax, audit, and financial advice. Use markdown for formatting. If the user asks for a service, output exactly [SHOW_BOOKING_FORM] in your response. If the user wants to navigate to a feature or tool on the website, output EXACTLY [NAVIGATE: /route-name] in your response. Available routes: /tax-calculator, /dashboard, /appointments, /resources, /services, /contact, /ai-tax-optimizer, /risk-assessment, /cash-flow-forecast. If the user explicitly asks to purchase or request a specific service offered by us, output exactly [REQUEST_SERVICE:service-id] where service-id is one of: income-tax-filing, gst-registration, gst-return-filing, company-incorporation, audit-assurance, compliance-services, tds-compliance, payroll-management, project-finance. Current language constraint: ${lang === 'hi' ? 'Respond in Hindi.' : 'Respond in English.'}`;

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

      const upsertAssistant = (content) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      // FAQ Interception: Save Gemini tokens for basic questions and navigation
      if (!pendingFiles.length) {
        let faqMatch = getFaqResponse(text, lang, isStaff);
        if (faqMatch) {
          await new Promise((r) => setTimeout(r, 500)); // Simulate thinking delay
          
          let navRoute = null;
          const navMatch = faqMatch.match(/\[NAVIGATE:\s*(\/[a-zA-Z0-9-\/]*)\]/);
          if (navMatch) {
            navRoute = navMatch[1];
            faqMatch = faqMatch.replace(/\[NAVIGATE:\s*\/[a-zA-Z0-9-\/]*\]/g, "");
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
          
          if (navRoute) {
            toast.success(`Navigating to ${navRoute.replace('/', '')}...`);
            setTimeout(() => navigate(navRoute), 1000);
          } else {
            setSuggestions(getSuggestions(faqMatch, lang));
          }
          setIsLoading(false);
          return; // Exit early to skip the API call
        }
      }

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
      const navMatch = assistantContent.match(/\[NAVIGATE:\s*(\/[a-zA-Z0-9-\/]*)\]/);
      if (navMatch) {
        const route = navMatch[1];
        assistantContent = assistantContent.replace(/\[NAVIGATE:\s*\/[a-zA-Z0-9-\/]*\]/g, "");
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
                  {(isStaff ? STAFF_QUICK_OPTIONS_EN : QUICK_OPTIONS_EN).map((opt) => (
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
                  <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                    <div className={cn("max-w-[85%] rounded-[24px] px-4 py-3 text-[14px] leading-relaxed relative group break-words shadow-sm",
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