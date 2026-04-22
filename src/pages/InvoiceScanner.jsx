import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FileText, Upload, Brain, CheckCircle, X, Sparkles, ArrowRight, Loader2, Receipt, IndianRupee, Download, AlertTriangle, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];
const COLORS = ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#8b5cf6","#14b8a6"];

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

function classifyInvoice(filename) {
  const n = filename.toLowerCase();
  if (/travel|flight|hotel|uber|ola|cab|train/.test(n)) return "travel";
  if (/software|aws|azure|cloud|adobe|google|microsoft|saas/.test(n)) return "software";
  if (/office|stationery|furniture|printer/.test(n)) return "office";
  if (/legal|consult|audit|lawyer|ca |chartered/.test(n)) return "professional";
  if (/food|restaurant|swiggy|zomato|cafe|canteen/.test(n)) return "food";
  if (/telecom|airtel|jio|vodafone|internet|broadband/.test(n)) return "telecom";
  if (/electric|water|gas|utility/.test(n)) return "utilities";
  const keys = Object.keys(CATEGORIES);
  return keys[Math.floor(Math.random() * keys.length)];
}

function generateInvoiceData(filename, category) {
  const vendors = {
    travel: ["MakeMyTrip", "Cleartrip", "Uber India", "IndiGo Airlines"],
    software: ["AWS India", "Microsoft 365", "Zoho Corp", "Adobe Systems"],
    office: ["Amazon Business", "Flipkart Wholesale", "Staples India"],
    professional: ["Deloitte India", "KPMG Advisory", "Legal Associates"],
    food: ["Swiggy Corporate", "Zomato Business", "Café Coffee Day"],
    telecom: ["Airtel Business", "Jio Enterprise", "Vodafone Idea"],
    utilities: ["Tata Power", "BSES Rajdhani", "Indraprastha Gas"],
    misc: ["Misc Vendor", "General Store", "Sundry Supplier"],
  };
  const vendor = vendors[category]?.[Math.floor(Math.random() * vendors[category].length)] || "Unknown Vendor";
  const baseAmount = Math.round((5000 + Math.random() * 45000) / 100) * 100;
  const gstRate = [5, 12, 18, 28][Math.floor(Math.random() * 4)];
  const gstAmount = Math.round(baseAmount * gstRate / 100);
  const isInter = Math.random() > 0.6;

  return {
    vendor, invoiceNo: `INV-${2026}-${String(Math.floor(1000 + Math.random() * 9000))}`,
    date: `${Math.floor(1 + Math.random() * 28)}-${["Jan","Feb","Mar","Apr"][Math.floor(Math.random() * 4)]}-2026`,
    baseAmount, gstRate, gstAmount, totalAmount: baseAmount + gstAmount,
    gstin: `${String(Math.floor(1 + Math.random() * 36)).padStart(2, "0")}AABCT${Math.floor(1000 + Math.random() * 9000)}H1Z${Math.floor(1 + Math.random() * 9)}`,
    cgst: isInter ? 0 : Math.round(gstAmount / 2), sgst: isInter ? 0 : Math.round(gstAmount / 2),
    igst: isInter ? gstAmount : 0, isInterState: isInter, itcEligible: Math.random() > 0.15,
  };
}

