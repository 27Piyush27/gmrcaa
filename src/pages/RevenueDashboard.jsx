import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useAuth } from "@/contexts/AuthContext";
import {
  IndianRupee, TrendingUp, TrendingDown, Users, FileText, CreditCard,
  ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Calendar
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];
const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;

const MONTHLY_DATA = [
  { month: "Apr", revenue: 285000, expenses: 78000, clients: 12, invoices: 15 },
  { month: "May", revenue: 340000, expenses: 82000, clients: 15, invoices: 18 },
  { month: "Jun", revenue: 295000, expenses: 75000, clients: 11, invoices: 14 },
  { month: "Jul", revenue: 420000, expenses: 95000, clients: 18, invoices: 22 },
  { month: "Aug", revenue: 380000, expenses: 88000, clients: 16, invoices: 20 },
  { month: "Sep", revenue: 510000, expenses: 110000, clients: 22, invoices: 28 },
  { month: "Oct", revenue: 465000, expenses: 102000, clients: 20, invoices: 25 },
  { month: "Nov", revenue: 520000, expenses: 115000, clients: 24, invoices: 30 },
  { month: "Dec", revenue: 680000, expenses: 145000, clients: 32, invoices: 40 },
  { month: "Jan", revenue: 590000, expenses: 125000, clients: 28, invoices: 35 },
  { month: "Feb", revenue: 445000, expenses: 98000, clients: 19, invoices: 24 },
  { month: "Mar", revenue: 820000, expenses: 175000, clients: 38, invoices: 48 },
];

const SERVICE_REVENUE = [
  { name: "ITR Filing", revenue: 2450000, count: 185, color: "bg-blue-500", percentage: 38 },
  { name: "GST Registration & Returns", revenue: 1580000, count: 120, color: "bg-emerald-500", percentage: 24 },
  { name: "Audit & Assurance", revenue: 980000, count: 28, color: "bg-violet-500", percentage: 15 },
  { name: "Company Registration", revenue: 650000, count: 42, color: "bg-amber-500", percentage: 10 },
  { name: "Tax Planning & Advisory", revenue: 480000, count: 35, color: "bg-pink-500", percentage: 7 },
  { name: "Other Services", revenue: 360000, count: 55, color: "bg-gray-500", percentage: 6 },
];

const RECENT_PAYMENTS = [
  { client: "Rahul Sharma", service: "ITR Filing (Salaried)", amount: 2999, date: "2 hours ago", status: "completed" },
  { client: "Priya Industries", service: "GST Monthly Return", amount: 5000, date: "5 hours ago", status: "completed" },
  { client: "Tech Innovations Pvt Ltd", service: "Statutory Audit", amount: 45000, date: "1 day ago", status: "completed" },
  { client: "Amit Verma", service: "Tax Planning", amount: 7500, date: "1 day ago", status: "pending" },
  { client: "Green Earth Exports", service: "Company Registration", amount: 15000, date: "2 days ago", status: "completed" },
  { client: "Neha Kapoor", service: "ITR Filing (Business)", amount: 4999, date: "3 days ago", status: "completed" },
  { client: "Sunrise Hotels", service: "GST Annual Return", amount: 12000, date: "4 days ago", status: "pending" },
];

