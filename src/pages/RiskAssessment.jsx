import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import {
  Shield, AlertTriangle, CheckCircle, TrendingUp, ArrowRight,
  Brain, Target, Clock, FileText, IndianRupee, Users, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

// ── Risk Scoring Engine ─────────────────────────────────────────────────────
function calculateRiskScore(profile) {
  const dimensions = {
    "Filing Timeliness": {
      score: profile.filingOnTime ? 90 : profile.filingLate ? 50 : 20,
      weight: 0.25,
      detail: profile.filingOnTime ? "All filings submitted on time" : profile.filingLate ? "Some filings delayed" : "Multiple filings overdue",
    },
    "Payment Regularity": {
      score: profile.paymentsCurrent ? 95 : profile.paymentsPartial ? 60 : 30,
      weight: 0.20,
      detail: profile.paymentsCurrent ? "All payments current" : profile.paymentsPartial ? "Some payments pending" : "Multiple overdue payments",
    },
    "Document Completeness": {
      score: Math.min(100, (profile.documentsUploaded / profile.documentsRequired) * 100),
      weight: 0.20,
      detail: `${profile.documentsUploaded}/${profile.documentsRequired} documents uploaded`,
    },
    "Compliance History": {
      score: profile.complianceHistory,
      weight: 0.15,
      detail: profile.complianceHistory >= 80 ? "Strong compliance track record" : profile.complianceHistory >= 60 ? "Minor compliance gaps" : "Compliance needs improvement",
    },
    "Audit Readiness": {
      score: profile.auditReady ? 85 : 40,
      weight: 0.10,
      detail: profile.auditReady ? "Books are audit-ready" : "Books need reconciliation",
    },
    "Tax Planning": {
      score: profile.taxPlanningScore,
      weight: 0.10,
      detail: profile.taxPlanningScore >= 80 ? "Proactive tax planning in place" : profile.taxPlanningScore >= 50 ? "Basic tax planning done" : "Tax planning needs attention",
    },
  };

  const overall = Math.round(
    Object.values(dimensions).reduce((sum, d) => sum + d.score * d.weight, 0)
  );

  return { overall, dimensions };
}

function getRiskLevel(score) {
  if (score >= 80) return { level: "Low", color: "text-emerald-500", bg: "from-emerald-500 to-green-600", ring: "stroke-emerald-500", badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" };
  if (score >= 60) return { level: "Moderate", color: "text-amber-500", bg: "from-amber-500 to-orange-600", ring: "stroke-amber-500", badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" };
  if (score >= 40) return { level: "Elevated", color: "text-orange-500", bg: "from-orange-500 to-red-600", ring: "stroke-orange-500", badge: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400" };
  return { level: "High", color: "text-red-500", bg: "from-red-500 to-red-700", ring: "stroke-red-500", badge: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400" };
}

// ── Simulated Data ──────────────────────────────────────────────────────────
const USER_PROFILE = {
  filingOnTime: true, filingLate: false,
  paymentsCurrent: true, paymentsPartial: false,
  documentsUploaded: 6, documentsRequired: 8,
  complianceHistory: 78,
  auditReady: false,
  taxPlanningScore: 55,
};

const HISTORICAL_SCORES = [
  { month: "Oct", score: 62 }, { month: "Nov", score: 65 },
  { month: "Dec", score: 70 }, { month: "Jan", score: 72 },
  { month: "Feb", score: 74 }, { month: "Mar", score: 78 },
];

const INDUSTRY_AVG = {
  "Filing Timeliness": 72, "Payment Regularity": 68, "Document Completeness": 60,
  "Compliance History": 65, "Audit Readiness": 55, "Tax Planning": 48,
};

// ── Remediation Plan Generator ──────────────────────────────────────────────
function generateRemediation(dimensions) {
  const actions = [];
  Object.entries(dimensions).forEach(([name, dim]) => {
    if (dim.score < 70) {
      const actionMap = {
        "Filing Timeliness": [
          { action: "Set up automated filing reminders", impact: "high", effort: "low", icon: Clock },
          { action: "Pre-schedule quarterly filings with CA", impact: "high", effort: "medium", icon: FileText },
        ],
        "Payment Regularity": [
          { action: "Enable auto-debit for advance tax payments", impact: "high", effort: "low", icon: IndianRupee },
          { action: "Clear any pending invoices within 7 days", impact: "high", effort: "medium", icon: CheckCircle },
        ],
        "Document Completeness": [
          { action: "Upload missing financial documents", impact: "high", effort: "low", icon: FileText },
          { action: "Request Form 16 from employer", impact: "medium", effort: "low", icon: FileText },
        ],
        "Compliance History": [
          { action: "Review past filing dates and rectify delays", impact: "medium", effort: "medium", icon: Shield },
          { action: "File revised returns if applicable", impact: "high", effort: "high", icon: FileText },
        ],
        "Audit Readiness": [
          { action: "Reconcile bank statements with books", impact: "high", effort: "medium", icon: Target },
          { action: "Schedule monthly book closure", impact: "medium", effort: "low", icon: Clock },
        ],
        "Tax Planning": [
          { action: "Maximize Section 80C investments", impact: "high", effort: "low", icon: TrendingUp },
          { action: "Review tax regime choice with CA", impact: "high", effort: "low", icon: Brain },
          { action: "Explore NPS and health insurance deductions", impact: "medium", effort: "low", icon: Shield },
        ],
      };
      const mapped = actionMap[name] || [];
      mapped.forEach(a => actions.push({ ...a, category: name, currentScore: Math.round(dim.score) }));
    }
  });
  return actions.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    const effortOrder = { low: 3, medium: 2, high: 1 };
    return (impactOrder[b.impact] * effortOrder[b.effort]) - (impactOrder[a.impact] * effortOrder[a.effort]);
  });
}

// ── Component ───────────────────────────────────────────────────────────────
export default function RiskAssessment() {
  const { overall, dimensions } = useMemo(() => calculateRiskScore(USER_PROFILE), []);
  const riskLevel = getRiskLevel(overall);
  const remediation = useMemo(() => generateRemediation(dimensions), [dimensions]);

  // Radar chart data
  const radarData = Object.entries(dimensions).map(([name, dim]) => ({
    dimension: name.replace(" ", "\n"),
    score: Math.round(dim.score),
    industry: INDUSTRY_AVG[name] || 60,
    fullMark: 100,
  }));

  const impactColors = { high: "text-emerald-600 dark:text-emerald-400", medium: "text-amber-600 dark:text-amber-400", low: "text-muted-foreground" };
  const effortBadge = { low: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400", medium: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400", high: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400" };

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-orange-400/[0.05] blur-3xl pointer-events-none animate-breathe"
            style={{ willChange: "transform", transform: "translateZ(0)" }} />

          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Shield className="w-3.5 h-3.5" /> ML Risk Analysis
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              AI Risk <span className="italic gradient-text-premium">Assessment</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              Multi-factor compliance risk scoring with radar analysis, trend tracking, and AI-generated remediation plans.
            </motion.p>
          </div>
        </section>

        {/* ── Content ──────────────────────────────────────────────── */}
        <section className="py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 space-y-8">

            {/* ── Overall Score Card ───────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/50 overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${riskLevel.bg}`} />
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    {/* Score Ring */}
                    <div className="relative w-44 h-44 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="currentColor" className="text-secondary" strokeWidth="2.5" />
                        <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" className={riskLevel.ring} strokeWidth="2.5" strokeLinecap="round"
                          initial={{ strokeDasharray: "0, 100" }}
                          animate={{ strokeDasharray: `${overall}, 100` }}
                          transition={{ duration: 1.5, ease: easing }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-bold ${riskLevel.color}`}>{overall}</span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
                        <h2 className={`text-2xl font-bold ${riskLevel.color}`}>{riskLevel.level} Risk</h2>
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${riskLevel.badge}`}>{riskLevel.level}</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        {overall >= 80 ? "Your compliance profile is strong. Keep maintaining current practices for continued low-risk status." :
                         overall >= 60 ? "Your overall compliance is good but there are areas that need attention to reduce risk exposure." :
                         "Several compliance areas need immediate attention. Follow the remediation plan below to improve your score."}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {Object.entries(dimensions).map(([name, dim]) => (
                          <span key={name} className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                            dim.score >= 80 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" :
                            dim.score >= 60 ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" :
                            "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"}`}>
                            {name}: {Math.round(dim.score)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Charts Row ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="w-4 h-4 text-violet-500" /> Risk Radar Analysis
                    </CardTitle>
                    <CardDescription>Your score vs industry average across 6 dimensions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Radar name="Your Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                        <Radar name="Industry Avg" dataKey="industry" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="5 5" />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#6366f1]/20 border border-[#6366f1] inline-block" /> Your Score</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#94a3b8]/10 border border-[#94a3b8] border-dashed inline-block" /> Industry Average</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Historical Trend */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> Risk Score Trend
                    </CardTitle>
                    <CardDescription>Your compliance score over the past 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={HISTORICAL_SCORES}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5}
                          dot={{ fill: "#6366f1", r: 5 }} activeDot={{ r: 7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-between mt-4 text-xs">
                      <span className="text-muted-foreground">6-month improvement</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{HISTORICAL_SCORES[HISTORICAL_SCORES.length - 1].score - HISTORICAL_SCORES[0].score} points ↑
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* ── Dimension Breakdown ──────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" /> Dimension Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(dimensions).map(([name, dim], i) => {
                  const score = Math.round(dim.score);
                  const industry = INDUSTRY_AVG[name] || 60;
                  const vsIndustry = score - industry;
                  return (
                    <motion.div key={name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}>
                      <Card className="border-border/50 hover:shadow-md transition-all duration-300">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm">{name}</h4>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500"}`}>
                                {score}/100
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${vsIndustry >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" : "bg-red-50 dark:bg-red-950/40 text-red-600"}`}>
                                {vsIndustry >= 0 ? "+" : ""}{vsIndustry} vs avg
                              </span>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
                              transition={{ duration: 0.8, ease: easing }}
                              className={`h-full rounded-full ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"}`} />
                          </div>
                          <p className="text-xs text-muted-foreground">{dim.detail}</p>
                          <div className="text-[10px] text-muted-foreground mt-1">Weight: {Math.round(dim.weight * 100)}%</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* ── AI Remediation Plan ──────────────────────────────── */}
            {remediation.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">AI Remediation Plan</h2>
                    <p className="text-sm text-muted-foreground">Prioritized actions to reduce your risk score</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {remediation.map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + i * 0.06, ease: easing }}>
                        <Card className="border-border/50 hover:shadow-md transition-all duration-300">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                  <h4 className="font-semibold text-sm">{action.action}</h4>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-medium ${impactColors[action.impact]}`}>
                                      {action.impact === "high" ? "⚡ High Impact" : action.impact === "medium" ? "◉ Medium" : "○ Low"}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${effortBadge[action.effort]}`}>
                                      {action.effort} effort
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Category: {action.category} • Current score: {action.currentScore}/100
                                </p>
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

            {/* ── CTA ──────────────────────────────────────────────── */}
            <ScrollReveal>
              <div className="mt-16 text-center">
                <p className="text-muted-foreground mb-4">Need help improving your compliance score?</p>
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <Link to="/services">Get Expert Compliance Help <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
