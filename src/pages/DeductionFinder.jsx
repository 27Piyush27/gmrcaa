import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Brain, Sparkles, ArrowRight, Target, IndianRupee, CheckCircle, Lightbulb, Search, ChevronDown, ChevronUp, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

const DEDUCTION_SECTIONS = [
  { id: "80C", name: "Section 80C", limit: 150000, desc: "PPF, ELSS, LIC, EPF, Sukanya, NSC, FD (5yr)", icon: "💰", category: "Investment" },
  { id: "80CCD1B", name: "Section 80CCD(1B)", limit: 50000, desc: "NPS – additional deduction beyond 80C", icon: "🏦", category: "Retirement" },
  { id: "80D_self", name: "Section 80D (Self)", limit: 25000, desc: "Health insurance premium – self, spouse, children", icon: "🏥", category: "Insurance" },
  { id: "80D_parents", name: "Section 80D (Parents)", limit: 50000, desc: "Health insurance for parents (₹50K if senior citizen)", icon: "👨‍👩‍👦", category: "Insurance" },
  { id: "80E", name: "Section 80E", limit: 0, desc: "Education loan interest – no upper limit, up to 8 years", icon: "🎓", category: "Loan" },
  { id: "80G", name: "Section 80G", limit: 0, desc: "Donations to approved charities – 50% or 100% deduction", icon: "🤝", category: "Charity" },
  { id: "80EEA", name: "Section 80EEA", limit: 150000, desc: "First-time homebuyer – additional interest deduction", icon: "🏠", category: "Housing" },
  { id: "24b", name: "Section 24(b)", limit: 200000, desc: "Home loan interest – self-occupied property", icon: "🏡", category: "Housing" },
  { id: "80TTA", name: "Section 80TTA", limit: 10000, desc: "Savings account interest – up to ₹10,000", icon: "🏧", category: "Interest" },
  { id: "80GG", name: "Section 80GG", limit: 60000, desc: "Rent paid – if no HRA received from employer", icon: "🏘️", category: "Housing" },
  { id: "HRA", name: "HRA Exemption", limit: 0, desc: "House Rent Allowance exemption under Section 10", icon: "🔑", category: "Housing" },
  { id: "LTA", name: "LTA Exemption", limit: 0, desc: "Leave Travel Allowance – domestic travel", icon: "✈️", category: "Travel" },
  { id: "80DD", name: "Section 80DD", limit: 75000, desc: "Medical treatment for disabled dependent", icon: "♿", category: "Medical" },
  { id: "80DDB", name: "Section 80DDB", limit: 40000, desc: "Treatment of specified diseases", icon: "💊", category: "Medical" },
  { id: "80U", name: "Section 80U", limit: 75000, desc: "Self with disability – deduction for disabled individual", icon: "🦽", category: "Medical" },
];

function analyzeDeductions(income, claimed) {
  const results = [];
  DEDUCTION_SECTIONS.forEach(section => {
    const claimedAmt = claimed[section.id] || 0;
    const limit = section.limit || claimedAmt;
    const gap = Math.max(0, limit - claimedAmt);
    const taxRate = income > 1000000 ? 0.312 : income > 500000 ? 0.208 : 0.052;
    const potentialSaving = Math.round(gap * taxRate);

    results.push({
      ...section,
      claimed: claimedAmt,
      available: limit,
      gap,
      potentialSaving,
      utilization: limit > 0 ? Math.round((claimedAmt / limit) * 100) : claimedAmt > 0 ? 100 : 0,
      status: gap === 0 ? "maxed" : claimedAmt > 0 ? "partial" : "unused",
    });
  });
  return results.sort((a, b) => b.potentialSaving - a.potentialSaving);
}

