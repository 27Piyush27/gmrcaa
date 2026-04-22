import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { Brain, Sparkles, Clock, AlertTriangle, Target, Activity, Zap, CheckCircle, Users, Calendar, TrendingUp, Layers } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveServiceName } from "@/lib/resolveServiceName";

const easing = [0.22, 1, 0.36, 1];

function scorePriority(request) {
  let score = 0;
  const daysSince = Math.floor((Date.now() - new Date(request.created_at).getTime()) / 86400000);
  // Urgency: older tasks score higher
  score += Math.min(40, daysSince * 2);
  // Status weight
  if (request.status === "pending") score += 30;
  else if (request.status === "in_progress") score += 15;
  // Amount (proxy for client value)
  if (request.amount > 20000) score += 20;
  else if (request.amount > 5000) score += 10;
  // Low progress penalty
  if (request.progress < 30 && request.status === "in_progress") score += 15;
  return Math.min(100, score);
}

function estimateTime(request) {
  const base = { pending: 8, in_progress: Math.max(1, 8 - (request.progress || 0) * 0.08), completed: 0 };
  const hours = base[request.status] || 4;
  const complexity = request.amount > 20000 ? 1.5 : request.amount > 5000 ? 1.2 : 1;
  return Math.round(hours * complexity * 10) / 10;
}

function getDeadlineRisk(request) {
  const daysSince = Math.floor((Date.now() - new Date(request.created_at).getTime()) / 86400000);
  if (request.status === "completed" || request.status === "paid") return "low";
  if (daysSince > 14 && request.progress < 50) return "critical";
  if (daysSince > 7 && request.progress < 30) return "high";
  if (daysSince > 3) return "medium";
  return "low";
}

export default function WorkloadOptimizer() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || (role !== "admin" && role !== "ca"))) { navigate("/dashboard"); return; }
    if (user) {
      (async () => {
        const { data } = await supabase.from("service_requests")
          .select("id, user_id, service_id, status, progress, amount, created_at, updated_at, services(name)")
          .order("created_at", { ascending: false });
        const uids = [...new Set((data || []).map(r => r.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", uids);
        const pMap = new Map((profiles || []).map(p => [p.user_id, p]));
        setRequests((data || []).map(r => ({ ...r, profiles: pMap.get(r.user_id) || null })));
        setLoading(false);
      })();
    }
  }, [user, role, authLoading, navigate]);

  const activeTasks = useMemo(() =>
    requests.filter(r => r.status !== "paid" && r.status !== "cancelled").map(r => ({
      ...r, priority: scorePriority(r), eta: estimateTime(r), risk: getDeadlineRisk(r), serviceName: resolveServiceName(r),
    })).sort((a, b) => b.priority - a.priority),
  [requests]);

  const totalHours = activeTasks.reduce((s, t) => s + t.eta, 0);
  const criticalCount = activeTasks.filter(t => t.risk === "critical").length;
  const highCount = activeTasks.filter(t => t.risk === "high").length;
  const avgPriority = activeTasks.length > 0 ? Math.round(activeTasks.reduce((s, t) => s + t.priority, 0) / activeTasks.length) : 0;

  const riskMatrix = [
    { name: "Critical", value: criticalCount, fill: "#ef4444" },
    { name: "High", value: highCount, fill: "#f59e0b" },
    { name: "Medium", value: activeTasks.filter(t => t.risk === "medium").length, fill: "#6366f1" },
    { name: "Low", value: activeTasks.filter(t => t.risk === "low").length, fill: "#10b981" },
  ].filter(d => d.value > 0);

  const topTasks = activeTasks.slice(0, 10).map(t => ({ name: t.serviceName?.slice(0, 20) || "Task", priority: t.priority, fill: t.risk === "critical" ? "#ef4444" : t.risk === "high" ? "#f59e0b" : t.risk === "medium" ? "#6366f1" : "#10b981" }));

  const bottlenecks = [];
  const pendingTasks = activeTasks.filter(t => t.risk === "critical" || t.risk === "high");
  if (pendingTasks.length > 2) bottlenecks.push({ icon: "🔥", text: `${pendingTasks.length} tasks are at high/critical deadline risk. Prioritize these immediately.` });
  if (totalHours > 40) bottlenecks.push({ icon: "⏰", text: `Estimated ${totalHours.toFixed(0)}h total workload. Consider delegating or extending timelines.` });
  if (criticalCount > 0) bottlenecks.push({ icon: "🚨", text: `${criticalCount} critical tasks — these clients may churn if not addressed within 48 hours.` });
  if (activeTasks.length > 0 && avgPriority < 40) bottlenecks.push({ icon: "✅", text: "Portfolio workload is manageable. Good time to focus on quality and client engagement." });

  const riskColor = { critical: "text-red-600 bg-red-50 dark:bg-red-950/30", high: "text-amber-600 bg-amber-50 dark:bg-amber-950/30", medium: "text-blue-600 bg-blue-50 dark:bg-blue-950/30", low: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" };

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full" /></div>;

  return (
    <PageTransition>
      <div className="min-h-screen">
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Layers className="w-3.5 h-3.5" /> AI Task Management
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              Workload <span className="italic gradient-text-premium">Optimizer</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              AI-powered priority scoring, deadline risk analysis, and capacity planning for your practice.
            </motion.p>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 space-y-8">
            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Layers, label: "Active Tasks", value: activeTasks.length, color: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30", ic: "text-violet-600 dark:text-violet-400" },
                { icon: Clock, label: "Est. Hours", value: `${totalHours.toFixed(0)}h`, color: "from-blue-500 to-cyan-600", bg: "bg-blue-50 dark:bg-blue-950/30", ic: "text-blue-600 dark:text-blue-400" },
                { icon: AlertTriangle, label: "Critical", value: criticalCount, color: "from-red-500 to-rose-600", bg: "bg-red-50 dark:bg-red-950/30", ic: "text-red-600 dark:text-red-400" },
                { icon: Target, label: "Avg Priority", value: `${avgPriority}/100`, color: "from-amber-500 to-orange-600", bg: "bg-amber-50 dark:bg-amber-950/30", ic: "text-amber-600 dark:text-amber-400" },
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

            {/* Bottleneck Alerts */}
            {bottlenecks.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-border/50 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-red-500 to-violet-500" />
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Bottleneck Detector</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {bottlenecks.map((b, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                        <span className="text-xl">{b.icon}</span>
                        <p className="text-sm leading-relaxed">{b.text}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-base">Priority Score — Top Tasks</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={topTasks} layout="vertical" barSize={18}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        <Bar dataKey="priority" radius={[0, 8, 8, 0]}>{topTasks.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-base">Deadline Risk Matrix</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={riskMatrix} cx="50%" cy="50%" outerRadius={90} innerRadius={55} paddingAngle={4} dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}>
                          {riskMatrix.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Task List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Brain className="w-4 h-4 text-violet-500" /> AI-Prioritized Task Queue</CardTitle>
                  <CardDescription>Sorted by composite priority score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeTasks.slice(0, 12).map((task, i) => (
                      <motion.div key={task.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.04, ease: easing }}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center text-sm font-bold">
                          {task.priority}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-sm truncate">{task.serviceName}</h4>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${riskColor[task.risk]}`}>{task.risk}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{task.profiles?.name || "Client"}</span>
                            <span>•</span>
                            <span>{task.progress}% done</span>
                            <span>•</span>
                            <span>~{task.eta}h est.</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className={`h-full rounded-full ${task.risk === "critical" ? "bg-red-500" : task.risk === "high" ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${task.progress}%` }} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
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
