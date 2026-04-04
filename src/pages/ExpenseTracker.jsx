import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  Wallet, Plus, Trash2, IndianRupee, TrendingUp, TrendingDown, PieChart,
  Calendar, Filter, ArrowRight, Edit2, Check, X
} from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

const CATEGORIES = [
  { value: "office", label: "Office & Rent", icon: "🏢", color: "bg-blue-500" },
  { value: "travel", label: "Travel", icon: "✈️", color: "bg-purple-500" },
  { value: "food", label: "Food & Meals", icon: "🍽️", color: "bg-orange-500" },
  { value: "utilities", label: "Utilities", icon: "💡", color: "bg-yellow-500" },
  { value: "salary", label: "Salary & Wages", icon: "👥", color: "bg-green-500" },
  { value: "professional", label: "Professional Fees", icon: "💼", color: "bg-indigo-500" },
  { value: "marketing", label: "Marketing", icon: "📢", color: "bg-pink-500" },
  { value: "software", label: "Software & Tools", icon: "💻", color: "bg-cyan-500" },
  { value: "insurance", label: "Insurance", icon: "🛡️", color: "bg-teal-500" },
  { value: "other", label: "Other", icon: "📦", color: "bg-gray-500" },
];

const INITIAL_EXPENSES = [
  { id: 1, date: "2026-03-28", category: "office", description: "Coworking Space Rent", amount: 15000, deductible: true },
  { id: 2, date: "2026-03-25", category: "software", description: "Tally Prime Subscription", amount: 2250, deductible: true },
  { id: 3, date: "2026-03-20", category: "travel", description: "Client Meeting - Cab", amount: 850, deductible: true },
  { id: 4, date: "2026-03-18", category: "food", description: "Team Lunch", amount: 1200, deductible: false },
  { id: 5, date: "2026-03-15", category: "professional", description: "Legal Consultation", amount: 5000, deductible: true },
  { id: 6, date: "2026-03-10", category: "utilities", description: "Internet & Phone Bill", amount: 1800, deductible: true },
  { id: 7, date: "2026-03-05", category: "marketing", description: "Google Ads Campaign", amount: 3500, deductible: true },
  { id: 8, date: "2026-02-28", category: "salary", description: "Staff Salary - Feb", amount: 45000, deductible: true },
  { id: 9, date: "2026-02-20", category: "insurance", description: "Business Insurance Premium", amount: 8000, deductible: true },
];

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [editingId, setEditingId] = useState(null);

  // New expense form
  const [newExpense, setNewExpense] = useState({ date: "", category: "other", description: "", amount: "", deductible: true });

  const filteredExpenses = useMemo(() => {
    if (filterCategory === "all") return expenses;
    return expenses.filter(e => e.category === filterCategory);
  }, [expenses, filterCategory]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const deductibleTotal = expenses.filter(e => e.deductible).reduce((sum, e) => sum + e.amount, 0);
  const thisMonthTotal = expenses.filter(e => e.date.startsWith("2026-03")).reduce((sum, e) => sum + e.amount, 0);
  const lastMonthTotal = expenses.filter(e => e.date.startsWith("2026-02")).reduce((sum, e) => sum + e.amount, 0);
  const monthChange = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : 0;

  const categoryBreakdown = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: Math.round((amount / totalExpenses) * 100),
        ...CATEGORIES.find(c => c.value === cat),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, totalExpenses]);

  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.date) return;
    setExpenses(prev => [
      { ...newExpense, id: Date.now(), amount: parseFloat(newExpense.amount) },
      ...prev,
    ]);
    setNewExpense({ date: "", category: "other", description: "", amount: "", deductible: true });
    setShowForm(false);
  };

  const deleteExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id));

  const formatCurrency = (n) => `₹${n.toLocaleString("en-IN")}`;

  const stats = [
    { icon: Wallet, label: "Total Expenses", value: formatCurrency(totalExpenses), color: "from-violet-500 to-purple-600", lightBg: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400" },
    { icon: IndianRupee, label: "This Month", value: formatCurrency(thisMonthTotal), color: "from-blue-500 to-cyan-600", lightBg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400", subtitle: monthChange !== 0 ? `${monthChange > 0 ? "+" : ""}${monthChange}%` : null, subtitleColor: monthChange > 0 ? "text-red-500" : "text-emerald-500" },
    { icon: TrendingDown, label: "Deductible", value: formatCurrency(deductibleTotal), color: "from-emerald-500 to-green-600", lightBg: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: PieChart, label: "Categories", value: categoryBreakdown.length, color: "from-amber-500 to-orange-600", lightBg: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-violet-400/[0.06] blur-3xl pointer-events-none animate-breathe" />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Wallet className="w-3.5 h-3.5" /> Finance
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.12 }}>
              Expense <span className="italic gradient-text-premium">Tracker</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.28 }}>
              Track, categorize, and analyze your business expenses for effortless year-end filing.
            </motion.p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-6">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div key={stat.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: easing, delay: 0.1 * i }}
                  className="relative group rounded-2xl border border-border/60 bg-card overflow-hidden shadow-soft hover:shadow-md hover:-translate-y-1 transition-all duration-500">
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color}`} />
                  <div className="p-5 md:p-6">
                    <div className={`w-10 h-10 rounded-xl ${stat.lightBg} flex items-center justify-center mb-4`}>
                      <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                    {stat.subtitle && <p className={`text-xs font-medium mt-1 ${stat.subtitleColor}`}>{stat.subtitle} vs last month</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 md:py-12">
          <div className="max-w-5xl mx-auto px-6 lg:px-12 space-y-8">
            {/* Category Breakdown */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5 text-violet-500" />Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.category} className="flex items-center gap-4">
                      <span className="text-xl w-8 text-center">{cat.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{cat.label}</span>
                          <span className="text-sm text-muted-foreground">{formatCurrency(cat.amount)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.percentage}%` }}
                            transition={{ duration: 0.8, ease: easing }}
                            className={`h-full rounded-full ${cat.color}`}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground w-10 text-right">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Expense List */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold tracking-tight">All Expenses</h2>
                <div className="flex items-center gap-3">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[160px] h-9 rounded-xl text-sm">
                      <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setShowForm(!showForm)} size="sm" className="rounded-xl gap-2">
                    <Plus className="w-4 h-4" />Add
                  </Button>
                </div>
              </div>

              {/* Add Form */}
              <AnimatePresence>
                {showForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: easing }}
                    className="overflow-hidden mb-6">
                    <Card className="border-border/50">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Date</Label>
                            <Input type="date" value={newExpense.date} onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))} className="premium-input" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Category</Label>
                            <Select value={newExpense.category} onValueChange={v => setNewExpense(p => ({ ...p, category: v }))}>
                              <SelectTrigger className="premium-input"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs">Description</Label>
                            <Input placeholder="What was this for?" value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} className="premium-input" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Amount (₹)</Label>
                            <Input type="number" placeholder="0" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} className="premium-input" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={newExpense.deductible} onChange={e => setNewExpense(p => ({ ...p, deductible: e.target.checked }))} className="rounded" />
                            <span className="text-sm text-muted-foreground">Tax Deductible</span>
                          </label>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
                            <Button size="sm" onClick={addExpense} className="rounded-xl gap-2"><Check className="w-4 h-4" />Save</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expense Items */}
              <div className="space-y-2">
                {filteredExpenses.map((expense, i) => {
                  const cat = CATEGORIES.find(c => c.value === expense.category);
                  return (
                    <motion.div key={expense.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card hover:shadow-soft transition-all group">
                      <div className="flex items-center gap-3">
                        <span className="text-xl w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center">{cat?.icon || "📦"}</span>
                        <div>
                          <p className="font-medium text-sm">{expense.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                            {expense.deductible && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">Deductible</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm">{formatCurrency(expense.amount)}</span>
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <ScrollReveal>
              <div className="mt-16 text-center">
                <p className="text-muted-foreground mb-4">Need help organizing your finances for tax filing?</p>
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
