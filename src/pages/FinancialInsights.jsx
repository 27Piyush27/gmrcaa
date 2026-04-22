import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb,
  ArrowRight, Sparkles, Zap, Target, Eye, BarChart3, Activity
} from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

// ── Simulated Financial Data ────────────────────────────────────────────────
const MONTHLY_DATA = [
  { month: "Oct", income: 320000, expense: 185000, rent: 45000, software: 12000, travel: 8000, salary: 95000, food: 6000, other: 19000 },
  { month: "Nov", income: 340000, expense: 192000, rent: 45000, software: 12000, travel: 15000, salary: 95000, food: 7000, other: 18000 },
  { month: "Dec", income: 380000, expense: 210000, rent: 45000, software: 15000, travel: 22000, salary: 95000, food: 12000, other: 21000 },
  { month: "Jan", income: 350000, expense: 178000, rent: 45000, software: 12000, travel: 6000, salary: 95000, food: 5000, other: 15000 },
  { month: "Feb", income: 360000, expense: 195000, rent: 45000, software: 12000, travel: 10000, salary: 100000, food: 8000, other: 20000 },
  { month: "Mar", income: 410000, expense: 245000, rent: 45000, software: 18000, travel: 35000, salary: 100000, food: 14000, other: 33000 },
];

// ── Simple Linear Regression for Predictions ────────────────────────────────
function linearRegression(data) {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  data.forEach((y, x) => { sumX += x; sumY += y; sumXY += x * y; sumXX += x * x; });
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept, predict: (x) => Math.round(Math.max(0, intercept + slope * x)) };
}

// ── Anomaly Detection (Z-score based) ───────────────────────────────────────
function detectAnomalies(data, key, threshold = 1.5) {
  const values = data.map(d => d[key]);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
  return data.map((d, i) => ({
    ...d,
    zScore: std > 0 ? ((d[key] - mean) / std) : 0,
    isAnomaly: std > 0 && Math.abs((d[key] - mean) / std) > threshold,
    deviation: std > 0 ? Math.round(((d[key] - mean) / mean) * 100) : 0,
  })).filter(d => d.isAnomaly);
}

// ── Natural Language Insight Generation ─────────────────────────────────────
function generateInsights(data) {
  const insights = [];
  const latest = data[data.length - 1];
  const prev = data[data.length - 2];

  // Income trend
  const incomeModel = linearRegression(data.map(d => d.income));
  const incomeGrowth = ((incomeModel.slope / data[0].income) * 100).toFixed(1);
  if (incomeModel.slope > 0) {
    insights.push({
      type: "positive", icon: TrendingUp, priority: 1,
      title: "Revenue Growing Steadily",
      text: `Your income has been growing at ~${incomeGrowth}% per month. At this rate, projected revenue for next quarter is ₹${((incomeModel.predict(data.length) + incomeModel.predict(data.length + 1) + incomeModel.predict(data.length + 2)) / 100000).toFixed(1)}L.`,
      metric: `+${incomeGrowth}%/mo`,
    });
  }

  // Expense spike
  const expenseChange = ((latest.expense - prev.expense) / prev.expense * 100).toFixed(0);
  if (Math.abs(Number(expenseChange)) > 15) {
    insights.push({
      type: Number(expenseChange) > 0 ? "warning" : "positive",
      icon: Number(expenseChange) > 0 ? AlertTriangle : TrendingDown,
      priority: 2,
      title: Number(expenseChange) > 0 ? "Expense Spike Detected" : "Expenses Decreased",
      text: `${latest.month} expenses ${Number(expenseChange) > 0 ? "jumped" : "dropped"} ${Math.abs(Number(expenseChange))}% vs ${prev.month}. Main driver: ${latest.travel > prev.travel * 1.5 ? "Travel costs" : latest.software > prev.software * 1.3 ? "Software subscriptions" : "Miscellaneous spending"}.`,
      metric: `${expenseChange}%`,
    });
  }

  // Savings rate
  const savingsRate = ((latest.income - latest.expense) / latest.income * 100).toFixed(0);
  insights.push({
    type: Number(savingsRate) > 40 ? "positive" : Number(savingsRate) > 25 ? "info" : "warning",
    icon: Target, priority: 3,
    title: `Savings Rate: ${savingsRate}%`,
    text: `You saved ₹${((latest.income - latest.expense) / 1000).toFixed(0)}K in ${latest.month}. ${Number(savingsRate) > 40 ? "Excellent financial discipline!" : Number(savingsRate) > 25 ? "Good savings rate. Consider increasing investments." : "Consider reviewing discretionary spending to improve savings."}`,
    metric: `${savingsRate}%`,
  });

  // Category insight
  const travelTotal = data.reduce((s, d) => s + d.travel, 0);
  const avgTravel = travelTotal / data.length;
  if (latest.travel > avgTravel * 1.5) {
    insights.push({
      type: "info", icon: Eye, priority: 4,
      title: "Travel Costs Above Average",
      text: `${latest.month} travel spending (₹${(latest.travel / 1000).toFixed(0)}K) is ${Math.round(((latest.travel - avgTravel) / avgTravel) * 100)}% above your 6-month average. Consider video meetings for routine client calls.`,
      metric: `₹${(latest.travel / 1000).toFixed(0)}K`,
    });
  }

  // Cash flow forecast
  const cashflowModel = linearRegression(data.map(d => d.income - d.expense));
  const nextMonthCF = cashflowModel.predict(data.length);
  insights.push({
    type: "info", icon: Activity, priority: 5,
    title: "Cash Flow Forecast",
    text: `Projected net cash flow for next month: ₹${(nextMonthCF / 1000).toFixed(0)}K. Based on 6-month trend analysis using linear regression.`,
    metric: `₹${(nextMonthCF / 1000).toFixed(0)}K`,
  });

  return insights.sort((a, b) => a.priority - b.priority);
}

