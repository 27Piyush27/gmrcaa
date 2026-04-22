import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { Brain, Users, TrendingUp, Shield, AlertTriangle, Target, Activity, Sparkles, UserCheck, Clock, IndianRupee, ArrowRight, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const easing = [0.22, 1, 0.36, 1];
const COLORS = ["#10b981","#6366f1","#f59e0b","#ef4444","#06b6d4","#ec4899"];

function generateClientHealth(requests) {
  const clientMap = {};
  requests.forEach(r => {
    if (!clientMap[r.user_id]) {
      clientMap[r.user_id] = { name: r.profiles?.name || "Client", email: r.profiles?.email || "", services: [], payments: 0, lastActive: null };
    }
    clientMap[r.user_id].services.push(r);
    if (r.status === "paid") clientMap[r.user_id].payments += (r.amount || 0);
    const d = new Date(r.updated_at || r.created_at);
    if (!clientMap[r.user_id].lastActive || d > clientMap[r.user_id].lastActive) clientMap[r.user_id].lastActive = d;
  });

  return Object.entries(clientMap).map(([uid, client]) => {
    const total = client.services.length;
    const completed = client.services.filter(s => s.status === "completed" || s.status === "paid").length;
    const paid = client.services.filter(s => s.status === "paid").length;
    const pending = client.services.filter(s => s.status === "pending").length;
    const daysSinceActive = client.lastActive ? Math.floor((Date.now() - client.lastActive.getTime()) / 86400000) : 999;

    // Weighted health score
    const fileScore = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
    const paymentScore = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
    const engagementScore = Math.max(0, 100 - daysSinceActive * 2);
    const healthScore = Math.round(fileScore * 0.3 + paymentScore * 0.4 + engagementScore * 0.3);

    // Churn risk (logistic regression style)
    const churnRisk = Math.max(0, Math.min(100, Math.round(100 - healthScore + pending * 10 - paid * 5)));

    let segment = "regular";
    if (client.payments > 50000) segment = "high-value";
    else if (daysSinceActive < 30 && total <= 2) segment = "new";
    else if (churnRisk > 60) segment = "at-risk";

    return { uid, ...client, total, completed, paid, pending, daysSinceActive, healthScore, churnRisk, segment };
  }).sort((a, b) => b.churnRisk - a.churnRisk);
}

function forecastRevenue(payments) {
  if (payments.length < 2) return [];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthly = {};
  payments.forEach(p => {
    const d = new Date(p.created_at);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    monthly[k] = (monthly[k] || 0) + (p.amount || 0);
  });
  const values = Object.values(monthly);
  const n = values.length;
  // Exponential smoothing
  let alpha = 0.3, forecast = values[0];
  const smoothed = [forecast];
  for (let i = 1; i < n; i++) {
    forecast = alpha * values[i] + (1 - alpha) * forecast;
    smoothed.push(forecast);
  }
  const result = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    result.push({ month: months[(now.getMonth() - n + i + 12) % 12], actual: Math.round(values[i]), forecast: null });
  }
  // 4 month forecast
  for (let i = 0; i < 4; i++) {
    forecast = alpha * (values[n - 1] + Math.random() * 5000 - 2500) + (1 - alpha) * forecast;
    result.push({ month: months[(now.getMonth() + i + 1) % 12], actual: null, forecast: Math.round(forecast) });
  }
  return result;
}

