import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  FileText, Upload, Brain, CheckCircle, AlertTriangle, X, Sparkles,
  ArrowRight, Shield, Eye, Loader2, FileSearch, Clock, Zap
} from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

// ── Document Classification Engine ──────────────────────────────────────────
const DOC_TYPES = {
  form16: { name: "Form 16", icon: "📋", color: "bg-blue-500", category: "Income", confidence: 94, fields: ["Employee Name", "PAN", "Total Income", "TDS Deducted", "Employer TAN"] },
  bankStatement: { name: "Bank Statement", icon: "🏦", color: "bg-emerald-500", category: "Financial", confidence: 91, fields: ["Account Holder", "Account Number", "Period", "Opening Balance", "Closing Balance"] },
  invoice: { name: "Invoice / Bill", icon: "🧾", color: "bg-amber-500", category: "Expense", confidence: 88, fields: ["Vendor Name", "Invoice Number", "Amount", "GST Amount", "Date"] },
  panCard: { name: "PAN Card", icon: "🪪", color: "bg-violet-500", category: "Identity", confidence: 96, fields: ["Name", "PAN Number", "Date of Birth", "Father's Name"] },
  aadhaar: { name: "Aadhaar Card", icon: "🆔", color: "bg-indigo-500", category: "Identity", confidence: 95, fields: ["Name", "Aadhaar Number", "Address", "Date of Birth"] },
  gstReturn: { name: "GST Return", icon: "📊", color: "bg-cyan-500", category: "Tax Filing", confidence: 89, fields: ["GSTIN", "Filing Period", "Turnover", "Tax Payable", "ITC Claimed"] },
  itr: { name: "ITR Acknowledgment", icon: "✅", color: "bg-green-500", category: "Tax Filing", confidence: 92, fields: ["PAN", "Assessment Year", "Total Income", "Tax Paid", "Filing Date"] },
  salarySlip: { name: "Salary Slip", icon: "💰", color: "bg-pink-500", category: "Income", confidence: 90, fields: ["Employee Name", "Month", "Gross Salary", "Deductions", "Net Pay"] },
  rentReceipt: { name: "Rent Receipt", icon: "🏠", color: "bg-orange-500", category: "Deduction", confidence: 87, fields: ["Tenant Name", "Landlord Name", "Rent Amount", "Period", "Address"] },
  investmentProof: { name: "Investment Proof", icon: "📈", color: "bg-teal-500", category: "Deduction", confidence: 85, fields: ["Investor Name", "Investment Type", "Amount", "Date", "Reference Number"] },
};

function classifyDocument(filename) {
  const name = filename.toLowerCase();
  if (name.includes("form16") || name.includes("form 16") || name.includes("tds")) return "form16";
  if (name.includes("bank") || name.includes("statement")) return "bankStatement";
  if (name.includes("invoice") || name.includes("bill") || name.includes("receipt") && !name.includes("rent")) return "invoice";
  if (name.includes("pan")) return "panCard";
  if (name.includes("aadhaar") || name.includes("aadhar")) return "aadhaar";
  if (name.includes("gst")) return "gstReturn";
  if (name.includes("itr") || name.includes("return")) return "itr";
  if (name.includes("salary") || name.includes("payslip")) return "salarySlip";
  if (name.includes("rent")) return "rentReceipt";
  if (name.includes("invest") || name.includes("mutual") || name.includes("ppf") || name.includes("elss")) return "investmentProof";
  // Random classification for demo purposes
  const keys = Object.keys(DOC_TYPES);
  return keys[Math.floor(Math.random() * keys.length)];
}

