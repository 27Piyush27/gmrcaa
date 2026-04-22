import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Brain, TrendingUp, Sparkles, ArrowRight, Zap, Target,
  IndianRupee, AlertTriangle, CheckCircle, Lightbulb, Shield,
  Activity, PiggyBank, Wallet
} from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

// ── Monte Carlo Simulation Engine ───────────────────────────────────────────
function monteCarloSimulation(params, months = 12, iterations = 500) {
  const { income, fixedExpenses, variableExpenses, incomeVolatility = 0.08, expenseVolatility = 0.15 } = params;
  const allPaths = [];

  for (let iter = 0; iter < iterations; iter++) {
    let balance = 0;
    const path = [];
    for (let m = 0; m < months; m++) {
      const incomeNoise = 1 + (Math.random() - 0.5) * 2 * incomeVolatility;
      const expenseNoise = 1 + (Math.random() - 0.5) * 2 * expenseVolatility;
      const monthIncome = income * incomeNoise;
      const monthExpense = fixedExpenses + variableExpenses * expenseNoise;
      balance += monthIncome - monthExpense;
      path.push(balance);
    }
    allPaths.push(path);
  }

  const result = [];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();

  for (let m = 0; m < months; m++) {
    const values = allPaths.map(p => p[m]).sort((a, b) => a - b);
    const mi = Math.floor(now.getMonth() + m + 1) % 12;
    result.push({
      month: monthNames[mi],
      p10: Math.round(values[Math.floor(iterations * 0.1)]),
      p25: Math.round(values[Math.floor(iterations * 0.25)]),
      p50: Math.round(values[Math.floor(iterations * 0.5)]),
      p75: Math.round(values[Math.floor(iterations * 0.75)]),
      p90: Math.round(values[Math.floor(iterations * 0.9)]),
      mean: Math.round(values.reduce((a, b) => a + b, 0) / iterations),
    });
  }
  return result;
}

function generateCFRecommendations(params, simData) {
  const recs = [];
  const { income, fixedExpenses, variableExpenses, savingsGoal = 0 } = params;
  const totalExpense = fixedExpenses + variableExpenses;
  const monthlySavings = income - totalExpense;
  const savingsRate = income > 0 ? (monthlySavings / income * 100) : 0;
  const endMedian = simData[simData.length - 1]?.p50 || 0;
  const endWorst = simData[simData.length - 1]?.p10 || 0;
  const emergencyMonths = monthlySavings > 0 ? Math.round(totalExpense * 6 / monthlySavings) : 0;

  if (savingsRate < 20) {
    recs.push({ icon: "🎯", title: "Increase Savings Rate", priority: "high",
      text: `Your savings rate is ${savingsRate.toFixed(0)}%. Aim for at least 20% by reducing variable expenses by ₹${Math.round((totalExpense * 0.2 - monthlySavings) / 1000) * 1000}.`,
      impact: Math.round((income * 0.2 - monthlySavings) * 12) });
  }
  if (variableExpenses > fixedExpenses * 0.8) {
    recs.push({ icon: "📊", title: "High Variable Expenses", priority: "medium",
      text: `Variable expenses (₹${(variableExpenses/1000).toFixed(0)}K) are high relative to fixed costs. Consider budgeting discretionary spending to reduce volatility.`,
      impact: Math.round(variableExpenses * 0.15 * 12) });
  }
  if (endWorst < 0) {
    recs.push({ icon: "⚠️", title: "Negative Cash Flow Risk", priority: "high",
      text: `In worst-case scenarios, your cumulative cash flow turns negative by month ${simData.findIndex(d => d.p10 < 0) + 1}. Build an emergency buffer.`,
      impact: Math.abs(endWorst) });
  }
  if (savingsGoal > 0 && endMedian < savingsGoal) {
    const gap = savingsGoal - endMedian;
    recs.push({ icon: "💰", title: "Savings Goal Gap", priority: "high",
      text: `You're projected ₹${(gap/1000).toFixed(0)}K short of your ₹${(savingsGoal/1000).toFixed(0)}K goal. Increase monthly savings by ₹${Math.round(gap / 12 / 100) * 100}.`,
      impact: gap });
  }
  if (savingsRate >= 30) {
    recs.push({ icon: "🏆", title: "Excellent Savings Discipline", priority: "info",
      text: `Your ${savingsRate.toFixed(0)}% savings rate is outstanding. Consider investing surplus in ELSS, NPS, or PPF for tax benefits.`,
      impact: 0 });
  }
  recs.push({ icon: "🛡️", title: "Emergency Fund Status", priority: monthlySavings > 0 ? "info" : "high",
    text: monthlySavings > 0
      ? `At current savings rate, you'll build a 6-month emergency fund (₹${(totalExpense * 6 / 100000).toFixed(1)}L) in ${emergencyMonths} months.`
      : "You're spending more than you earn. An emergency fund is critical — consider cutting expenses immediately.",
    impact: 0 });

  return recs.sort((a, b) => (b.impact || 0) - (a.impact || 0));
}