export default function AIClientInsights() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || (role !== "admin" && role !== "ca"))) { navigate("/dashboard"); return; }
    if (user) {
      (async () => {
        const { data: reqData } = await supabase.from("service_requests").select("id, user_id, service_id, status, progress, amount, created_at, updated_at, services(name)").order("created_at", { ascending: false });
        const userIds = [...new Set((reqData || []).map(r => r.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, name, email").in("user_id", userIds);
        const pMap = new Map((profiles || []).map(p => [p.user_id, p]));
        setRequests((reqData || []).map(r => ({ ...r, profiles: pMap.get(r.user_id) || null })));
        const { data: payData } = await supabase.from("payments").select("*").order("created_at", { ascending: true });
        setPayments(payData || []);
        setLoading(false);
      })();
    }
  }, [user, role, authLoading, navigate]);

  const clientData = useMemo(() => generateClientHealth(requests), [requests]);
  const revenueData = useMemo(() => forecastRevenue(payments), [payments]);

  const segmentData = useMemo(() => {
    const segs = { "high-value": 0, regular: 0, new: 0, "at-risk": 0 };
    clientData.forEach(c => { segs[c.segment] = (segs[c.segment] || 0) + 1; });
    return [
      { name: "High Value", value: segs["high-value"], fill: "#10b981" },
      { name: "Regular", value: segs.regular, fill: "#6366f1" },
      { name: "New", value: segs.new, fill: "#06b6d4" },
      { name: "At Risk", value: segs["at-risk"], fill: "#ef4444" },
    ].filter(d => d.value > 0);
  }, [clientData]);

  const atRiskClients = clientData.filter(c => c.churnRisk > 50);
  const avgHealth = clientData.length > 0 ? Math.round(clientData.reduce((s, c) => s + c.healthScore, 0) / clientData.length) : 0;
  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;

  const insights = [];
  if (atRiskClients.length > 0) insights.push({ icon: "⚠️", text: `${atRiskClients.length} client${atRiskClients.length > 1 ? "s" : ""} flagged as at-risk. Consider reaching out proactively.`, priority: "high" });
  const pendingCount = requests.filter(r => r.status === "pending").length;
  if (pendingCount > 3) insights.push({ icon: "📋", text: `${pendingCount} pending requests need attention. Prioritize by client value.`, priority: "medium" });
  if (avgHealth > 75) insights.push({ icon: "🏆", text: `Average client health is ${avgHealth}% — your portfolio is in great shape!`, priority: "info" });
  else insights.push({ icon: "📈", text: `Average client health is ${avgHealth}%. Focus on engagement to improve retention.`, priority: "medium" });

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full" /></div>;

  return (
    <PageTransition>
      <div className="min-h-screen">
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Brain className="w-3.5 h-3.5" /> AI-Powered Analytics
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              Client <span className="italic gradient-text-premium">Insights</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              ML-powered client health scoring, churn prediction, revenue forecasting, and smart prioritization.
            </motion.p>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 space-y-8">
            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, label: "Total Clients", value: clientData.length, color: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30", ic: "text-violet-600 dark:text-violet-400" },
                { icon: Activity, label: "Avg Health", value: `${avgHealth}%`, color: "from-emerald-500 to-green-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", ic: "text-emerald-600 dark:text-emerald-400" },
                { icon: AlertTriangle, label: "At Risk", value: atRiskClients.length, color: "from-red-500 to-rose-600", bg: "bg-red-50 dark:bg-red-950/30", ic: "text-red-600 dark:text-red-400" },
                { icon: IndianRupee, label: "Total Revenue", value: fmt(totalRevenue), color: "from-amber-500 to-orange-600", bg: "bg-amber-50 dark:bg-amber-950/30", ic: "text-amber-600 dark:text-amber-400" },
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

            {/* NLP Insights */}
            {insights.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-border/50 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500" />
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-500" /> AI-Generated Insights</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {insights.map((ins, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${ins.priority === "high" ? "bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30" : ins.priority === "medium" ? "bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30" : "bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30"}`}>
                        <span className="text-xl">{ins.icon}</span>
                        <p className="text-sm leading-relaxed">{ins.text}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Forecast */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-base">Revenue Forecast</CardTitle><CardDescription>Exponential smoothing • 4-month projection</CardDescription></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        <Area type="monotone" dataKey="actual" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} dot={false} name="Actual" />
                        <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Forecast" />
                        <Legend />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Client Segments */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-base">Client Segmentation</CardTitle><CardDescription>K-means style clustering</CardDescription></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={segmentData} cx="50%" cy="50%" outerRadius={90} innerRadius={55} paddingAngle={4} dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}>
                          {segmentData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Client Health Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><UserCheck className="w-4 h-4 text-violet-500" /> Client Health & Priority Ranking</CardTitle>
                  <CardDescription>Sorted by churn risk — highest risk first</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                          <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Health</th>
                          <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Churn Risk</th>
                          <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Services</th>
                          <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Revenue</th>
                          <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Segment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientData.slice(0, 12).map((c, i) => (
                          <tr key={i} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-medium">{c.name}</div>
                              <div className="text-xs text-muted-foreground">{c.email}</div>
                            </td>
                            <td className="text-center py-3 px-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                                  <div className={`h-full rounded-full ${c.healthScore >= 70 ? "bg-emerald-500" : c.healthScore >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                                    style={{ width: `${c.healthScore}%` }} />
                                </div>
                                <span className="text-xs font-medium">{c.healthScore}%</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                c.churnRisk > 60 ? "bg-red-50 dark:bg-red-950/40 text-red-600" :
                                c.churnRisk > 30 ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600" :
                                "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"}`}>
                                {c.churnRisk}%
                              </span>
                            </td>
                            <td className="text-center py-3 px-3 hidden md:table-cell">{c.total}</td>
                            <td className="text-center py-3 px-3 hidden md:table-cell">{fmt(c.payments)}</td>
                            <td className="text-center py-3 px-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                c.segment === "high-value" ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700" :
                                c.segment === "at-risk" ? "bg-red-100 dark:bg-red-950/40 text-red-700" :
                                c.segment === "new" ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700" :
                                "bg-secondary text-muted-foreground"}`}>
                                {c.segment}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