function generateExtractedData(docType) {
  const type = DOC_TYPES[docType];
  const sampleData = {
    form16: { "Employee Name": "Rajesh Kumar", "PAN": "ABCPK1234F", "Total Income": "₹12,50,000", "TDS Deducted": "₹1,04,000", "Employer TAN": "DELR12345E" },
    bankStatement: { "Account Holder": "Rajesh Kumar", "Account Number": "XXXX-XXXX-4521", "Period": "Apr 2025 - Mar 2026", "Opening Balance": "₹2,45,000", "Closing Balance": "₹3,12,000" },
    invoice: { "Vendor Name": "CloudTech Solutions", "Invoice Number": "INV-2026-0847", "Amount": "₹15,000", "GST Amount": "₹2,700", "Date": "15-Mar-2026" },
    panCard: { "Name": "Rajesh Kumar", "PAN Number": "ABCPK1234F", "Date of Birth": "15-Aug-1990", "Father's Name": "Suresh Kumar" },
    aadhaar: { "Name": "Rajesh Kumar", "Aadhaar Number": "XXXX-XXXX-5678", "Address": "Sector 7, Gurugram", "Date of Birth": "15-Aug-1990" },
    gstReturn: { "GSTIN": "06ABCPK1234F1Z5", "Filing Period": "Mar 2026", "Turnover": "₹45,00,000", "Tax Payable": "₹2,70,000", "ITC Claimed": "₹1,80,000" },
    itr: { "PAN": "ABCPK1234F", "Assessment Year": "2026-27", "Total Income": "₹12,50,000", "Tax Paid": "₹1,04,000", "Filing Date": "28-Jul-2026" },
    salarySlip: { "Employee Name": "Rajesh Kumar", "Month": "March 2026", "Gross Salary": "₹1,04,167", "Deductions": "₹18,750", "Net Pay": "₹85,417" },
    rentReceipt: { "Tenant Name": "Rajesh Kumar", "Landlord Name": "Amit Sharma", "Rent Amount": "₹25,000", "Period": "Mar 2026", "Address": "B-42, Sec 15, Gurugram" },
    investmentProof: { "Investor Name": "Rajesh Kumar", "Investment Type": "ELSS Mutual Fund", "Amount": "₹1,50,000", "Date": "20-Mar-2026", "Reference Number": "MF-2026-78451" },
  };
  return sampleData[docType] || {};
}

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
  const [docs, setDocs] = useState([]); // { id, file, docType, status: 'analyzing'|'done', extractedData }
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = useCallback((file) => {
    const id = Date.now() + Math.random();
    const docType = classifyDocument(file.name);
    const newDoc = { id, file, name: file.name, size: file.size, docType, status: "analyzing", extractedData: {} };
    setDocs(prev => [...prev, newDoc]);

    // Simulate AI processing with stages
    setTimeout(() => {
      setDocs(prev => prev.map(d => d.id === id ? { ...d, stage: "Classifying document..." } : d));
    }, 400);
    setTimeout(() => {
      setDocs(prev => prev.map(d => d.id === id ? { ...d, stage: "Extracting key fields..." } : d));
    }, 1000);
    setTimeout(() => {
      setDocs(prev => prev.map(d => d.id === id ? { ...d, stage: "Running compliance checks..." } : d));
    }, 1800);
    setTimeout(() => {
      const extracted = generateExtractedData(docType);
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "done", extractedData: extracted, stage: null } : d));
    }, 2500);
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

  const removeDoc = (id) => setDocs(prev => prev.filter(d => d.id !== id));

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
              Upload financial documents and let AI classify, extract key data, and check compliance — instantly.
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
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx"
                  onChange={handleFileSelect} className="hidden" />
                <motion.div animate={dragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }} transition={{ type: "spring" }}>
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 mx-auto mb-5 flex items-center justify-center">
                    <Upload className={`w-8 h-8 ${dragActive ? "text-accent" : "text-muted-foreground"} transition-colors`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {dragActive ? "Drop files here" : "Upload Financial Documents"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag & drop or click to upload • PDF, Images, Excel supported
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
                      const typeInfo = DOC_TYPES[doc.docType];
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
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeInfo.color} text-white`}>
                                          {typeInfo.name}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">{typeInfo.category}</span>
                                        <span className="text-[10px] text-muted-foreground">{formatSize(doc.size)}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {doc.status === "done" && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                          <Sparkles className="w-3 h-3" /> {typeInfo.confidence}% confident
                                        </span>
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
                                            transition={{ duration: 2.5, ease: "linear" }} />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Extracted Data */}
                                  {doc.status === "done" && Object.keys(doc.extractedData).length > 0 && (
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
                    { icon: Upload, title: "Upload", desc: "Drag & drop any financial document — PDF, image, or spreadsheet", step: "01", gradient: "from-blue-500 to-cyan-500" },
                    { icon: Brain, title: "AI Analyzes", desc: "Our AI classifies, extracts key fields, and validates data accuracy", step: "02", gradient: "from-violet-500 to-purple-500" },
                    { icon: CheckCircle, title: "Get Results", desc: "Instantly see extracted data, compliance status, and filing readiness", step: "03", gradient: "from-emerald-500 to-green-500" },
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
