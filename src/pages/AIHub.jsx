import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import {
  Brain, Sparkles, ArrowRight, Calculator, FileText, TrendingUp, Shield,
  Receipt, Search, Users, Layers, AlertTriangle, Activity, Zap, Bot, Target
} from "lucide-react";

const easing = [0.22, 1, 0.36, 1];

const clientTools = [
  { icon: Calculator, title: "AI Tax Optimizer", desc: "Compare Old vs New regime with 3-year projections and personalized deduction strategies.", link: "/ai-tax-optimizer", gradient: "from-blue-500 to-cyan-500", tag: "Tax" },
  { icon: Shield, title: "Risk Assessment", desc: "Multi-factor compliance scoring with AI-driven remediation plans and trend tracking.", link: "/risk-assessment", gradient: "from-amber-500 to-orange-500", tag: "Compliance" },
  { icon: Activity, title: "Cash Flow Forecaster", desc: "Monte Carlo simulation with 500 scenarios for probabilistic financial projections.", link: "/cash-flow-forecast", gradient: "from-cyan-500 to-blue-500", tag: "Forecast", isNew: true },
];

const adminTools = [
  { icon: Users, title: "Client Insights Dashboard", desc: "ML-powered client health scoring, churn prediction, and revenue forecasting.", link: "/admin/ai-insights", gradient: "from-violet-500 to-purple-500", tag: "Analytics", isNew: true },
  { icon: Layers, title: "Workload Optimizer", desc: "AI priority scoring, deadline risk matrix, bottleneck detection, and capacity planning.", link: "/admin/workload", gradient: "from-blue-500 to-indigo-500", tag: "Management", isNew: true },
  { icon: AlertTriangle, title: "Anomaly Console", desc: "Z-score and IQR anomaly detection across payments, requests, and client patterns.", link: "/admin/anomalies", gradient: "from-red-500 to-rose-500", tag: "Security", isNew: true },
];

const stats = [
  { value: "10+", label: "AI Tools" },
  { value: "500", label: "Simulations / Forecast" },
  { value: "15+", label: "Tax Sections Analyzed" },
  { value: "4", label: "ML Algorithms" },
];

