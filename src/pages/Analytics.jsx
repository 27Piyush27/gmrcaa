import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";
import {
  ArrowLeft, IndianRupee, TrendingUp, FileText, CreditCard,
  Calendar, Loader2, Download, PieChart as PieChartIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";
import { resolveServiceName } from "@/lib/resolveServiceName";

const easing = [0.22, 1, 0.36, 1];
const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];

export default function Analytics() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      const [reqRes, payRes] = await Promise.all([
        supabase.from("service_requests").select("id, service_id, status, amount, created_at, services(name)").order("created_at", { ascending: true }).limit(1000),
        supabase.from("payments").select("id, amount, gst_amount, total_amount, status, description, created_at").order("created_at", { ascending: true }).limit(1000)
      ]);
      setRequests(reqRes.data || []);
      setPayments(payRes.data || []);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Computed analytics
  const analytics = useMemo(() => {
    const completedPayments = payments.filter(p => p.status === "completed");
    const totalSpent = completedPayments.reduce((acc, p) => acc + (p.total_amount || p.amount || 0), 0);
    const totalGST = completedPayments.reduce((acc, p) => acc + (p.gst_amount || 0), 0);

    // Monthly spending
    const monthlyMap = {};
    completedPayments.forEach(p => {
      const month = new Date(p.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      monthlyMap[month] = (monthlyMap[month] || 0) + (p.total_amount || p.amount || 0);
    });
    const monthlySpending = Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount: Math.round(amount) }));

    // Service distribution
    const serviceMap = {};
    requests.forEach(r => {
      const name = resolveServiceName(r);
      serviceMap[name] = (serviceMap[name] || 0) + 1;
    });
    const serviceDistribution = Object.entries(serviceMap).map(([name, count]) => ({ name, count }));

    // Status breakdown
    const statusMap = {};
    requests.forEach(r => {
      statusMap[r.status] = (statusMap[r.status] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({
      name: status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1),
      count
    }));

    return {
      totalSpent: Math.round(totalSpent),
      totalGST: Math.round(totalGST),
      totalServices: requests.length,
      completedPayments: completedPayments.length,
      monthlySpending,
      serviceDistribution,
      statusBreakdown
    };
  }, [requests, payments]);

  const formatCurrency = (n) => `₹${n.toLocaleString("en-IN")}`;

  const handleExportCSV = () => {
    const headers = "Date,Description,Amount,GST,Total,Status\n";
    const rows = payments.map(p => {
      const date = new Date(p.created_at).toLocaleDateString("en-IN");
      return `${date},${p.description || "Payment"},${p.amount},${p.gst_amount || 0},${p.total_amount || p.amount},${p.status}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "gmr_payment_history.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="relative overflow-hidden bg-foreground text-background">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}
              className="text-background/80 hover:text-background hover:bg-background/10 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />Dashboard
            </Button>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight flex items-center gap-3">
                    <PieChartIcon className="w-8 h-8" /> Analytics
                  </h1>
                  <p className="text-background/70 mt-2">Your spending and service insights</p>
                </div>
                <Button variant="secondary" size="sm" className="gap-2 rounded-xl" onClick={handleExportCSV}>
                  <Download className="w-4 h-4" /> Export CSV
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-8">
          {/* Summary Cards */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: IndianRupee, label: "Total Spent", value: formatCurrency(analytics.totalSpent), color: "from-violet-500 to-purple-600" },
              { icon: CreditCard, label: "GST Paid", value: formatCurrency(analytics.totalGST), color: "from-blue-500 to-cyan-600" },
              { icon: FileText, label: "Services Used", value: analytics.totalServices, color: "from-emerald-500 to-green-600" },
              { icon: TrendingUp, label: "Payments", value: analytics.completedPayments, color: "from-amber-500 to-orange-600" },
            ].map(stat => (
              <Card key={stat.label} className="border-border/50 relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color}`} />
                <CardContent className="p-5">
                  <stat.icon className="w-5 h-5 text-muted-foreground mb-3" />
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Spending */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Monthly Spending</CardTitle>
                  <CardDescription>Your expenditure over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.monthlySpending.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No payment data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={analytics.monthlySpending}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Amount"]}
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        <Area type="monotone" dataKey="amount" stroke="#6366f1" fill="url(#colorAmount)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Service Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Services by Type</CardTitle>
                  <CardDescription>Distribution of your service requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.serviceDistribution.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No service data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={analytics.serviceDistribution} cx="50%" cy="50%" outerRadius={100} innerRadius={60}
                          paddingAngle={3} dataKey="count" nameKey="name"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {analytics.serviceDistribution.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Status Breakdown */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Service Status Overview</CardTitle>
                  <CardDescription>Current status of all your service requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.statusBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={analytics.statusBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
