import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Scatter, ScatterChart, Cell } from "recharts";
import { Brain, AlertTriangle, Shield, Activity, Search, Eye, CheckCircle, TrendingUp, Zap, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveServiceName } from "@/lib/resolveServiceName";

const easing = [0.22, 1, 0.36, 1];

function detectAnomalies(requests, payments) {
  const anomalies = [];
  // 1. Payment amount anomalies (Z-score)
  const amounts = payments.filter(p => p.amount > 0).map(p => p.amount);
  if (amounts.length >= 3) {
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const std = Math.sqrt(amounts.reduce((a, b) => a + (b - mean) ** 2, 0) / amounts.length) || 1;
    payments.forEach(p => {
      if (p.amount > 0) {
        const z = Math.abs((p.amount - mean) / std);
        if (z > 1.5) {
          anomalies.push({
            id: `pay-${p.id}`, type: "payment", severity: z > 2.5 ? "critical" : z > 2 ? "warning" : "info",
            title: `Unusual payment amount: ₹${p.amount.toLocaleString("en-IN")}`,
            detail: `Z-score: ${z.toFixed(2)} (mean: ₹${Math.round(mean).toLocaleString("en-IN")}, σ: ₹${Math.round(std).toLocaleString("en-IN")})`,
            metric: "Payment Amount", value: p.amount, zScore: z,
            date: new Date(p.created_at).toLocaleDateString("en-IN"),
            recommendation: z > 2.5 ? "Verify this payment — it's significantly higher than average. Check for billing errors." : "This amount is above normal range. May be a complex engagement — verify scope.",
          });
        }
      }
    });
  }

  // 2. Service request pattern anomalies
  const clientCounts = {};
  requests.forEach(r => { clientCounts[r.user_id] = (clientCounts[r.user_id] || 0) + 1; });
  const counts = Object.values(clientCounts);
  if (counts.length >= 3) {
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const std = Math.sqrt(counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length) || 1;
    Object.entries(clientCounts).forEach(([uid, count]) => {
      const z = Math.abs((count - mean) / std);
      if (z > 1.5) {
        const client = requests.find(r => r.user_id === uid)?.profiles;
        anomalies.push({
          id: `req-${uid}`, type: "request_volume", severity: z > 2.5 ? "critical" : "warning",
          title: `${client?.name || "Client"} has unusually ${count > mean ? "high" : "low"} service requests (${count})`,
          detail: `Z-score: ${z.toFixed(2)} (mean: ${mean.toFixed(1)} requests per client)`,
          metric: "Request Volume", value: count, zScore: z,
          date: "Portfolio-wide",
          recommendation: count > mean ? "This client may need a dedicated account manager or bundled service package." : "Low engagement — reach out for a check-in to prevent churn.",
        });
      }
    });
  }

  // 3. Progress stall detection (IQR)
  const inProgress = requests.filter(r => r.status === "in_progress");
  inProgress.forEach(r => {
    const days = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
    if (days > 10 && r.progress < 30) {
      anomalies.push({
        id: `stall-${r.id}`, type: "progress_stall", severity: days > 20 ? "critical" : "warning",
        title: `Stalled: ${resolveServiceName(r)} — ${r.progress}% after ${days} days`,
        detail: `Expected at least 50% progress after ${days} days based on historical patterns`,
        metric: "Progress", value: r.progress, zScore: days / 5,
        date: new Date(r.created_at).toLocaleDateString("en-IN"),
        recommendation: "Investigate blockers. This task is significantly behind expected timeline. Consider reassignment.",
      });
    }
  });

  // 4. Pending overdue
  requests.filter(r => r.status === "pending").forEach(r => {
    const days = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
    if (days > 7) {
      anomalies.push({
        id: `pending-${r.id}`, type: "overdue_pending", severity: days > 14 ? "critical" : "warning",
        title: `Unacknowledged request: ${resolveServiceName(r)} (${days} days old)`,
        detail: "This request has been pending without any progress — may impact client satisfaction",
        metric: "Wait Time", value: days, zScore: days / 5,
        date: new Date(r.created_at).toLocaleDateString("en-IN"),
        recommendation: "Assign this to a CA immediately. Pending requests over 7 days increase churn risk by 3x.",
      });
    }
  });

  return anomalies.sort((a, b) => b.zScore - a.zScore);
}