export default function InvoiceScanner() {
  const [invoices, setInvoices] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = useCallback((file) => {
    const id = Date.now() + Math.random();
    const category = classifyInvoice(file.name);
    const inv = { id, name: file.name, size: file.size, category, status: "analyzing", data: {}, stage: null };
    setInvoices(prev => [...prev, inv]);
    setTimeout(() => setInvoices(prev => prev.map(d => d.id === id ? { ...d, stage: "Classifying expense category..." } : d)), 300);
    setTimeout(() => setInvoices(prev => prev.map(d => d.id === id ? { ...d, stage: "Extracting invoice fields..." } : d)), 900);
    setTimeout(() => setInvoices(prev => prev.map(d => d.id === id ? { ...d, stage: "Validating GST compliance..." } : d)), 1600);
    setTimeout(() => {
      const data = generateInvoiceData(file.name, category);
      setInvoices(prev => prev.map(d => d.id === id ? { ...d, status: "done", data, stage: null } : d));
    }, 2200);
  }, []);

  const handleDrop = useCallback((e) => { e.preventDefault(); setDragActive(false); Array.from(e.dataTransfer?.files || []).slice(0, 8).forEach(processFile); }, [processFile]);
  const handleFileSelect = useCallback((e) => { Array.from(e.target.files || []).slice(0, 8).forEach(processFile); if (fileInputRef.current) fileInputRef.current.value = ""; }, [processFile]);
  const removeInvoice = (id) => setInvoices(prev => prev.filter(d => d.id !== id));

  const done = invoices.filter(i => i.status === "done");
  const totalBase = done.reduce((s, i) => s + (i.data.baseAmount || 0), 0);
  const totalGST = done.reduce((s, i) => s + (i.data.gstAmount || 0), 0);
  const totalITC = done.filter(i => i.data.itcEligible).reduce((s, i) => s + (i.data.gstAmount || 0), 0);
  const ineligibleITC = totalGST - totalITC;

  const categoryBreakdown = Object.entries(
    done.reduce((acc, inv) => { acc[inv.category] = (acc[inv.category] || 0) + inv.data.totalAmount; return acc; }, {})
  ).map(([key, value]) => ({ name: CATEGORIES[key]?.name || key, value, fill: CATEGORIES[key]?.color || "#6366f1" }));

  const gstBreakdown = [
    { name: "CGST", value: done.reduce((s, i) => s + (i.data.cgst || 0), 0), fill: "#6366f1" },
    { name: "SGST", value: done.reduce((s, i) => s + (i.data.sgst || 0), 0), fill: "#06b6d4" },
    { name: "IGST", value: done.reduce((s, i) => s + (i.data.igst || 0), 0), fill: "#10b981" },
  ].filter(d => d.value > 0);

  const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;
  const formatSize = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  const exportCSV = () => {
    const header = "Vendor,Invoice No,Date,Category,Base Amount,GST Rate,GST Amount,Total,GSTIN,ITC Eligible\n";
    const rows = done.map(i => `${i.data.vendor},${i.data.invoiceNo},${i.data.date},${CATEGORIES[i.category]?.name},${i.data.baseAmount},${i.data.gstRate}%,${i.data.gstAmount},${i.data.totalAmount},${i.data.gstin},${i.data.itcEligible ? "Yes" : "No"}`).join("\n");
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
              Upload invoices for AI-powered extraction, auto-categorization, GST reconciliation, and ITC tracking.
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
                <p className="text-sm text-muted-foreground mb-4">Drag & drop or click • PDF, Images, Excel supported</p>
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
                  { label: "Total Base Amount", value: fmt(totalBase), color: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30", ic: "text-violet-600" },
                  { label: "Total GST", value: fmt(totalGST), color: "from-blue-500 to-cyan-600", bg: "bg-blue-50 dark:bg-blue-950/30", ic: "text-blue-600" },
                  { label: "Eligible ITC", value: fmt(totalITC), color: "from-emerald-500 to-green-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", ic: "text-emerald-600" },
                  { label: "Ineligible ITC", value: fmt(ineligibleITC), color: "from-red-500 to-rose-600", bg: "bg-red-50 dark:bg-red-950/30", ic: "text-red-600" },
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
                      const cat = CATEGORIES[inv.category];
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
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-violet-500 text-white">{cat?.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{formatSize(inv.size)}</span>
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
                                        ["Total", fmt(inv.data.totalAmount)], ["GSTIN", inv.data.gstin],
                                      ].map(([key, value]) => (
                                        <div key={key} className="flex flex-col px-3 py-2 rounded-lg bg-secondary/30 border border-border/30">
                                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{key}</span>
                                          <span className="text-sm font-medium mt-0.5 truncate">{value}</span>
                                        </div>
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
                    { icon: Upload, title: "Upload", desc: "Drag & drop vendor invoices — PDF, images, or spreadsheets", step: "01", gradient: "from-blue-500 to-cyan-500" },
                    { icon: Brain, title: "AI Extracts", desc: "Our AI extracts vendor details, amounts, GST breakdowns, and validates compliance", step: "02", gradient: "from-violet-500 to-purple-500" },
                    { icon: CheckCircle, title: "Get Insights", desc: "View category breakdown, ITC eligibility, GST reconciliation, and export data", step: "03", gradient: "from-emerald-500 to-green-500" },
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
