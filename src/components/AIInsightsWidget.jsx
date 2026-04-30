import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles, TrendingUp, Shield, AlertTriangle, CheckCircle,
  Lightbulb, ChevronDown, ChevronUp, Brain, Target
} from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

// ── AI Insight Generator ────────────────────────────────────────────────────
function generateDashboardInsights(serviceRequests = [], complianceScore = 78) {
  const insights = [];

  // Service request insights
  const pendingCount = serviceRequests.filter(r => r.status === "pending").length;
  const completedCount = serviceRequests.filter(r => r.status === "completed").length;

  if (pendingCount > 0) {
    insights.push({
      id: "pending-services",
      icon: AlertTriangle,
      type: "warning",
      title: `${pendingCount} Service${pendingCount > 1 ? "s" : ""} Pending`,
      text: `You have ${pendingCount} pending service request${pendingCount > 1 ? "s" : ""}. Follow up to ensure timely completion.`,
      action: { label: "View Dashboard", path: "/dashboard" },
    });
  }

  if (completedCount > 0) {
    insights.push({
      id: "completed-services",
      icon: CheckCircle,
      type: "positive",
      title: `${completedCount} Service${completedCount > 1 ? "s" : ""} Completed`,
      text: `Great progress! ${completedCount} service${completedCount > 1 ? "s have" : " has"} been completed successfully.`,
      action: null,
    });
  }

  // Compliance-based insights
  if (complianceScore < 70) {
    insights.push({
      id: "low-compliance",
      icon: Shield,
      type: "warning",
      title: "Compliance Score Needs Attention",
      text: `Your compliance score is ${complianceScore}/100. Complete pending filings and upload missing documents to improve it.`,
      action: { label: "View Compliance", path: "/compliance" },
    });
  } else if (complianceScore >= 90) {
    insights.push({
      id: "high-compliance",
      icon: Shield,
      type: "positive",
      title: "Excellent Compliance Standing",
      text: `Your compliance score is ${complianceScore}/100. Outstanding job maintaining your compliance health!`,
      action: null,
    });
  }

  // Tax planning tip (contextual based on month)
  const month = new Date().getMonth();
  if (month >= 0 && month <= 2) { // Jan-Mar
    insights.push({
      id: "tax-tip-q4",
      icon: Lightbulb,
      type: "tip",
      title: "Year-End Tax Planning",
      text: "Last quarter to maximize tax deductions for this financial year. Review Section 80C, 80D, and NPS investments.",
      action: { label: "AI Tax Optimizer", path: "/ai-tax-optimizer" },
    });
  } else if (month >= 6 && month <= 7) { // Jul-Aug
    insights.push({
      id: "tax-tip-itr",
      icon: Lightbulb,
      type: "tip",
      title: "ITR Filing Deadline Approaching",
      text: "July 31st is the deadline for individual ITR filing. Calculate your tax liability to ensure readiness.",
      action: { label: "Calculate Tax", path: "/tax-calculator" },
    });
  } else {
    insights.push({
      id: "tax-tip-general",
      icon: Target,
      type: "tip",
      title: "Optimize Your Tax Strategy",
      text: "Use our AI Tax Optimizer to compare Old vs New regime and discover tax-saving opportunities.",
      action: { label: "Open Optimizer", path: "/ai-tax-optimizer" },
    });
  }

  // Risk assessment nudge
  insights.push({
    id: "risk-check",
    icon: Brain,
    type: "info",
    title: "Run AI Risk Assessment",
    text: "Get a multi-factor compliance risk score with personalized remediation plan from our ML-powered analyzer.",
    action: { label: "Check Risk", path: "/risk-assessment" },
  });

  return insights;
}

// ── Typewriter Animation Component ──────────────────────────────────────────
function TypewriterText({ text, speed = 20 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse align-middle" />}
    </span>
  );
}

// ── Main Widget Component ───────────────────────────────────────────────────
export function AIInsightsWidget({ serviceRequests = [] }) {
  const [expanded, setExpanded] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const insights = useMemo(() => generateDashboardInsights(serviceRequests), [serviceRequests]);

  // Auto-cycle through insights
  useEffect(() => {
    if (!expanded) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % insights.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [expanded, insights.length]);

  const typeStyles = {
    positive: { bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-500", border: "border-emerald-200/50 dark:border-emerald-800/50" },
    warning: { bg: "bg-amber-50 dark:bg-amber-950/30", icon: "text-amber-500", border: "border-amber-200/50 dark:border-amber-800/50" },
    info: { bg: "bg-blue-50 dark:bg-blue-950/30", icon: "text-blue-500", border: "border-blue-200/50 dark:border-blue-800/50" },
    tip: { bg: "bg-violet-50 dark:bg-violet-950/30", icon: "text-violet-500", border: "border-violet-200/50 dark:border-violet-800/50" },
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            AI Insights
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-medium ml-1">
              {insights.length} new
            </span>
          </CardTitle>
          <button onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: easing }}>
            <CardContent className="space-y-3 pt-0 pb-4">
              {insights.map((insight, i) => {
                const Icon = insight.icon;
                const style = typeStyles[insight.type] || typeStyles.info;
                const isActive = i === activeIndex;

                return (
                  <motion.div key={insight.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-3.5 rounded-xl border transition-all duration-300 ${style.border} ${isActive ? style.bg : "bg-transparent hover:bg-secondary/30"}`}
                    onClick={() => setActiveIndex(i)}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.icon}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium mb-1">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {isActive ? <TypewriterText text={insight.text} speed={15} /> : insight.text}
                        </p>
                        {insight.action && (
                          <Link to={insight.action.path}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline mt-2">
                            {insight.action.label} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 pt-2">
                {insights.map((_, i) => (
                  <button key={i} onClick={() => setActiveIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-6 bg-accent" : "w-1.5 bg-secondary hover:bg-muted-foreground/30"}`} />
                ))}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
