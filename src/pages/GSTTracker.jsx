import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  FileText, Calendar, CheckCircle, Clock, AlertTriangle, ArrowRight,
  ChevronDown, ChevronUp, Info, Shield, TrendingUp, IndianRupee
} from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

const GST_RETURNS = [
  {
    id: "gstr1",
    name: "GSTR-1",
    fullName: "Outward Supplies Return",
    description: "Details of outward supplies of goods/services",
    frequency: "Monthly / Quarterly",
    dueDate: "11th of next month",
    applicableTo: "All registered taxpayers making outward supplies",
  },
  {
    id: "gstr3b",
    name: "GSTR-3B",
    fullName: "Summary Return",
    description: "Self-declared summary of inward & outward supplies",
    frequency: "Monthly / Quarterly",
    dueDate: "20th of next month",
    applicableTo: "All normal registered taxpayers",
  },
  {
    id: "gstr9",
    name: "GSTR-9",
    fullName: "Annual Return",
    description: "Consolidated annual return for the financial year",
    frequency: "Annual",
    dueDate: "31st December",
    applicableTo: "Turnover > ₹2 Crore",
  },
  {
    id: "gstr4",
    name: "GSTR-4",
    fullName: "Composition Scheme Return",
    description: "Return for taxpayers under Composition Scheme",
    frequency: "Annual",
    dueDate: "30th April",
    applicableTo: "Composition scheme taxpayers",
  },
  {
    id: "gstr9c",
    name: "GSTR-9C",
    fullName: "Reconciliation Statement",
    description: "Reconciliation between GSTR-9 and audited financials",
    frequency: "Annual",
    dueDate: "31st December",
    applicableTo: "Turnover > ₹5 Crore",
  },
];

const FILING_PERIODS = [
  { month: "April 2025", status: "filed", filedOn: "10 May 2025", returnType: "GSTR-1 & 3B" },
  { month: "May 2025", status: "filed", filedOn: "09 Jun 2025", returnType: "GSTR-1 & 3B" },
  { month: "June 2025", status: "filed", filedOn: "11 Jul 2025", returnType: "GSTR-1 & 3B" },
  { month: "July 2025", status: "filed", filedOn: "10 Aug 2025", returnType: "GSTR-1 & 3B" },
  { month: "August 2025", status: "filed", filedOn: "11 Sep 2025", returnType: "GSTR-1 & 3B" },
  { month: "September 2025", status: "filed", filedOn: "10 Oct 2025", returnType: "GSTR-1 & 3B" },
  { month: "October 2025", status: "filed", filedOn: "11 Nov 2025", returnType: "GSTR-1 & 3B" },
  { month: "November 2025", status: "pending", filedOn: null, returnType: "GSTR-1 & 3B" },
  { month: "December 2025", status: "upcoming", filedOn: null, returnType: "GSTR-1 & 3B" },
  { month: "January 2026", status: "upcoming", filedOn: null, returnType: "GSTR-1 & 3B" },
  { month: "February 2026", status: "upcoming", filedOn: null, returnType: "GSTR-1 & 3B" },
  { month: "March 2026", status: "upcoming", filedOn: null, returnType: "GSTR-1 & 3B" },
];

