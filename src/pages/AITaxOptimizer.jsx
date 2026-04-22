import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend, LineChart, Line
} from "recharts";
import {
  Brain, Sparkles, TrendingUp, IndianRupee, ArrowRight, AlertTriangle,
  CheckCircle, Lightbulb, Calculator, Target, Zap, ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];
const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

// ── Tax Calculation Engine ──────────────────────────────────────────────────
function calcOldRegime(income, deductions) {
  const { sec80C = 0, sec80D = 0, hra = 0, nps = 0, homeLoan = 0, other = 0 } = deductions;
  const totalDeductions = Math.min(sec80C, 150000) + Math.min(sec80D, 75000) + hra + Math.min(nps, 50000) + Math.min(homeLoan, 200000) + other;
  const taxable = Math.max(0, income - totalDeductions - 50000); // 50000 standard deduction

  let tax = 0;
  if (taxable > 1000000) tax = 12500 + 100000 + (taxable - 1000000) * 0.30;
  else if (taxable > 500000) tax = 12500 + (taxable - 500000) * 0.20;
  else if (taxable > 250000) tax = (taxable - 250000) * 0.05;
  if (taxable <= 500000) tax = 0; // 87A rebate
  return Math.round(tax * 1.04); // 4% cess
}

function calcNewRegime(income) {
  const taxable = Math.max(0, income - 75000); // 75000 standard deduction new regime
  const slabs = [[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]];
  let tax = 0, prev = 0;
  for (const [limit, rate] of slabs) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, limit) - prev) * rate;
    prev = limit;
  }
  if (taxable <= 1200000) tax = 0; // 87A rebate
  return Math.round(tax * 1.04);
}

// ── AI Deduction Recommendations ────────────────────────────────────────────
function getRecommendations(income, deductions) {
  const recs = [];
  const { sec80C = 0, sec80D = 0, nps = 0, homeLoan = 0 } = deductions;

  if (sec80C < 150000) {
    const gap = 150000 - sec80C;
    const saving = gap * (income > 1000000 ? 0.30 : income > 500000 ? 0.20 : 0.05) * 1.04;
    recs.push({
      title: "Maximize Section 80C",
      desc: `Invest ₹${gap.toLocaleString("en-IN")} more in ELSS, PPF, or EPF to save up to ₹${Math.round(saving).toLocaleString("en-IN")} in tax.`,
      impact: Math.round(saving), priority: "high", icon: "💰",
      actions: ["Invest in ELSS mutual funds", "Increase PPF contribution", "Pay LIC premiums"],
    });
  }

  if (sec80D < 25000) {
    const gap = 25000 - sec80D;
    const saving = gap * (income > 1000000 ? 0.30 : 0.20) * 1.04;
    recs.push({
      title: "Health Insurance (80D)",
      desc: `Get health insurance to claim ₹${gap.toLocaleString("en-IN")} deduction. Parents' premium adds ₹50,000 more.`,
      impact: Math.round(saving), priority: "high", icon: "🏥",
      actions: ["Buy health insurance", "Add parents' coverage for extra ₹50K deduction"],
    });
  }

  if (nps < 50000) {
    const gap = 50000 - nps;
    const saving = gap * (income > 1000000 ? 0.30 : 0.20) * 1.04;
    recs.push({
      title: "NPS (Section 80CCD(1B))",
      desc: `Invest ₹${gap.toLocaleString("en-IN")} in NPS for additional deduction beyond 80C limit.`,
      impact: Math.round(saving), priority: "medium", icon: "🏦",
      actions: ["Open NPS Tier-I account", "Set up monthly SIP in NPS"],
    });
  }

  if (homeLoan === 0 && income > 800000) {
    recs.push({
      title: "Home Loan Interest (Sec 24)",
      desc: "If you have a home loan, claim up to ₹2,00,000 deduction on interest paid.",
      impact: Math.round(200000 * (income > 1000000 ? 0.30 : 0.20) * 1.04), priority: "medium", icon: "🏠",
      actions: ["Check home loan interest certificate", "Claim deduction via employer"],
    });
  }

  if (income > 1500000) {
    recs.push({
      title: "Regime Comparison Required",
      desc: "At your income level, detailed analysis of both regimes is critical. Old regime with full deductions may save significantly.",
      impact: 0, priority: "info", icon: "🧠",
      actions: ["List all eligible deductions", "Compare with new regime", "Consult CA for personalized advice"],
    });
  }

  return recs.sort((a, b) => b.impact - a.impact);
}