export default function AnomalyConsole() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState("all");

  useEffect(() => {
    if (!authLoading && (!user || (role !== "admin" && role !== "ca"))) { navigate("/dashboard"); return; }
    if (user) {
      (async () => {
        const { data: reqData } = await supabase.from("service_requests")
          .select("id, user_id, service_id, status, progress, amount, created_at, updated_at, services(name)")
          .order("created_at", { ascending: false });
        const uids = [...new Set((reqData || []).map(r => r.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, name, email").in("user_id", uids);
        const pMap = new Map((profiles || []).map(p => [p.user_id, p]));
        setRequests((reqData || []).map(r => ({ ...r, profiles: pMap.get(r.user_id) || null })));
        const { data: payData } = await supabase.from("payments").select("*").order("created_at", { ascending: true });
        setPayments(payData || []);
        setLoading(false);
      })();
    }
  }, [user, role, authLoading, navigate]);

  const anomalies = useMemo(() => detectAnomalies(requests, payments), [requests, payments]);
  const filtered = filterSeverity === "all" ? anomalies : anomalies.filter(a => a.severity === filterSeverity);
  const criticalCount = anomalies.filter(a => a.severity === "critical").length;
  const warningCount = anomalies.filter(a => a.severity === "warning").length;
  const infoCount = anomalies.filter(a => a.severity === "info").length;

  const typeBreakdown = useMemo(() => {
    const types = {};
    anomalies.forEach(a => { types[a.type] = (types[a.type] || 0) + 1; });
    const labels = { payment: "Payment Anomaly", request_volume: "Request Volume", progress_stall: "Progress Stall", overdue_pending: "Overdue Pending" };
    const colors = { payment: "#6366f1", request_volume: "#06b6d4", progress_stall: "#f59e0b", overdue_pending: "#ef4444" };
    return Object.entries(types).map(([k, v]) => ({ name: labels[k] || k, value: v, fill: colors[k] || "#94a3b8" }));
  }, [anomalies]);

  const scatterData = anomalies.map(a => ({ x: a.value, y: a.zScore, severity: a.severity }));

  const severityBg = { critical: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300", warning: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300", info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300" };
  const severityDot = { critical: "bg-red-500", warning: "bg-amber-500", info: "bg-blue-500" };

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full" /></div>;

  return (
    <PageTransition>
      <div className="min-h-screen">
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Shield className="w-3.5 h-3.5" /> Statistical Anomaly Detection
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              Anomaly <span className="italic gradient-text-premium">Console</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              Z-score and IQR-based anomaly detection across payments, requests, and client patterns.
            </motion.p>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 space-y-8">
            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: AlertTriangle, label: "Total Anomalies", value: anomalies.length, color: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30", ic: "text-violet-600 dark:text-violet-400" },
                { icon: Zap, label: "Critical", value: criticalCount, color: "from-red-500 to-rose-600", bg: "bg-red-50 dark:bg-red-950/30", ic: "text-red-600 dark:text-red-400" },
                { icon: Activity, label: "Warnings", value: warningCount, color: "from-amber-500 to-orange-600", bg: "bg-amber-50 dark:bg-amber-950/30", ic: "text-amber-600 dark:text-amber-400" },
                { icon: Shield, label: "Monitored Metrics", value: 4, color: "from-emerald-500 to-green-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", ic: "text-emerald-600 dark:text-emerald-400" },
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-base">Anomaly Distribution by Type</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={typeBreakdown} barSize={45}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>{typeBreakdown.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-base">Anomaly Scatter — Value vs Z-Score</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" dataKey="x" name="Value" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis type="number" dataKey="y" name="Z-Score" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="4 4" label="Threshold" />
                        <Scatter data={scatterData} fill="#6366f1">
                          {scatterData.map((e, i) => <Cell key={i} fill={e.severity === "critical" ? "#ef4444" : e.severity === "warning" ? "#f59e0b" : "#6366f1"} />)}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Filter + Alert Feed */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Brain className="w-5 h-5 text-violet-500" /> Anomaly Feed</h2>
                <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
                  {["all", "critical", "warning", "info"].map(f => (
                    <button key={f} onClick={() => setFilterSeverity(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                        filterSeverity === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {f} {f !== "all" && `(${anomalies.filter(a => a.severity === f).length})`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <Card className="border-border/50"><CardContent className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No Anomalies Detected</h3>
                    <p className="text-muted-foreground text-sm">All metrics are within normal parameters.</p>
                  </CardContent></Card>
                ) : filtered.map((anomaly, i) => (
                  <motion.div key={anomaly.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.04, ease: easing }}>
                    <Card className={`border overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 ${severityBg[anomaly.severity]}`}
                      onClick={() => setSelectedAnomaly(selectedAnomaly?.id === anomaly.id ? null : anomaly)}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${severityDot[anomaly.severity]} ${anomaly.severity === "critical" ? "animate-pulse" : ""}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-semibold text-sm">{anomaly.title}</h3>
                                <p className="text-xs mt-1 opacity-75">{anomaly.detail}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-background/50">{anomaly.date}</span>
                                <ChevronRight className={`w-4 h-4 transition-transform ${selectedAnomaly?.id === anomaly.id ? "rotate-90" : ""}`} />
                              </div>
                            </div>
                            <AnimatePresence>
                              {selectedAnomaly?.id === anomaly.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="mt-4 pt-4 border-t border-current/10 space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                      <div className="px-3 py-2 rounded-lg bg-background/50"><span className="text-[10px] block opacity-60">Metric</span><span className="text-sm font-medium">{anomaly.metric}</span></div>
                                      <div className="px-3 py-2 rounded-lg bg-background/50"><span className="text-[10px] block opacity-60">Value</span><span className="text-sm font-medium">{anomaly.value}</span></div>
                                      <div className="px-3 py-2 rounded-lg bg-background/50"><span className="text-[10px] block opacity-60">Z-Score</span><span className="text-sm font-medium">{anomaly.zScore.toFixed(2)}</span></div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background/50">
                                      <span className="text-[10px] block opacity-60 mb-1">AI Recommendation</span>
                                      <p className="text-sm leading-relaxed">{anomaly.recommendation}</p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