export default function RevenueDashboard() {
  const { role } = useAuth();
  const [period, setPeriod] = useState("yearly");
  const [activeTab, setActiveTab] = useState("overview");

  const isStaff = role === "admin" || role === "ca";
  if (!isStaff) return <Navigate to="/dashboard" replace />;

  const totalRevenue = MONTHLY_DATA.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = MONTHLY_DATA.reduce((s, m) => s + m.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalClients = MONTHLY_DATA.reduce((s, m) => s + m.clients, 0);
  const profitMargin = Math.round((netProfit / totalRevenue) * 100);
  const maxRevenue = Math.max(...MONTHLY_DATA.map(m => m.revenue));

  const thisMonth = MONTHLY_DATA[MONTHLY_DATA.length - 1];
  const lastMonth = MONTHLY_DATA[MONTHLY_DATA.length - 2];
  const revenueGrowth = Math.round(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100);

  const stats = [
    { icon: IndianRupee, label: "Total Revenue", value: fmt(totalRevenue), growth: `+${revenueGrowth}%`, growthDir: "up", color: "from-emerald-500 to-green-600", lightBg: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: TrendingDown, label: "Total Expenses", value: fmt(totalExpenses), growth: null, color: "from-red-500 to-orange-600", lightBg: "bg-red-50 dark:bg-red-950/30", iconColor: "text-red-600 dark:text-red-400" },
    { icon: TrendingUp, label: "Net Profit", value: fmt(netProfit), growth: `${profitMargin}% margin`, growthDir: "up", color: "from-blue-500 to-cyan-600", lightBg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
    { icon: Users, label: "Total Clients", value: totalClients, growth: `+${thisMonth.clients} this month`, growthDir: "up", color: "from-violet-500 to-purple-600", lightBg: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-10 md:pt-36 md:pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="max-w-6xl mx-auto px-6 lg:px-12 relative">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-4">
                  <BarChart3 className="w-3.5 h-3.5" /> Admin Analytics
                </motion.div>
                <motion.h1 className="text-4xl sm:text-5xl font-semibold tracking-tight"
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}>
                  Revenue <span className="italic gradient-text-premium">Dashboard</span>
                </motion.h1>
              </div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[160px] h-10 rounded-xl">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">FY 2025-26</SelectItem>
                    <SelectItem value="q1">Q1 (Apr-Jun)</SelectItem>
                    <SelectItem value="q2">Q2 (Jul-Sep)</SelectItem>
                    <SelectItem value="q3">Q3 (Oct-Dec)</SelectItem>
                    <SelectItem value="q4">Q4 (Jan-Mar)</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div key={stat.label}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: easing, delay: 0.1 * i }}
                  className="relative group rounded-2xl border border-border/60 bg-card overflow-hidden shadow-soft hover:shadow-md hover:-translate-y-1 transition-all duration-500">
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color}`} />
                  <div className="p-5">
                    <div className={`w-10 h-10 rounded-xl ${stat.lightBg} flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                    {stat.growth && (
                      <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${stat.growthDir === "up" ? "text-emerald-500" : "text-red-500"}`}>
                        {stat.growthDir === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {stat.growth}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-secondary/80 rounded-xl h-11">
                <TabsTrigger value="overview" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <BarChart3 className="w-4 h-4" />Revenue
                </TabsTrigger>
                <TabsTrigger value="services" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <PieChart className="w-4 h-4" />By Service
                </TabsTrigger>
                <TabsTrigger value="transactions" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <CreditCard className="w-4 h-4" />Payments
                </TabsTrigger>
              </TabsList>

              {/* Revenue Chart */}
              <TabsContent value="overview">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Monthly Revenue</CardTitle>
                    <CardDescription>Revenue trend for FY 2025-26</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 h-64">
                      {MONTHLY_DATA.map((m, i) => {
                        const height = (m.revenue / maxRevenue) * 100;
                        const expHeight = (m.expenses / maxRevenue) * 100;
                        return (
                          <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                            <div className="w-full flex flex-col items-center gap-0.5 relative" style={{ height: '220px' }}>
                              <div className="absolute bottom-0 w-full flex gap-0.5 items-end justify-center">
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${height}%` }}
                                  transition={{ duration: 0.6, delay: i * 0.05, ease: easing }}
                                  className="w-[45%] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-emerald-300 transition-colors relative"
                                >
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] bg-popover border border-border rounded-lg px-2 py-1 shadow-md font-medium z-10">
                                    {fmt(m.revenue)}
                                  </div>
                                </motion.div>
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${expHeight}%` }}
                                  transition={{ duration: 0.6, delay: i * 0.05 + 0.1, ease: easing }}
                                  className="w-[45%] rounded-t-md bg-gradient-to-t from-red-500/60 to-red-400/40"
                                />
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium mt-1">{m.month}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-6 mt-4 justify-center">
                      <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="w-3 h-3 rounded bg-emerald-500" />Revenue</span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="w-3 h-3 rounded bg-red-400/60" />Expenses</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Service Breakdown */}
              <TabsContent value="services" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Revenue by Service</CardTitle>
                    <CardDescription>Which services generate the most revenue</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {SERVICE_REVENUE.map((service, i) => (
                      <motion.div key={service.name}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${service.color}`} />
                            <span className="text-sm font-medium">{service.name}</span>
                            <span className="text-xs text-muted-foreground">({service.count} clients)</span>
                          </div>
                          <span className="text-sm font-semibold">{fmt(service.revenue)}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${service.percentage}%` }}
                            transition={{ duration: 0.8, ease: easing, delay: i * 0.05 }}
                            className={`h-full rounded-full ${service.color}`}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recent Payments */}
              <TabsContent value="transactions" className="space-y-3">
                {RECENT_PAYMENTS.map((payment, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card hover:shadow-soft transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold">
                        {payment.client.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{payment.client}</p>
                        <p className="text-xs text-muted-foreground">{payment.service} · {payment.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">{fmt(payment.amount)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        payment.status === "completed" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" :
                        "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                      }`}>{payment.status === "completed" ? "Paid" : "Pending"}</span>
                    </div>
                  </motion.div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