function ToolCard({ tool, index }) {
  const Icon = tool.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: index * 0.06, duration: 0.5, ease: easing }}>
      <Link to={tool.link} className="group block h-full">
        <div className="relative rounded-2xl border border-border/50 bg-card p-6 md:p-7 h-full hover:shadow-lg hover:-translate-y-2 transition-all duration-500 overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${tool.gradient}`} />
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              {tool.isNew && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white uppercase tracking-wider animate-pulse">New</span>
              )}
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tool.tag}</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2 group-hover:text-accent transition-colors duration-300">{tool.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{tool.desc}</p>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium group-hover:gap-3 transition-all duration-500">
            Try it now <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function AIHub() {
  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-20 md:pt-40 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-violet-400/[0.06] blur-3xl pointer-events-none animate-breathe" style={{ willChange: "transform", transform: "translateZ(0)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-cyan-400/[0.04] blur-3xl pointer-events-none animate-breathe" style={{ animationDelay: "-3s" }} />

          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Brain className="w-3.5 h-3.5" /> Powered by AI & Machine Learning
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.7 }}>
              AI-Powered <span className="italic gradient-text-premium">Financial Intelligence</span>
            </motion.h1>
            <motion.p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              10+ intelligent tools powered by Monte Carlo simulations, regression analysis, anomaly detection, and decision trees — all running in your browser.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" className="h-12 px-8 rounded-full gap-2 font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.03]">
                <Link to="/ai-tax-optimizer"><Sparkles className="w-4 h-4" /> Try AI Tax Optimizer</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-full gap-2 font-medium hover:scale-[1.03] transition-all">
                <Link to="/auth?signup=true">Create Free Account</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-10 border-y border-border/40 bg-secondary/20">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-border/40">
              {stats.map((stat, i) => (
                <motion.div key={i} className="text-center py-4 px-6" initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <p className="text-4xl md:text-5xl font-bold tracking-tight mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Client Tools */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <ScrollReveal>
              <div className="text-center mb-14">
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">For Clients</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">Smart Financial Tools</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">AI-powered analysis, forecasting, and optimization — designed for individuals and businesses.</p>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clientTools.map((tool, i) => <ToolCard key={tool.title} tool={tool} index={i} />)}
            </div>
          </div>
        </section>

        {/* Admin Tools */}
        <section className="py-16 md:py-24 bg-secondary/20">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <ScrollReveal>
              <div className="text-center mb-14">
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">For CA Professionals</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">Practice Intelligence Suite</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">Advanced analytics and ML-powered tools to manage your practice efficiently.</p>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {adminTools.map((tool, i) => <ToolCard key={tool.title} tool={tool} index={i} />)}
            </div>
          </div>
        </section>

        {/* How AI Works */}
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <ScrollReveal>
              <div className="text-center mb-14">
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Technology</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">How Our AI Works</h2>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Target, title: "Data Analysis", desc: "Your financial data is analyzed using statistical algorithms — regression, Z-scores, and decision trees.", gradient: "from-blue-500 to-cyan-500", step: "01" },
                { icon: Brain, title: "AI Processing", desc: "Monte Carlo simulations run hundreds of scenarios. ML classifiers identify patterns, risks, and opportunities.", gradient: "from-violet-500 to-purple-500", step: "02" },
                { icon: Sparkles, title: "Smart Insights", desc: "Results are presented as actionable recommendations with confidence levels and visual analytics.", gradient: "from-emerald-500 to-green-500", step: "03" },
              ].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}>
                  <div className="rounded-2xl border border-border/50 bg-card p-8 text-center h-full hover:shadow-md hover:-translate-y-1 transition-all duration-500 group">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} mx-auto mb-5 flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground tracking-widest">STEP {step.step}</span>
                    <h3 className="text-xl font-semibold mt-2 mb-3 group-hover:text-accent transition-colors">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Algorithms Badge */}
        <section className="py-12 border-y border-border/40 bg-secondary/20">
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
            <p className="text-xs tracking-widest text-muted-foreground uppercase mb-6">Algorithms Powering Our AI</p>
            <div className="flex flex-wrap justify-center gap-3">
              {["Monte Carlo Simulation", "Linear Regression", "Z-Score Detection", "Decision Trees", "Exponential Smoothing", "K-Means Clustering", "Logistic Regression", "IQR Analysis"].map(algo => (
                <span key={algo} className="px-4 py-2 rounded-full bg-card border border-border/50 text-sm font-medium hover:border-accent/40 transition-colors cursor-default">
                  {algo}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <ScrollReveal>
            <div className="max-w-5xl mx-auto px-6 lg:px-12">
              <div className="rounded-3xl overflow-hidden p-12 md:p-20 text-center bg-foreground text-background relative">
                <div className="absolute top-0 left-1/2 w-[600px] h-[300px] rounded-full bg-accent/20 pointer-events-none" style={{ transform: "translateX(-50%)", filter: "blur(80px)" }} />
                <div className="relative">
                  <p className="text-xs tracking-widest uppercase mb-4 text-background/50">Start Using AI Today</p>
                  <h2 className="text-3xl md:text-5xl font-semibold mb-6 text-balance">Transform your financial decisions with AI intelligence.</h2>
                  <p className="text-background/60 mb-10 max-w-lg mx-auto leading-relaxed">
                    All tools run securely in your browser — no data leaves your device. Start analyzing in seconds.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild size="lg" className="h-12 px-8 rounded-full bg-background text-foreground hover:bg-background/90 font-medium shadow-xl hover:scale-[1.03] transition-all">
                      <Link to="/cash-flow-forecast">Try Cash Flow Forecaster</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-full border-background/30 text-background hover:bg-background/10 hover:scale-[1.03] transition-all">
                      <Link to="/auth?signup=true">Create Free Account</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </div>
    </PageTransition>
  );
}