// ── Component ───────────────────────────────────────────────────────────────
export default function CashFlowForecaster() {
  const [income, setIncome] = useState(120000);
  const [fixedExpenses, setFixedExpenses] = useState(45000);
  const [variableExpenses, setVariableExpenses] = useState(30000);
  const [savingsGoal, setSavingsGoal] = useState(500000);
  const [months, setMonths] = useState(12);

  const params = useMemo(() => ({ income, fixedExpenses, variableExpenses, savingsGoal }), [income, fixedExpenses, variableExpenses, savingsGoal]);
  const simData = useMemo(() => monteCarloSimulation(params, months), [params, months]);
  const recommendations = useMemo(() => generateCFRecommendations(params, simData), [params, simData]);

  const monthlySavings = income - fixedExpenses - variableExpenses;
  const savingsRate = income > 0 ? (monthlySavings / income * 100).toFixed(1) : "0.0";
  const endMedian = simData[simData.length - 1]?.p50 || 0;
  const endBest = simData[simData.length - 1]?.p90 || 0;
  const endWorst = simData[simData.length - 1]?.p10 || 0;
  const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;
  const sliderClass = "w-full h-2 rounded-full appearance-none cursor-pointer bg-secondary accent-primary";

  const scenarioData = [
    { scenario: "Worst Case", value: endWorst, fill: "#ef4444" },
    { scenario: "Expected", value: endMedian, fill: "#6366f1" },
    { scenario: "Best Case", value: endBest, fill: "#10b981" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-emerald-400/[0.06] blur-3xl pointer-events-none animate-breathe"
            style={{ willChange: "transform", transform: "translateZ(0)" }} />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Activity className="w-3.5 h-3.5" /> Monte Carlo Simulation
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              Cash Flow <span className="italic gradient-text-premium">Forecaster</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              Simulate 500 scenarios to forecast your financial future with confidence intervals and AI-powered recommendations.
            </motion.p>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 space-y-8">
            {/* Input Panel */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-border/50 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    Financial Parameters
                  </CardTitle>
                  <CardDescription>Adjust your income and expenses — forecast updates in real time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label className="text-sm font-medium">Monthly Income</Label>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmt(income)}</span>
                      </div>
                      <input type="range" min={20000} max={1000000} step={5000} value={income}
                        onChange={e => setIncome(Number(e.target.value))} className={sliderClass} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label className="text-sm font-medium">Fixed Expenses (Rent, EMI, etc.)</Label>
                        <span className="text-lg font-bold text-red-500">{fmt(fixedExpenses)}</span>
                      </div>
                      <input type="range" min={5000} max={500000} step={5000} value={fixedExpenses}
                        onChange={e => setFixedExpenses(Number(e.target.value))} className={sliderClass} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label className="text-sm font-medium">Variable Expenses (Food, Travel, etc.)</Label>
                        <span className="text-lg font-bold text-amber-500">{fmt(variableExpenses)}</span>
                      </div>
                      <input type="range" min={5000} max={500000} step={5000} value={variableExpenses}
                        onChange={e => setVariableExpenses(Number(e.target.value))} className={sliderClass} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label className="text-sm font-medium">Annual Savings Goal</Label>
                        <span className="text-lg font-bold text-violet-500">{fmt(savingsGoal)}</span>
                      </div>
                      <input type="range" min={0} max={5000000} step={50000} value={savingsGoal}
                        onChange={e => setSavingsGoal(Number(e.target.value))} className={sliderClass} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Label className="text-xs whitespace-nowrap">Forecast Period</Label>
                    <div className="flex gap-2">
                      {[6, 12, 24].map(m => (
                        <button key={m} onClick={() => setMonths(m)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${months === m
                            ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                          {m} months
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: IndianRupee, label: "Monthly Savings", value: fmt(monthlySavings), color: "from-emerald-500 to-green-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", ic: "text-emerald-600 dark:text-emerald-400" },
                { icon: Target, label: "Savings Rate", value: `${savingsRate}%`, color: "from-blue-500 to-cyan-600", bg: "bg-blue-50 dark:bg-blue-950/30", ic: "text-blue-600 dark:text-blue-400" },
                { icon: TrendingUp, label: `${months}M Expected`, value: fmt(endMedian), color: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30", ic: "text-violet-600 dark:text-violet-400" },
                { icon: Shield, label: "Emergency Fund", value: `${monthlySavings > 0 ? Math.round((fixedExpenses + variableExpenses) * 6 / monthlySavings) : "∞"} mo`, color: "from-amber-500 to-orange-600", bg: "bg-amber-50 dark:bg-amber-950/30", ic: "text-amber-600 dark:text-amber-400" },
              ].map(stat => (
                <Card key={stat.label} className="border-border/50 relative overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-500">
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color}`} />
                  <CardContent className="p-5">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-5 h-5 ${stat.ic}`} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Fan Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-500" /> Cumulative Cash Flow — Monte Carlo Fan Chart
                  </CardTitle>
                  <CardDescription>500 simulations • Shaded areas show confidence intervals (10th–90th percentile)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={360}>
                    <AreaChart data={simData}>
                      <defs>
                        <linearGradient id="cfGrad90" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.08} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cfGrad75" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))"
                        tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, ""]}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                      <Area type="monotone" dataKey="p90" stroke="none" fill="url(#cfGrad90)" name="90th %ile" />
                      <Area type="monotone" dataKey="p75" stroke="none" fill="url(#cfGrad75)" name="75th %ile" />
                      <Area type="monotone" dataKey="p25" stroke="none" fill="url(#cfGrad75)" name="25th %ile" />
                      <Area type="monotone" dataKey="p10" stroke="none" fill="url(#cfGrad90)" name="10th %ile" />
                      <Line type="monotone" dataKey="p50" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Median" />
                      <Line type="monotone" dataKey="p90" stroke="#10b981" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Best Case" />
                      <Line type="monotone" dataKey="p10" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Worst Case" />
                      {savingsGoal > 0 && (
                        <Line type="monotone" dataKey={() => savingsGoal} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="8 4" dot={false} name="Goal" />
                      )}
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground justify-center">
                    <span className="px-2 py-0.5 bg-violet-50 dark:bg-violet-950/30 rounded text-violet-600 dark:text-violet-400 font-medium">500 Monte Carlo Simulations</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Scenario Comparison */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Scenario Analysis — End of {months} Months</CardTitle>
                  <CardDescription>Projected cumulative savings across scenarios</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={scenarioData} barSize={60}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="scenario" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))"
                        tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} />
                      <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Savings"]}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {scenarioData.map((entry, i) => (
                          <motion.rect key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Recommendations */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">AI Recommendations</h2>
                  <p className="text-sm text-muted-foreground">Personalized cash flow optimization strategies</p>
                </div>
              </div>
              <div className="space-y-4">
                {recommendations.map((rec, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.08, ease: easing }}>
                    <Card className={`border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ${
                      rec.priority === "high" ? "border-l-4 border-l-amber-500" : rec.priority === "info" ? "border-l-4 border-l-blue-500" : ""}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <span className="text-2xl">{rec.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                              <h3 className="font-semibold">{rec.title}</h3>
                              {rec.impact > 0 && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                  {fmt(rec.impact)} impact
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{rec.text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <ScrollReveal>
              <div className="mt-16 text-center">
                <p className="text-muted-foreground mb-4">Need expert financial planning advice from a CA?</p>
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <Link to="/services">Get Expert Advisory <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