const STATUS_MAP = {
  filed: { label: "Filed", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", dot: "bg-emerald-500", icon: CheckCircle },
  pending: { label: "Pending", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", dot: "bg-amber-500 animate-pulse", icon: Clock },
  upcoming: { label: "Upcoming", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", dot: "bg-blue-400", icon: Calendar },
  overdue: { label: "Overdue", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40", dot: "bg-red-500 animate-pulse", icon: AlertTriangle },
};

const KEY_DEADLINES = [
  { name: "GSTR-1 (Dec 2025)", date: "11 Jan 2026", daysLeft: 6, type: "gstr1" },
  { name: "GSTR-3B (Dec 2025)", date: "20 Jan 2026", daysLeft: 15, type: "gstr3b" },
  { name: "GSTR-9 (FY 2024-25)", date: "31 Dec 2025", daysLeft: -5, type: "gstr9" },
  { name: "GSTR-1 (Jan 2026)", date: "11 Feb 2026", daysLeft: 37, type: "gstr1" },
];

export default function GSTTracker() {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedReturn, setExpandedReturn] = useState(null);

  const filedCount = FILING_PERIODS.filter(p => p.status === "filed").length;
  const pendingCount = FILING_PERIODS.filter(p => p.status === "pending").length;
  const complianceRate = Math.round((filedCount / (filedCount + pendingCount)) * 100) || 100;

  const stats = [
    { icon: CheckCircle, label: "Filed", value: filedCount, color: "from-emerald-500 to-green-600", lightBg: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: Clock, label: "Pending", value: pendingCount, color: "from-amber-500 to-orange-600", lightBg: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400" },
    { icon: Calendar, label: "Upcoming", value: FILING_PERIODS.filter(p => p.status === "upcoming").length, color: "from-blue-500 to-cyan-600", lightBg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
    { icon: Shield, label: "Compliance", value: complianceRate, suffix: "%", color: "from-violet-500 to-purple-600", lightBg: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-emerald-400/[0.06] blur-3xl pointer-events-none animate-breathe" />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <FileText className="w-3.5 h-3.5" /> GST Compliance
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.12 }}>
              GST <span className="italic gradient-text-premium">Filing Tracker</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.28 }}>
              Track your GST return filing status, upcoming deadlines, and compliance score.
            </motion.p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-6">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div key={stat.label}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: easing, delay: 0.1 * i }}
                  className="relative group rounded-2xl border border-border/60 bg-card overflow-hidden shadow-soft hover:shadow-md hover:-translate-y-1 transition-all duration-500">
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color}`} />
                  <div className="p-5 md:p-6">
                    <div className={`w-10 h-10 rounded-xl ${stat.lightBg} flex items-center justify-center mb-4`}>
                      <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">{stat.label}</p>
                    <p className="text-4xl font-bold tracking-tight">{stat.value}{stat.suffix || ""}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 md:py-12">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-secondary/80 rounded-xl h-11">
                <TabsTrigger value="overview" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <TrendingUp className="w-4 h-4" />Overview
                </TabsTrigger>
                <TabsTrigger value="filings" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <FileText className="w-4 h-4" />Filing History
                </TabsTrigger>
                <TabsTrigger value="returns" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <Info className="w-4 h-4" />Return Types
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Upcoming Deadlines */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" />Upcoming Deadlines</CardTitle>
                    <CardDescription>Key GST filing due dates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {KEY_DEADLINES.map((d, i) => {
                      const isOverdue = d.daysLeft < 0;
                      const isUrgent = d.daysLeft >= 0 && d.daysLeft <= 7;
                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`flex items-center justify-between p-4 rounded-xl border ${isOverdue ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30" : isUrgent ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30" : "border-border/50 bg-secondary/30"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isOverdue ? "bg-red-500 animate-pulse" : isUrgent ? "bg-amber-500 animate-pulse" : "bg-blue-400"}`} />
                            <div>
                              <p className="font-medium text-sm">{d.name}</p>
                              <p className="text-xs text-muted-foreground">Due: {d.date}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isOverdue ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" : isUrgent ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"}`}>
                            {isOverdue ? `Overdue by ${Math.abs(d.daysLeft)} days` : `${d.daysLeft} days left`}
                          </span>
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Compliance Meter */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-violet-500" />Compliance Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-secondary" strokeWidth="3" />
                          <motion.path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="url(#compliance-gradient)" strokeWidth="3" strokeLinecap="round"
                            initial={{ strokeDasharray: "0, 100" }}
                            animate={{ strokeDasharray: `${complianceRate}, 100` }}
                            transition={{ duration: 1.5, ease: easing }}
                          />
                          <defs>
                            <linearGradient id="compliance-gradient" x1="0%" y1="0%" x2="100%">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold">{complianceRate}%</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg mb-2">
                          {complianceRate >= 90 ? "Excellent Compliance!" : complianceRate >= 70 ? "Good Standing" : "Needs Attention"}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          You've filed {filedCount} out of {filedCount + pendingCount} due returns on time.
                          {pendingCount > 0 && <> <span className="text-amber-600 dark:text-amber-400 font-medium">{pendingCount} return{pendingCount > 1 ? "s" : ""} pending.</span></>}
                        </p>
                        {pendingCount > 0 && (
                          <Button asChild size="sm" className="mt-4 rounded-xl gap-2">
                            <Link to="/services">Get Filing Help <ArrowRight className="w-3.5 h-3.5" /></Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Filing History Tab */}
              <TabsContent value="filings" className="space-y-3">
                {FILING_PERIODS.map((period, i) => {
                  const st = STATUS_MAP[period.status];
                  const Icon = st.icon;
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-center justify-between p-4 md:p-5 rounded-2xl border border-border/50 ${st.bg} transition-all hover:shadow-soft`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${st.bg} border border-current/10 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${st.color}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{period.month}</p>
                          <p className="text-xs text-muted-foreground">{period.returnType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {period.filedOn && <span className="text-xs text-muted-foreground hidden sm:block">Filed: {period.filedOn}</span>}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.color} ${st.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </TabsContent>

              {/* Return Types Tab */}
              <TabsContent value="returns" className="space-y-4">
                {GST_RETURNS.map((ret) => (
                  <Card key={ret.id} className="border-border/50 overflow-hidden">
                    <button
                      onClick={() => setExpandedReturn(expandedReturn === ret.id ? null : ret.id)}
                      className="w-full p-5 md:p-6 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-border/50 flex items-center justify-center">
                          <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{ret.name.replace("GSTR-", "")}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{ret.name} — {ret.fullName}</p>
                          <p className="text-sm text-muted-foreground">{ret.description}</p>
                        </div>
                      </div>
                      {expandedReturn === ret.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    <AnimatePresence>
                      {expandedReturn === ret.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: easing }}
                          className="overflow-hidden">
                          <div className="px-5 md:px-6 pb-5 md:pb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/30 pt-4">
                            <div className="rounded-xl bg-secondary/40 p-4">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Frequency</p>
                              <p className="text-sm font-medium">{ret.frequency}</p>
                            </div>
                            <div className="rounded-xl bg-secondary/40 p-4">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Due Date</p>
                              <p className="text-sm font-medium">{ret.dueDate}</p>
                            </div>
                            <div className="rounded-xl bg-secondary/40 p-4">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Applicable To</p>
                              <p className="text-sm font-medium">{ret.applicableTo}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            {/* CTA */}
            <ScrollReveal>
              <div className="mt-16 text-center">
                <p className="text-muted-foreground mb-4">Need help with GST compliance?</p>
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