// ── Component ───────────────────────────────────────────────────────────────
export default function FinancialInsights() {
  const data = MONTHLY_DATA;
  const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;

  // Predictions
  const incomeModel = useMemo(() => linearRegression(data.map(d => d.income)), [data]);
  const expenseModel = useMemo(() => linearRegression(data.map(d => d.expense)), [data]);

  const chartData = useMemo(() => {
    const actual = data.map((d, i) => ({ ...d, idx: i, predicted: false }));
    const predicted = ["Apr", "May", "Jun"].map((month, i) => ({
      month, idx: data.length + i, predicted: true,
      income: incomeModel.predict(data.length + i),
      expense: expenseModel.predict(data.length + i),
      rent: 45000, software: 12000, travel: 10000, salary: 100000, food: 7000, other: 18000,
    }));
    return [...actual, ...predicted];
  }, [data, incomeModel, expenseModel]);

  const anomalies = useMemo(() => detectAnomalies(data, "expense"), [data]);
  const insights = useMemo(() => generateInsights(data), [data]);

  // Heatmap data
  const categories = ["rent", "software", "travel", "salary", "food", "other"];
  const categoryLabels = { rent: "Rent", software: "Software", travel: "Travel", salary: "Salary", food: "F&B", other: "Other" };

  // Summary stats
  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpense = data.reduce((s, d) => s + d.expense, 0);
  const avgMonthlyProfit = Math.round((totalIncome - totalExpense) / data.length);
  const profitMargin = ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1);

  const typeStyles = {
    positive: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-400", badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" },
    warning: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-400", badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" },
    info: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", text: "text-blue-700 dark:text-blue-400", badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" },
  };

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-blue-400/[0.05] blur-3xl pointer-events-none animate-breathe"
            style={{ willChange: "transform", transform: "translateZ(0)" }} />

          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <BarChart3 className="w-3.5 h-3.5" /> Data Science
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              Financial <span className="italic gradient-text-premium">Insights</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              Predictive analytics, anomaly detection, and AI-generated insights from your financial data.
            </motion.p>
          </div>
        </section>

        {/* ── Content ──────────────────────────────────────────────── */}
        <section className="py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 space-y-8">

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: TrendingUp, label: "Total Revenue", value: fmt(totalIncome), color: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30", ic: "text-violet-600 dark:text-violet-400" },
                { icon: TrendingDown, label: "Total Expenses", value: fmt(totalExpense), color: "from-blue-500 to-cyan-600", bg: "bg-blue-50 dark:bg-blue-950/30", ic: "text-blue-600 dark:text-blue-400" },
                { icon: Target, label: "Avg Monthly Profit", value: fmt(avgMonthlyProfit), color: "from-emerald-500 to-green-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", ic: "text-emerald-600 dark:text-emerald-400" },
                { icon: Zap, label: "Profit Margin", value: `${profitMargin}%`, color: "from-amber-500 to-orange-600", bg: "bg-amber-50 dark:bg-amber-950/30", ic: "text-amber-600 dark:text-amber-400" },
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

            {/* ── Revenue vs Expense with Predictions ─────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-500" /> Revenue vs Expense — with AI Predictions
                  </CardTitle>
                  <CardDescription>Solid lines = actual • Dashed lines = ML predictions (linear regression)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={340}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, ""]}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                      <Area type="monotone" dataKey="income" name="Income" stroke="#6366f1" fill="url(#incomeGrad)" strokeWidth={2.5} />
                      <Area type="monotone" dataKey="expense" name="Expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2.5} strokeDasharray={chartData.some(d => d.predicted) ? undefined : undefined} />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground justify-center">
                    <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#6366f1] rounded inline-block" /> Actual + Predicted Income</span>
                    <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#ef4444] rounded inline-block" /> Actual + Predicted Expenses</span>
                    <span className="px-2 py-0.5 bg-violet-50 dark:bg-violet-950/30 rounded text-violet-600 dark:text-violet-400 font-medium">Apr–Jun = AI Predictions</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Spending Heatmap ─────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Category Spending Heatmap</CardTitle>
                  <CardDescription>Intensity shows spending concentration across categories and months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left text-xs text-muted-foreground font-medium pb-3 pr-4 whitespace-nowrap">Category</th>
                          {data.map(d => <th key={d.month} className="text-center text-xs text-muted-foreground font-medium pb-3 px-2">{d.month}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(cat => {
                          const maxVal = Math.max(...data.map(d => d[cat]));
                          return (
                            <tr key={cat}>
                              <td className="text-xs font-medium py-1.5 pr-4 whitespace-nowrap">{categoryLabels[cat]}</td>
                              {data.map(d => {
                                const val = d[cat];
                                const intensity = maxVal > 0 ? val / maxVal : 0;
                                return (
                                  <td key={d.month} className="px-1 py-1.5">
                                    <motion.div
                                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                                      className="rounded-lg h-10 flex items-center justify-center text-[10px] font-medium relative group cursor-default"
                                      style={{
                                        backgroundColor: `hsl(${intensity > 0.7 ? "0 80% 50%" : intensity > 0.4 ? "38 90% 50%" : "142 70% 45%"} / ${0.1 + intensity * 0.25})`,
                                        color: intensity > 0.5 ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                                      }}>
                                      ₹{(val / 1000).toFixed(0)}k
                                    </motion.div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Anomaly Detection ────────────────────────────────── */}
            {anomalies.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Anomaly Detection</h2>
                    <p className="text-sm text-muted-foreground">Unusual spending patterns identified by Z-score analysis</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {anomalies.map((a, i) => (
                    <Card key={i} className="border-border/50 border-l-4 border-l-amber-500">
                      <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <h4 className="font-semibold text-sm">{a.month} — Expense Anomaly</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Expenses of {`₹${a.expense.toLocaleString("en-IN")}`} are {a.deviation}% above the 6-month average.
                            Z-Score: {a.zScore.toFixed(2)} (threshold: 1.5)
                          </p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                          ⚠️ Z={a.zScore.toFixed(2)}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── AI Insights ──────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">AI-Generated Insights</h2>
                  <p className="text-sm text-muted-foreground">Auto-analyzed from your 6-month financial data</p>
                </div>
              </div>

              <div className="space-y-3">
                {insights.map((insight, i) => {
                  const Icon = insight.icon;
                  const style = typeStyles[insight.type] || typeStyles.info;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.08, ease: easing }}>
                      <Card className={`${style.bg} border ${style.border} hover:shadow-md transition-all duration-300`}>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl ${style.badge} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                <h4 className="font-semibold">{insight.title}</h4>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
                                  {insight.metric}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">{insight.text}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* ── CTA ──────────────────────────────────────────────── */}
            <ScrollReveal>
              <div className="mt-16 text-center">
                <p className="text-muted-foreground mb-4">Want expert analysis of your financial health?</p>
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <Link to="/services">Talk to a CA <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