// ── Component ───────────────────────────────────────────────────────────────
export default function AITaxOptimizer() {
  const [income, setIncome] = useState(1200000);
  const [growthRate, setGrowthRate] = useState(10);
  const [deductions, setDeductions] = useState({
    sec80C: 80000, sec80D: 0, hra: 0, nps: 0, homeLoan: 0, other: 0,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateDeduction = useCallback((key, val) => {
    setDeductions(prev => ({ ...prev, [key]: Number(val) || 0 }));
  }, []);

  const oldTax = useMemo(() => calcOldRegime(income, deductions), [income, deductions]);
  const newTax = useMemo(() => calcNewRegime(income), [income]);
  const betterRegime = oldTax <= newTax ? "Old" : "New";
  const savings = Math.abs(oldTax - newTax);
  const effectiveRate = income > 0 ? ((Math.min(oldTax, newTax) / income) * 100).toFixed(1) : "0.0";

  const recommendations = useMemo(() => getRecommendations(income, deductions), [income, deductions]);
  const totalPotentialSavings = recommendations.reduce((s, r) => s + r.impact, 0);

  // Deduction utilization
  const maxDeductions = 150000 + 75000 + 50000 + 200000; // 80C + 80D + NPS + HomeLoan
  const usedDeductions = Math.min(deductions.sec80C, 150000) + Math.min(deductions.sec80D, 75000) + Math.min(deductions.nps, 50000) + Math.min(deductions.homeLoan, 200000);
  const utilizationPct = Math.round((usedDeductions / maxDeductions) * 100);

  // Bar chart data
  const comparisonData = [
    { name: "Old Regime", tax: oldTax, fill: "#6366f1" },
    { name: "New Regime", tax: newTax, fill: "#06b6d4" },
  ];

  // 3 year projection
  const projectionData = useMemo(() => {
    const years = [];
    for (let i = 0; i <= 3; i++) {
      const projected = Math.round(income * Math.pow(1 + growthRate / 100, i));
      years.push({
        year: `FY ${2026 + i}`,
        income: projected,
        oldTax: calcOldRegime(projected, deductions),
        newTax: calcNewRegime(projected),
      });
    }
    return years;
  }, [income, growthRate, deductions]);

  // Deduction breakdown pie
  const deductionPie = useMemo(() => {
    const items = [
      { name: "80C", value: Math.min(deductions.sec80C, 150000), fill: "#6366f1" },
      { name: "80D", value: Math.min(deductions.sec80D, 75000), fill: "#06b6d4" },
      { name: "NPS", value: Math.min(deductions.nps, 50000), fill: "#10b981" },
      { name: "Home Loan", value: Math.min(deductions.homeLoan, 200000), fill: "#f59e0b" },
      { name: "HRA", value: deductions.hra, fill: "#ec4899" },
      { name: "Other", value: deductions.other, fill: "#8b5cf6" },
    ];
    return items.filter(d => d.value > 0);
  }, [deductions]);

  const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;

  const sliderInputClass = "w-full h-2 rounded-full appearance-none cursor-pointer bg-secondary accent-primary";

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-violet-400/[0.06] blur-3xl pointer-events-none animate-breathe"
            style={{ willChange: "transform", transform: "translateZ(0)" }} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-cyan-400/[0.04] blur-3xl pointer-events-none animate-breathe"
            style={{ willChange: "transform", transform: "translateZ(0)", animationDelay: "-3s" }} />

          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Brain className="w-3.5 h-3.5" /> AI-Powered
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.12 }}>
              AI Tax <span className="italic gradient-text-premium">Optimizer</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.28 }}>
              Smart regime comparison, personalized deduction recommendations, and 3-year projections — powered by AI.
            </motion.p>
          </div>
        </section>

        {/* ── Main Content ──────────────────────────────────────────── */}
        <section className="py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 space-y-8">

            {/* ── What-If Simulator ─────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-border/50 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    What-If Simulator
                  </CardTitle>
                  <CardDescription>Adjust your income and investments — charts update in real time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Income slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Annual Income</Label>
                      <span className="text-lg font-bold text-foreground">{fmt(income)}</span>
                    </div>
                    <input type="range" min={300000} max={10000000} step={50000} value={income}
                      onChange={(e) => setIncome(Number(e.target.value))} className={sliderInputClass} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>₹3L</span><span>₹50L</span><span>₹1Cr</span>
                    </div>
                  </div>

                  {/* Key deductions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">80C (PPF/ELSS/EPF)</Label>
                      <Input type="number" value={deductions.sec80C} onChange={(e) => updateDeduction("sec80C", e.target.value)}
                        className="premium-input mt-1" placeholder="Max ₹1,50,000" />
                    </div>
                    <div>
                      <Label className="text-xs">80D (Health Insurance)</Label>
                      <Input type="number" value={deductions.sec80D} onChange={(e) => updateDeduction("sec80D", e.target.value)}
                        className="premium-input mt-1" placeholder="Max ₹75,000" />
                    </div>
                    <div>
                      <Label className="text-xs">HRA Exemption</Label>
                      <Input type="number" value={deductions.hra} onChange={(e) => updateDeduction("hra", e.target.value)}
                        className="premium-input mt-1" placeholder="Depends on rent" />
                    </div>
                  </div>

                  {/* Advanced toggle */}
                  <button onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showAdvanced ? "Hide" : "Show"} Advanced Deductions
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          <div>
                            <Label className="text-xs">NPS (80CCD)</Label>
                            <Input type="number" value={deductions.nps} onChange={(e) => updateDeduction("nps", e.target.value)}
                              className="premium-input mt-1" placeholder="Max ₹50,000" />
                          </div>
                          <div>
                            <Label className="text-xs">Home Loan Interest (Sec 24)</Label>
                            <Input type="number" value={deductions.homeLoan} onChange={(e) => updateDeduction("homeLoan", e.target.value)}
                              className="premium-input mt-1" placeholder="Max ₹2,00,000" />
                          </div>
                          <div>
                            <Label className="text-xs">Other Deductions</Label>
                            <Input type="number" value={deductions.other} onChange={(e) => updateDeduction("other", e.target.value)}
                              className="premium-input mt-1" placeholder="Education loan, etc." />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Results Summary ───────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: IndianRupee, label: "Old Regime Tax", value: fmt(oldTax), color: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30", ic: "text-violet-600 dark:text-violet-400" },
                { icon: IndianRupee, label: "New Regime Tax", value: fmt(newTax), color: "from-blue-500 to-cyan-600", bg: "bg-blue-50 dark:bg-blue-950/30", ic: "text-blue-600 dark:text-blue-400" },
                { icon: TrendingUp, label: "You Save", value: fmt(savings), sub: `with ${betterRegime} Regime`, color: "from-emerald-500 to-green-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", ic: "text-emerald-600 dark:text-emerald-400" },
                { icon: Target, label: "Effective Rate", value: `${effectiveRate}%`, color: "from-amber-500 to-orange-600", bg: "bg-amber-50 dark:bg-amber-950/30", ic: "text-amber-600 dark:text-amber-400" },
              ].map((stat, i) => (
                <Card key={stat.label} className="border-border/50 relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-500">
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color}`} />
                  <CardContent className="p-5">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-5 h-5 ${stat.ic}`} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                    {stat.sub && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">✓ {stat.sub}</p>}
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* ── AI Recommendation Banner ──────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className={`rounded-2xl border p-6 ${betterRegime === "New"
                ? "border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5"
                : "border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5"}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${betterRegime === "New" ? "bg-cyan-500/10" : "bg-violet-500/10"}`}>
                    <Sparkles className={`w-6 h-6 ${betterRegime === "New" ? "text-cyan-500" : "text-violet-500"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">AI Recommends: {betterRegime} Tax Regime</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Based on your income of {fmt(income)} and deductions totaling {fmt(usedDeductions + deductions.hra + deductions.other + 50000)},
                      the <strong>{betterRegime} Regime saves you {fmt(savings)}</strong> this year.
                      {totalPotentialSavings > 0 && ` You can save an additional ${fmt(totalPotentialSavings)} by optimizing deductions.`}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Charts Row ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Regime Comparison */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">Regime Comparison</CardTitle>
                    <CardDescription>Tax liability under each regime</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={comparisonData} barSize={60}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))"
                          tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Tax"]}
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        <Bar dataKey="tax" radius={[8, 8, 0, 0]}>
                          {comparisonData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Deduction Breakdown */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card className="border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Deduction Breakdown</CardTitle>
                        <CardDescription>Your current tax-saving investments</CardDescription>
                      </div>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${utilizationPct >= 80 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" :
                        utilizationPct >= 50 ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600" :
                        "bg-red-50 dark:bg-red-950/40 text-red-600"}`}>{utilizationPct}% utilized</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {deductionPie.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={deductionPie} cx="50%" cy="50%" outerRadius={90} innerRadius={55}
                            paddingAngle={3} dataKey="value" nameKey="name"
                            label={({ name, value }) => `${name}: ₹${(value / 1000).toFixed(0)}k`}>
                            {deductionPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Amount"]}
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
                        <Calculator className="w-8 h-8 mb-3 opacity-40" />
                        <p className="text-sm">No deductions entered yet</p>
                        <p className="text-xs mt-1">Add investments above to see your breakdown</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* ── 3-Year Projection ─────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> 3-Year Tax Projection
                      </CardTitle>
                      <CardDescription>Projected tax liability based on income growth</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs whitespace-nowrap">Growth Rate</Label>
                      <input type="range" min={0} max={30} step={1} value={growthRate}
                        onChange={(e) => setGrowthRate(Number(e.target.value))}
                        className="w-24 h-2 rounded-full appearance-none cursor-pointer bg-secondary accent-emerald-500" />
                      <span className="text-sm font-semibold w-10 text-right">{growthRate}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={projectionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))"
                        tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} />
                      <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, ""]}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                      <Line type="monotone" dataKey="oldTax" name="Old Regime" stroke="#6366f1" strokeWidth={2.5}
                        dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="newTax" name="New Regime" stroke="#06b6d4" strokeWidth={2.5}
                        dot={{ fill: "#06b6d4", r: 4 }} activeDot={{ r: 6 }} strokeDasharray="5 5" />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── AI Recommendations ────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">AI Recommendations</h2>
                  <p className="text-sm text-muted-foreground">Personalized tax-saving strategies</p>
                </div>
              </div>

              <div className="space-y-4">
                {recommendations.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">You're fully optimized!</h3>
                      <p className="text-muted-foreground text-sm">All major deduction categories are maximized. Great tax planning!</p>
                    </CardContent>
                  </Card>
                ) : (
                  recommendations.map((rec, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08, duration: 0.4, ease: easing }}>
                      <Card className={`border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ${rec.priority === "high" ? "border-l-4 border-l-amber-500" : rec.priority === "info" ? "border-l-4 border-l-blue-500" : ""}`}>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <span className="text-2xl">{rec.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                <h3 className="font-semibold">{rec.title}</h3>
                                {rec.impact > 0 && (
                                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                    Save {fmt(rec.impact)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{rec.desc}</p>
                              <div className="flex flex-wrap gap-2">
                                {rec.actions.map((action, j) => (
                                  <span key={j} className="text-[11px] px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground">
                                    {action}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* ── CTA ──────────────────────────────────────────────── */}
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
