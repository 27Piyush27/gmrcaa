import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  FileText, Upload, Brain, CheckCircle, AlertTriangle, X, Sparkles,
  ArrowRight, Shield, Eye, EyeOff, Loader2, FileSearch, Clock, Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  extractTextFromFile,
  classifyFromContent,
  extractFieldsFromText,
} from "@/lib/extractText";

const easing = [0.22, 1, 0.36, 1];

// ── Document type metadata ─────────────────────────────────────────────────
const DOC_TYPES = {
  form16: { name: "Form 16", icon: "📋", color: "bg-blue-500", category: "Income" },
  bankStatement: { name: "Bank Statement", icon: "🏦", color: "bg-emerald-500", category: "Financial" },
  invoice: { name: "Invoice / Bill", icon: "🧾", color: "bg-amber-500", category: "Expense" },
  panCard: { name: "PAN Card", icon: "🪪", color: "bg-violet-500", category: "Identity" },
  aadhaar: { name: "Aadhaar Card", icon: "🆔", color: "bg-indigo-500", category: "Identity" },
  gstReturn: { name: "GST Return", icon: "📊", color: "bg-cyan-500", category: "Tax Filing" },
  itr: { name: "ITR Acknowledgment", icon: "✅", color: "bg-green-500", category: "Tax Filing" },
  salarySlip: { name: "Salary Slip", icon: "💰", color: "bg-pink-500", category: "Income" },
  rentReceipt: { name: "Rent Receipt", icon: "🏠", color: "bg-orange-500", category: "Deduction" },
  investmentProof: { name: "Investment Proof", icon: "📈", color: "bg-teal-500", category: "Deduction" },
};

// ── Required Documents Checklist ────────────────────────────────────────────
const ITR_CHECKLIST = [
  { name: "PAN Card", key: "panCard", required: true },
  { name: "Aadhaar Card", key: "aadhaar", required: true },
  { name: "Form 16 / Salary Slips", key: "form16", alt: "salarySlip", required: true },
  { name: "Bank Statements", key: "bankStatement", required: true },
  { name: "Investment Proofs (80C)", key: "investmentProof", required: false },
  { name: "Rent Receipts (HRA)", key: "rentReceipt", required: false },
  { name: "GST Returns (if applicable)", key: "gstReturn", required: false },
  { name: "Previous Year ITR", key: "itr", required: false },
];