export default function DeductionFinder() {
  const [income, setIncome] = useState(1200000);
  const [showAll, setShowAll] = useState(false);
  const [claimed, setClaimed] = useState({
    "80C": 80000, "80CCD1B": 0, "80D_self": 15000, "80D_parents": 0,
    "80E": 0, "80G": 0, "80EEA": 0, "24b": 0, "80TTA": 5000,
    "80GG": 0, "HRA": 120000, "LTA": 0, "80DD": 0, "80DDB": 0, "80U": 0,
  });

  const updateClaimed = (id, val) => setClaimed(prev => ({ ...prev, [id]: Number(val) || 0 }));
  const analysis = useMemo(() => analyzeDeductions(income, claimed), [income, claimed]);

  const totalClaimed = analysis.reduce((s, a) => s + a.claimed, 0);
  const totalAvailable = analysis.filter(a => a.available > 0).reduce((s, a) => s + a.available, 0);
  const totalSavings = analysis.reduce((s, a) => s + a.potentialSaving, 0);
  const utilizationPct = totalAvailable > 0 ? Math.round((totalClaimed / totalAvailable) * 100) : 0;

  const topOpportunities = analysis.filter(a => a.potentialSaving > 0).slice(0, 6);
  const waterfallData = topOpportunities.map(a => ({ name: a.id, saving: a.potentialSaving, fill: a.potentialSaving > 15000 ? "#10b981" : a.potentialSaving > 5000 ? "#6366f1" : "#94a3b8" }));

  const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;
  const displayedSections = showAll ? DEDUCTION_SECTIONS : DEDUCTION_SECTIONS.slice(0, 8);

  return (
    <PageTransition>
      <div className="min-h-screen">
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-violet-400/[0.06] blur-3xl pointer-events-none animate-breathe" style={{ willChange: "transform", transform: "translateZ(0)" }} />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Search className="w-3.5 h-3.5" /> ML Deduction Analysis
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              AI Deduction <span className="italic gradient-text-premium">Finder</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              Discover missed tax deductions across 15+ sections. AI analyzes your profile and shows exactly how much you can save.
            </motion.p>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 space-y-8">
            {/* Income Input */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/50 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500" />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center"><IndianRupee className="w-4 h-4 text-violet-600" /></div>
                    Your Financial Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Annual Gross Income</Label>
                      <span className="text-lg font-bold">{fmt(income)}</span>
                    </div>
                    <input type="range" min={300000} max={10000000} step={50000} value={income}
                      onChange={e => setIncome(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-secondary accent-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-muted-foreground mt-4">Current Deductions Claimed</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {displayedSections.map(sec => (
                      <div key={sec.id}>
                        <Label className="text-xs flex items-center gap-1">{sec.icon} {sec.id} {sec.limit > 0 && <span className="text-muted-foreground">(max {fmt(sec.limit)})</span>}</Label>
                        <Input type="number" value={claimed[sec.id] || ""} onChange={e => updateClaimed(sec.id, e.target.value)}
                          className="premium-input mt-1" placeholder={sec.limit > 0 ? `Max ${fmt(sec.limit)}` : "Enter amount"} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setShowAll(!showAll)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showAll ? "Show Less" : `Show All ${DEDUCTION_SECTIONS.length} Sections`}
                  </button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Summary Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: IndianRupee, label: "Total Claimed", value: fmt(totalClaimed), color: "from-blue-500 to-cyan-600", bg: "bg-blue-50 dark:bg-blue-950/30", ic: "text-blue-600" },
                { icon: Target, label: "Utilization", value: `${utilizationPct}%`, color: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30", ic: "text-violet-600" },
                { icon: Sparkles, label: "Potential Savings", value: fmt(totalSavings), color: "from-emerald-500 to-green-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", ic: "text-emerald-600" },
                { icon: Lightbulb, label: "Opportunities", value: `${topOpportunities.length}`, color: "from-amber-500 to-orange-600", bg: "bg-amber-50 dark:bg-amber-950/30", ic: "text-amber-600" },
              ].map(s => (
                <Card key={s.label} className="border-border/50 relative overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-500">
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.color}`} />
                  <CardContent className="p-5">
                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}><s.icon className={`w-5 h-5 ${s.ic}`} /></div>
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Savings Waterfall */}
            {waterfallData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Brain className="w-4 h-4 text-violet-500" /> Savings Opportunity Waterfall</CardTitle>
                    <CardDescription>Potential tax savings by maximizing each deduction section</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={waterfallData} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Potential Saving"]}
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        <Bar dataKey="saving" radius={[8, 8, 0, 0]}>{waterfallData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Section-wise Analysis */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Section-wise Analysis</h2>
                  <p className="text-sm text-muted-foreground">AI-identified gaps and recommendations</p>
                </div>
              </div>
              <div className="space-y-3">
                {analysis.filter(a => a.potentialSaving > 0 || a.status === "maxed").slice(0, 10).map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.06, ease: easing }}>
                    <Card className={`border-border/50 hover:shadow-md transition-all duration-300 ${
                      a.status === "maxed" ? "border-l-4 border-l-emerald-500" : a.potentialSaving > 10000 ? "border-l-4 border-l-amber-500" : ""}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <span className="text-2xl">{a.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                              <div>
                                <h3 className="font-semibold">{a.name}</h3>
                                <p className="text-xs text-muted-foreground">{a.desc}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {a.status === "maxed" ? (
                                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Maximized
                                  </span>
                                ) : a.potentialSaving > 0 && (
                                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                                    Save {fmt(a.potentialSaving)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {a.available > 0 && (
                              <div className="mt-2">
                                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                  <span>Claimed: {fmt(a.claimed)}</span>
                                  <span>Limit: {fmt(a.available)}</span>
                                </div>
                                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${a.utilization}%` }}
                                    transition={{ duration: 0.8, ease: easing }}
                                    className={`h-full rounded-full ${a.utilization >= 100 ? "bg-emerald-500" : a.utilization >= 50 ? "bg-blue-500" : "bg-amber-500"}`} />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">{a.utilization}% utilized</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA to Tax Optimizer */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center flex-shrink-0"><Zap className="w-6 h-6 text-violet-500" /></div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Optimize Further with AI Tax Optimizer</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                      Use our AI Tax Optimizer to compare Old vs New regime with your optimized deductions and see 3-year projections.
                    </p>
                    <Button asChild size="sm" className="rounded-xl gap-2">
                      <Link to="/ai-tax-optimizer">Open AI Tax Optimizer <ArrowRight className="w-4 h-4" /></Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            <ScrollReveal>
              <div className="mt-16 text-center">
                <p className="text-muted-foreground mb-4">Need personalized tax planning from an expert CA?</p>
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <Link to="/services">Get Expert Tax Advisory <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
