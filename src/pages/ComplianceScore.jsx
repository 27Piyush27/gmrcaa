import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckCircle, AlertTriangle, Clock, FileText, Shield, Upload,
  TrendingUp, IndianRupee, ArrowRight, Star
} from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

function getComplianceData(user) {
  // Simulated data — in production, fetch from Supabase
  return {
    filings: { itr: true, gst: true, tds: false, advanceTax: true },
    documents: { pan: true, aadhaar: true, form16: true, bankStatements: false, investmentProofs: false },
    payments: { current: true, overdue: false },
    profile: { complete: true, kycVerified: true },
    appointments: { pending: 0, completed: 3 },
  };
}

function getScore(data) {
  let total = 0, earned = 0;

  // Filings (40 pts)
  const filingValues = Object.values(data.filings);
  total += 40;
  earned += (filingValues.filter(Boolean).length / filingValues.length) * 40;

  // Documents (25 pts)
  const docValues = Object.values(data.documents);
  total += 25;
  earned += (docValues.filter(Boolean).length / docValues.length) * 25;

  // Payments (20 pts)
  total += 20;
  if (data.payments.current) earned += 15;
  if (!data.payments.overdue) earned += 5;

  // Profile (15 pts)
  total += 15;
  if (data.profile.complete) earned += 8;
  if (data.profile.kycVerified) earned += 7;

  return Math.round((earned / total) * 100);
}

function getGrade(score) {
  if (score >= 90) return { grade: "A", label: "Excellent", color: "text-emerald-500", bg: "from-emerald-500 to-green-600", ringColor: "stroke-emerald-500" };
  if (score >= 75) return { grade: "B", label: "Good", color: "text-blue-500", bg: "from-blue-500 to-cyan-600", ringColor: "stroke-blue-500" };
  if (score >= 60) return { grade: "C", label: "Average", color: "text-amber-500", bg: "from-amber-500 to-orange-600", ringColor: "stroke-amber-500" };
  return { grade: "D", label: "Needs Work", color: "text-red-500", bg: "from-red-500 to-orange-600", ringColor: "stroke-red-500" };
}

const STATUS_ICON = {
  true: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  false: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
};

function StatusItem({ label, done, actionLabel, actionPath }) {
  const st = STATUS_ICON[done];
  const Icon = st.icon;
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${st.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${st.color}`} />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      {done ? (
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Complete</span>
      ) : (
        <Button asChild variant="outline" size="sm" className="h-7 text-xs rounded-lg px-3">
          <Link to={actionPath || "#"}>{actionLabel || "Complete"}</Link>
        </Button>
      )}
    </div>
  );
}

export default function ComplianceScore() {
  const { user } = useAuth();
  const data = getComplianceData(user);
  const score = getScore(data);
  const gradeInfo = getGrade(score);

  const sections = [
    {
      title: "Tax Filings", icon: FileText, weight: "40%",
      color: "from-blue-500 to-cyan-600",
      items: [
        { label: "ITR Filed (Current Year)", done: data.filings.itr, actionPath: "/services" },
        { label: "GST Returns Up-to-date", done: data.filings.gst, actionPath: "/gst-tracker" },
        { label: "TDS Returns Filed", done: data.filings.tds, actionPath: "/services" },
        { label: "Advance Tax Paid", done: data.filings.advanceTax, actionPath: "/tax-calendar" },
      ]
    },
    {
      title: "Documents", icon: Upload, weight: "25%",
      color: "from-violet-500 to-purple-600",
      items: [
        { label: "PAN Card Uploaded", done: data.documents.pan, actionPath: "/documents" },
        { label: "Aadhaar Linked", done: data.documents.aadhaar, actionPath: "/documents" },
        { label: "Form 16 Uploaded", done: data.documents.form16, actionPath: "/documents" },
        { label: "Bank Statements", done: data.documents.bankStatements, actionLabel: "Upload", actionPath: "/documents" },
        { label: "Investment Proofs", done: data.documents.investmentProofs, actionLabel: "Upload", actionPath: "/documents" },
      ]
    },
    {
      title: "Payments", icon: IndianRupee, weight: "20%",
      color: "from-emerald-500 to-green-600",
      items: [
        { label: "All Invoices Paid", done: data.payments.current, actionPath: "/invoices" },
        { label: "No Overdue Payments", done: !data.payments.overdue, actionPath: "/invoices" },
      ]
    },
    {
      title: "Profile & KYC", icon: Shield, weight: "15%",
      color: "from-amber-500 to-orange-600",
      items: [
        { label: "Profile Completed", done: data.profile.complete, actionPath: "/profile" },
        { label: "KYC Verified", done: data.profile.kycVerified, actionPath: "/profile" },
      ]
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-10 md:pt-40 md:pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full bg-emerald-400/[0.06] blur-3xl pointer-events-none animate-breathe" />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Shield className="w-3.5 h-3.5" /> Compliance
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              Compliance <span className="italic gradient-text-premium">Health</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              Your overall compliance score based on filings, documents, payments, and profile completeness.
            </motion.p>
          </div>
        </section>

        {/* Score Card */}
        <section className="py-6">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    {/* Score Ring */}
                    <div className="relative w-44 h-44 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="currentColor" className="text-secondary" strokeWidth="2.5" />
                        <motion.path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" className={gradeInfo.ringColor} strokeWidth="2.5" strokeLinecap="round"
                          initial={{ strokeDasharray: "0, 100" }}
                          animate={{ strokeDasharray: `${score}, 100` }}
                          transition={{ duration: 1.5, ease: easing }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</span>
                        <span className="text-sm text-muted-foreground">{score}/100</span>
                      </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <h2 className={`text-2xl font-bold mb-2 ${gradeInfo.color}`}>{gradeInfo.label} Compliance</h2>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        {score >= 90 ? "Outstanding! Your compliance is top-notch. Keep it up!" :
                         score >= 75 ? "Great job! A few more items to complete for perfect compliance." :
                         score >= 60 ? "You're on track but have some pending items that need attention." :
                         "Several compliance items need your immediate attention. Let's fix them together."}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {sections.map(s => {
                          const done = s.items.filter(i => i.done).length;
                          const total = s.items.length;
                          return (
                            <span key={s.title} className={`text-xs px-3 py-1.5 rounded-full ${done === total ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"}`}>
                              {s.title}: {done}/{total}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Detailed Breakdown */}
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-6 lg:px-12 space-y-4">
            {sections.map((section, i) => {
              const Icon = section.icon;
              const done = section.items.filter(it => it.done).length;
              const total = section.items.length;
              const pct = Math.round((done / total) * 100);
              return (
                <motion.div key={section.title}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}>
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} bg-opacity-10 flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{section.title}</CardTitle>
                            <CardDescription className="text-xs">Weight: {section.weight}</CardDescription>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${pct === 100 ? "text-emerald-500" : "text-amber-500"}`}>{done}/{total}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: easing }}
                          className={`h-full rounded-full bg-gradient-to-r ${section.color}`}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 pt-0">
                      {section.items.map((item, j) => (
                        <StatusItem key={j} {...item} />
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            <ScrollReveal>
              <div className="mt-12 text-center">
                <p className="text-muted-foreground mb-4">Need help improving your compliance score?</p>
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <Link to="/services">Get Expert Help <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