// ── Component ───────────────────────────────────────────────────────────────
export default function SmartDocAnalyzer() {
  const [docs, setDocs] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [expandedText, setExpandedText] = useState({}); // { docId: true/false }
  const fileInputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    const id = Date.now() + Math.random();
    const newDoc = { id, file, name: file.name, size: file.size, docType: null, status: "analyzing", extractedData: {}, rawText: "", confidence: 0, stage: "Initializing AI engine..." };
    setDocs(prev => [...prev, newDoc]);

    // Stage 1: Extracting text
    setDocs(prev => prev.map(d => d.id === id ? { ...d, stage: "Extracting text from document..." } : d));

    let rawText = "";
    try {
      rawText = await extractTextFromFile(file);
    } catch (err) {
      console.error("[SmartDocAnalyzer] Text extraction failed:", err);
      rawText = `[Error extracting text from ${file.name}]`;
    }

    // Stage 2: Classifying
    setDocs(prev => prev.map(d => d.id === id ? { ...d, stage: "Classifying document type...", rawText } : d));
    await delay(400);

    const classification = classifyFromContent(rawText, file.name);

    // Stage 3: Extracting fields
    setDocs(prev => prev.map(d => d.id === id ? { ...d, stage: "Extracting key fields...", docType: classification.docType, confidence: classification.confidence } : d));
    await delay(400);

    const extracted = extractFieldsFromText(rawText, classification.docType);

    // Stage 4: Done
    setDocs(prev => prev.map(d => d.id === id ? {
      ...d,
      status: "done",
      docType: classification.docType,
      confidence: classification.confidence,
      extractedData: extracted,
      rawText,
      stage: null,
    } : d));
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    files.slice(0, 5).forEach(processFile);
  }, [processFile]);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, 5).forEach(processFile);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [processFile]);

  const removeDoc = (id) => { setDocs(prev => prev.filter(d => d.id !== id)); setExpandedText(prev => { const n = { ...prev }; delete n[id]; return n; }); };
  const toggleText = (id) => setExpandedText(prev => ({ ...prev, [id]: !prev[id] }));

  // Compliance check
  const classifiedTypes = new Set(docs.filter(d => d.status === "done").map(d => d.docType));
  const checklist = ITR_CHECKLIST.map(item => ({
    ...item,
    found: classifiedTypes.has(item.key) || (item.alt && classifiedTypes.has(item.alt)),
  }));
  const complianceScore = docs.length > 0 ? Math.round((checklist.filter(c => c.found).length / checklist.length) * 100) : 0;

  const formatSize = (bytes) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-emerald-400/[0.05] blur-3xl pointer-events-none animate-breathe"
            style={{ willChange: "transform", transform: "translateZ(0)" }} />

          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <FileSearch className="w-3.5 h-3.5" /> AI Document Intelligence
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              Smart Document <span className="italic gradient-text-premium">Analyzer</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              Upload financial documents and our AI will <strong>extract real text</strong>, classify the document type, and pull out key data fields — all in your browser.
            </motion.p>
          </div>
        </section>

        {/* ── Main Content ──────────────────────────────────────────── */}
        <section className="py-8 md:py-12">
          <div className="max-w-5xl mx-auto px-6 lg:px-12 space-y-8">

            {/* ── Upload Zone ──────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed p-12 md:p-16 text-center cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? "border-accent bg-accent/5 scale-[1.01]"
                    : "border-border/60 hover:border-accent/40 hover:bg-secondary/20"
                }`}
              >
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.csv,.txt"
                  onChange={handleFileSelect} className="hidden" />
                <motion.div animate={dragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }} transition={{ type: "spring" }}>
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 mx-auto mb-5 flex items-center justify-center">
                    <Upload className={`w-8 h-8 ${dragActive ? "text-accent" : "text-muted-foreground"} transition-colors`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {dragActive ? "Drop files here" : "Upload Financial Documents"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Drag & drop or click to upload • PDF, Images, CSV, Excel supported
                  </p>
                  <p className="text-xs text-muted-foreground/70 mb-4">
                    📄 PDFs are fully text-extracted using AI • Images classified by filename
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {["Form 16", "PAN", "Aadhaar", "Bank Statement", "Invoices", "Rent Receipts"].map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* ── Processed Documents ──────────────────────────────── */}
            <AnimatePresence>
              {docs.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Brain className="w-5 h-5 text-violet-500" /> AI Analysis Results
                    </h2>
                    <span className="text-sm text-muted-foreground">{docs.length} document{docs.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="space-y-4">
                    {docs.map((doc, i) => {
                      const typeInfo = DOC_TYPES[doc.docType] || DOC_TYPES.invoice;
                      const hasText = doc.rawText && !doc.rawText.startsWith("[") && doc.rawText.length > 20;
                      const fieldCount = Object.keys(doc.extractedData).length;
                      return (
                        <motion.div key={doc.id}
                          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.05 }}>
                          <Card className="border-border/50 overflow-hidden">
                            <CardContent className="p-5">
                              <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl ${typeInfo.color} bg-opacity-10 flex items-center justify-center flex-shrink-0 text-2xl`}>
                                  {typeInfo.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {/* Header */}
                                  <div className="flex items-start justify-between gap-3 mb-3">
                                    <div>
                                      <h3 className="font-semibold truncate">{doc.name}</h3>
                                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        {doc.status === "done" && (
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeInfo.color} text-white`}>
                                            {typeInfo.name}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground">{typeInfo.category}</span>
                                        <span className="text-[10px] text-muted-foreground">{formatSize(doc.size)}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {doc.status === "done" && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                          <Sparkles className="w-3 h-3" /> {doc.confidence}% confident
                                        </span>
                                      )}
                                      {doc.status === "done" && hasText && (
                                        <button onClick={() => toggleText(doc.id)}
                                          className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                          title="Toggle raw text">
                                          {expandedText[doc.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                      )}
                                      <button onClick={() => removeDoc(doc.id)}
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Processing Animation */}
                                  {doc.status === "analyzing" && (
                                    <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-secondary/40 border border-border/40">
                                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                                      <div>
                                        <p className="text-sm font-medium text-foreground">{doc.stage || "Initializing AI engine..."}</p>
                                        <div className="w-48 h-1 rounded-full bg-secondary mt-2 overflow-hidden">
                                          <motion.div className="h-full bg-accent rounded-full"
                                            initial={{ width: "0%" }} animate={{ width: "100%" }}
                                            transition={{ duration: 3, ease: "linear" }} />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Extracted Fields */}
                                  {doc.status === "done" && fieldCount > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                      {Object.entries(doc.extractedData).map(([key, value], j) => (
                                        <motion.div key={key} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: j * 0.05 }}
                                          className="flex flex-col px-3 py-2 rounded-lg bg-secondary/30 border border-border/30">
                                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{key}</span>
                                          <span className="text-sm font-medium mt-0.5 truncate">{value}</span>
                                        </motion.div>
                                      ))}
                                    </div>
                                  )}

                                  {/* No fields extracted notice */}
                                  {doc.status === "done" && fieldCount === 0 && (
                                    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 mt-2">
                                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                      <p className="text-xs text-amber-700 dark:text-amber-400">
                                        No structured fields could be extracted. {!hasText ? "This file type doesn't support text extraction — try uploading a PDF." : "The document may not contain recognizable financial data patterns."}
                                      </p>
                                    </div>
                                  )}

                                  {/* Raw Extracted Text (collapsible) */}
                                  {doc.status === "done" && expandedText[doc.id] && hasText && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                                      <div className="rounded-lg bg-secondary/20 border border-border/30 p-3">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                          <FileText className="w-3 h-3" /> Raw Extracted Text
                                        </p>
                                        <pre className="text-xs text-foreground/80 whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono leading-relaxed">
                                          {doc.rawText.slice(0, 3000)}{doc.rawText.length > 3000 ? "\n\n... (truncated)" : ""}
                                        </pre>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Compliance Checklist ─────────────────────────────── */}
            {docs.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-border/50 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500" />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-500" /> ITR Filing Readiness
                        </CardTitle>
                        <CardDescription>Documents required for income tax return filing</CardDescription>
                      </div>
                      <div className="relative w-16 h-16">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="currentColor" className="text-secondary" strokeWidth="3" />
                          <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" className={complianceScore >= 80 ? "stroke-emerald-500" : complianceScore >= 50 ? "stroke-amber-500" : "stroke-red-500"}
                            strokeWidth="3" strokeLinecap="round"
                            initial={{ strokeDasharray: "0, 100" }}
                            animate={{ strokeDasharray: `${complianceScore}, 100` }}
                            transition={{ duration: 1, ease: easing }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold">{complianceScore}%</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 pt-0">
                    {checklist.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            item.found ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-amber-50 dark:bg-amber-950/30"}`}>
                            {item.found ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          </div>
                          <div>
                            <span className="text-sm font-medium">{item.name}</span>
                            {item.required && <span className="text-[10px] text-red-500 ml-2">Required</span>}
                          </div>
                        </div>
                        <span className={`text-xs font-medium ${item.found ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                          {item.found ? "✓ Found" : "Missing"}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── How It Works ─────────────────────────────────────── */}
            {docs.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="text-xl font-semibold mb-6 text-center">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: Upload, title: "Upload", desc: "Drag & drop any financial document — PDF for full text extraction, or images for smart classification", step: "01", gradient: "from-blue-500 to-cyan-500" },
                    { icon: Brain, title: "AI Extracts", desc: "Real text is extracted from PDFs using pdf.js. Regex patterns find PAN, GSTIN, amounts, dates & more", step: "02", gradient: "from-violet-500 to-purple-500" },
                    { icon: CheckCircle, title: "Get Results", desc: "See extracted fields, raw text preview, compliance status, and ITR filing readiness", step: "03", gradient: "from-emerald-500 to-green-500" },
                  ].map((step, i) => (
                    <Card key={i} className="border-border/50 hover:shadow-md hover:-translate-y-1 transition-all duration-500 group">
                      <CardContent className="p-6 text-center">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} mx-auto mb-4 flex items-center justify-center`}>
                          <step.icon className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-xs text-muted-foreground tracking-widest">STEP {step.step}</span>
                        <h3 className="text-lg font-semibold mt-2 mb-2 group-hover:text-accent transition-colors">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── CTA ──────────────────────────────────────────────── */}
            <ScrollReveal>
              <div className="mt-16 text-center">
                <p className="text-muted-foreground mb-4">Want a CA to review your documents and file your return?</p>
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <Link to="/services">Get Expert Filing Help <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
