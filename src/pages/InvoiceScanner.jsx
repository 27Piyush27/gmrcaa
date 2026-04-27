import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileText, Upload, Brain, CheckCircle, X, Sparkles, ArrowRight, Loader2, Receipt, Download, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import {
  extractTextFromFile,
  extractInvoiceFields,
  classifyInvoiceCategory,
} from "@/lib/extractText";

const easing = [0.22, 1, 0.36, 1];

const CATEGORIES = {
  travel: { name: "Travel", icon: "✈️", color: "#6366f1" },
  software: { name: "Software & IT", icon: "💻", color: "#06b6d4" },
  office: { name: "Office & Supplies", icon: "🏢", color: "#10b981" },
  professional: { name: "Professional Fees", icon: "👔", color: "#f59e0b" },
  food: { name: "Food & Beverages", icon: "🍽️", color: "#ef4444" },
  telecom: { name: "Telecom & Internet", icon: "📱", color: "#ec4899" },
  utilities: { name: "Utilities", icon: "⚡", color: "#8b5cf6" },
  misc: { name: "Miscellaneous", icon: "📦", color: "#14b8a6" },
};

export default function InvoiceScanner() {
  const [invoices, setInvoices] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [expandedText, setExpandedText] = useState({});
  const fileInputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    const id = Date.now() + Math.random();
    const inv = { id, name: file.name, size: file.size, category: null, status: "analyzing", data: {}, rawText: "", stage: "Initializing..." };
    setInvoices(prev => [...prev, inv]);

    // Stage 1: Extract text
    setInvoices(prev => prev.map(d => d.id === id ? { ...d, stage: "Extracting text from invoice..." } : d));

    let rawText = "";
    try {
      rawText = await extractTextFromFile(file);
    } catch (err) {
      console.error("[InvoiceScanner] Text extraction failed:", err);
      rawText = `[Error extracting: ${file.name}]`;
    }

    // Stage 2: Classify category
    setInvoices(prev => prev.map(d => d.id === id ? { ...d, stage: "Classifying expense category...", rawText } : d));
    await delay(350);

    const category = classifyInvoiceCategory(rawText, file.name);

    // Stage 3: Extract fields
    setInvoices(prev => prev.map(d => d.id === id ? { ...d, stage: "Extracting invoice fields...", category } : d));
    await delay(350);

    const data = extractInvoiceFields(rawText, file.name);

    // Stage 4: Done
    setInvoices(prev => prev.map(d => d.id === id ? { ...d, status: "done", data, category, rawText, stage: null } : d));
  }, []);

  const handleDrop = useCallback((e) => { e.preventDefault(); setDragActive(false); Array.from(e.dataTransfer?.files || []).slice(0, 8).forEach(processFile); }, [processFile]);
  const handleFileSelect = useCallback((e) => { Array.from(e.target.files || []).slice(0, 8).forEach(processFile); if (fileInputRef.current) fileInputRef.current.value = ""; }, [processFile]);
  const removeInvoice = (id) => { setInvoices(prev => prev.filter(d => d.id !== id)); setExpandedText(prev => { const n = { ...prev }; delete n[id]; return n; }); };
  const toggleText = (id) => setExpandedText(prev => ({ ...prev, [id]: !prev[id] }));

  const done = invoices.filter(i => i.status === "done");
  const totalBase = done.reduce((s, i) => s + (i.data.baseAmount || 0), 0);
  const totalGST = done.reduce((s, i) => s + (i.data.gstAmount || 0), 0);
  const totalITC = done.filter(i => i.data.itcEligible).reduce((s, i) => s + (i.data.gstAmount || 0), 0);
  const ineligibleITC = totalGST - totalITC;

  const categoryBreakdown = Object.entries(
    done.reduce((acc, inv) => { acc[inv.category] = (acc[inv.category] || 0) + (inv.data.totalAmount || 0); return acc; }, {})
  ).map(([key, value]) => ({ name: CATEGORIES[key]?.name || key, value, fill: CATEGORIES[key]?.color || "#6366f1" }));

  const gstBreakdown = [
    { name: "CGST", value: done.reduce((s, i) => s + (i.data.cgst || 0), 0), fill: "#6366f1" },
    { name: "SGST", value: done.reduce((s, i) => s + (i.data.sgst || 0), 0), fill: "#06b6d4" },
    { name: "IGST", value: done.reduce((s, i) => s + (i.data.igst || 0), 0), fill: "#10b981" },
  ].filter(d => d.value > 0);

  const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;
  const formatSize = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  const exportCSV = () => {
    const header = "Vendor,Invoice No,Date,Category,Base Amount,GST Rate,GST Amount,Total,GSTIN,ITC Eligible\n";
    const rows = done.map(i => `"${i.data.vendor}","${i.data.invoiceNo}","${i.data.date}","${CATEGORIES[i.category]?.name}",${i.data.baseAmount},${i.data.gstRate}%,${i.data.gstAmount},${i.data.totalAmount},"${i.data.gstin}",${i.data.itcEligible ? "Yes" : "No"}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "invoices_extracted.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <PageTransition>
      <div className="min-h-screen">
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-cyan-400/[0.05] blur-3xl pointer-events-none animate-breathe" style={{ willChange: "transform", transform: "translateZ(0)" }} />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Receipt className="w-3.5 h-3.5" /> AI Invoice Processing
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              Smart Invoice <span className="italic gradient-text-premium">Scanner</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              Upload invoices for <strong>real text extraction</strong>, auto-categorization, GST reconciliation, and ITC tracking.
            </motion.p>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 space-y-8">
            {/* Upload Zone */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed p-12 md:p-16 text-center cursor-pointer transition-all duration-300 ${
                  dragActive ? "border-accent bg-accent/5 scale-[1.01]" : "border-border/60 hover:border-accent/40 hover:bg-secondary/20"}`}>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv" onChange={handleFileSelect} className="hidden" />
                <div className="w-16 h-16 rounded-2xl bg-accent/10 mx-auto mb-5 flex items-center justify-center">
                  <Upload className={`w-8 h-8 ${dragActive ? "text-accent" : "text-muted-foreground"} transition-colors`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{dragActive ? "Drop invoices here" : "Upload Invoices & Bills"}</h3>
                <p className="text-sm text-muted-foreground mb-1">Drag & drop or click • PDF, Images, Excel supported</p>
                <p className="text-xs text-muted-foreground/70 mb-4">📄 PDFs are fully text-extracted • Amounts, GST & vendor info parsed automatically</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {["Vendor Bills", "Purchase Invoices", "Expense Receipts", "GST Invoices"].map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            {done.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Base Amount", value: fmt(totalBase), color: "from-violet-500 to-purple-600" },
                  { label: "Total GST", value: fmt(totalGST), color: "from-blue-500 to-cyan-600" },
                  { label: "Eligible ITC", value: fmt(totalITC), color: "from-emerald-500 to-green-600" },
                  { label: "Ineligible ITC", value: fmt(ineligibleITC), color: "from-red-500 to-rose-600" },
                ].map(s => (
                  <Card key={s.label} className="border-border/50 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.color}`} />
                    <CardContent className="p-5">
                      <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                      <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* Processed Invoices */}
            <AnimatePresence>
              {invoices.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><Brain className="w-5 h-5 text-violet-500" /> Extracted Invoices</h2>
                    {done.length > 0 && (
                      <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={exportCSV}>
                        <Download className="w-4 h-4" /> Export CSV
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {invoices.map((inv, i) => {
                      const cat = CATEGORIES[inv.category] || CATEGORIES.misc;
                      const hasText = inv.rawText && !inv.rawText.startsWith("[") && inv.rawText.length > 20;
                      return (
                        <motion.div key={inv.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.05 }}>
                          <Card className="border-border/50 overflow-hidden">
                            <CardContent className="p-5">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 text-2xl">{cat?.icon || "📄"}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3 mb-3">
                                    <div>
                                      <h3 className="font-semibold truncate">{inv.name}</h3>
                                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        {inv.status === "done" && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-violet-500 text-white">{cat?.name}</span>}
                                        <span className="text-[10px] text-muted-foreground">{formatSize(inv.size)}</span>
                                        {inv.status === "done" && inv.data.vendor && <span className="text-[10px] text-muted-foreground">• {inv.data.vendor}</span>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {inv.status === "done" && inv.data.itcEligible && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-medium flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3" /> ITC Eligible
                                        </span>
                                      )}
                                      {inv.status === "done" && !inv.data.itcEligible && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 font-medium flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3" /> ITC Blocked
                                        </span>
                                      )}
                                      {inv.status === "done" && hasText && (
                                        <button onClick={() => toggleText(inv.id)}
                                          className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                          title="Toggle raw text">
                                          {expandedText[inv.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                      )}
                                      <button onClick={() => removeInvoice(inv.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  {inv.status === "analyzing" && (
                                    <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-secondary/40 border border-border/40">
                                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                                      <div>
                                        <p className="text-sm font-medium">{inv.stage || "Initializing..."}</p>
                                        <div className="w-48 h-1 rounded-full bg-secondary mt-2 overflow-hidden">
                                          <motion.div className="h-full bg-accent rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.2, ease: "linear" }} />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {inv.status === "done" && inv.data && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                                      {[
                                        ["Vendor", inv.data.vendor], ["Invoice #", inv.data.invoiceNo], ["Date", inv.data.date],
                                        ["Base Amount", fmt(inv.data.baseAmount)], ["GST Rate", `${inv.data.gstRate}%`], ["GST Amount", fmt(inv.data.gstAmount)],
                                        ["Total", fmt(inv.data.totalAmount)], ...(inv.data.gstin ? [["GSTIN", inv.data.gstin]] : []),
                                      ].map(([key, value]) => (
                                        <div key={key} className="flex flex-col px-3 py-2 rounded-lg bg-secondary/30 border border-border/30">
                                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{key}</span>
                                          <span className="text-sm font-medium mt-0.5 truncate">{value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {/* Raw text toggle */}
                                  {inv.status === "done" && expandedText[inv.id] && hasText && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                                      <div className="rounded-lg bg-secondary/20 border border-border/30 p-3">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                          <FileText className="w-3 h-3" /> Raw Extracted Text
                                        </p>
                                        <pre className="text-xs text-foreground/80 whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono leading-relaxed">
                                          {inv.rawText.slice(0, 3000)}{inv.rawText.length > 3000 ? "\n\n... (truncated)" : ""}
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

            {/* Charts */}
            {done.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="border-border/50">
                    <CardHeader><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={categoryBreakdown} cx="50%" cy="50%" outerRadius={90} innerRadius={55} paddingAngle={3} dataKey="value"
                            label={({ name, value }) => `${name}: ₹${(value / 1000).toFixed(0)}k`}>
                            {categoryBreakdown.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Amount"]}
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <Card className="border-border/50">
                    <CardHeader><CardTitle className="text-base">GST Split (CGST / SGST / IGST)</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={gstBreakdown} barSize={50}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                          <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Tax"]}
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>{gstBreakdown.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* How It Works */}
            {invoices.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="text-xl font-semibold mb-6 text-center">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: Upload, title: "Upload", desc: "Drag & drop vendor invoices — PDF for full text extraction, or images and spreadsheets", step: "01", gradient: "from-blue-500 to-cyan-500" },
                    { icon: Brain, title: "AI Extracts", desc: "Real text extraction from PDFs. Regex patterns find vendor, amounts, GST, GSTIN, and dates", step: "02", gradient: "from-violet-500 to-purple-500" },
                    { icon: CheckCircle, title: "Get Insights", desc: "View category breakdown, ITC eligibility, GST reconciliation, raw text, and export data", step: "03", gradient: "from-emerald-500 to-green-500" },
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

            <ScrollReveal>
              <div className="mt-16 text-center">
                <p className="text-muted-foreground mb-4">Need a CA to reconcile your GST and file returns?</p>
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <Link to="/services">Get GST Filing Help <ArrowRight className="w-4 h-4" /></Link>
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
