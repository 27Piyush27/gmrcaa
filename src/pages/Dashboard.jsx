import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useSpring, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";


import {
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  TrendingUp,
  User,
  CreditCard,

  Shield,
  Briefcase,
  Download,
  ArrowRight,
  Sparkles,
  Plus,
  MessageCircle,
  ChevronRight,
  IndianRupee,
  Activity } from
"lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useServiceNotifications } from "@/hooks/useServiceNotifications";
import { ServiceStatusStepper } from "@/components/ServiceStatusStepper";
import { ServicePaymentButton } from "@/components/ServicePaymentButton";
import { ClientDocumentUpload } from "@/components/ClientDocumentUpload";
import { ServiceRating } from "@/components/ServiceRating";
import { InvoiceButton } from "@/components/InvoiceButton";
import { TaxDeadlineCalendar } from "@/components/TaxDeadlineCalendar";
import { SkeletonDashboard } from "@/components/SkeletonLoaders";
import { Link } from "react-router-dom";
import { servicesData } from "@/lib/servicesData";
import { resolveServiceName } from "@/lib/resolveServiceName";














// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const spring = useSpring(0, { stiffness: 100, damping: 20 });

  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, value, spring]);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v).toString();
    });
  }, [spring]);

  return <span ref={ref}>0</span>;
}

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_CONFIG =

{
  completed: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", label: "Ready to Pay", dot: "bg-emerald-500" },
  in_progress: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800", label: "In Progress", dot: "bg-blue-500" },
  pending: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800", label: "Pending", dot: "bg-amber-500" },
  paid: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", label: "Paid", dot: "bg-emerald-600" },
  cancelled: { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40", border: "border-red-200 dark:border-red-800", label: "Cancelled", dot: "bg-red-500" }
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { color: "text-muted-foreground", bg: "bg-secondary", border: "border-border", label: status, dot: "bg-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === "in_progress" || status === "in_progress" ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>);

}

// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, role, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);

  const fetchServiceRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase.
      from("service_requests").
      select(`id, user_id, service_id, status, progress, notes, amount, document_url, created_at, services (name)`).
      order("created_at", { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching service requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useServiceNotifications(fetchServiceRequests);

  useEffect(() => {
    if (!authLoading && !user) {navigate("/auth");return;}
    if (user) fetchServiceRequests();
  }, [user, authLoading, navigate, fetchServiceRequests]);

  const handleDownloadDocument = async (documentUrl) => {
    try {
      const { data, error } = await supabase.storage.from("service-documents").download(documentUrl);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;a.download = documentUrl.split("/").pop() || "document";
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {console.error("Download error:", error);}
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full" />
        
      </div>);

  }

  const initials = (profile?.name || user.email || "U").
  split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const roleIcon = role === "admin" ? <Shield className="h-4 w-4" /> : role === "ca" ? <Briefcase className="h-4 w-4" /> : <User className="h-4 w-4" />;
  const roleLabel = role === "admin" ? "Administrator" : role === "ca" ? "Chartered Accountant" : "Client";

  const isStaff = role === "admin" || role === "ca";

  // Role-aware stats
  const stats = isStaff ? [
    { icon: FileText, label: "Total Cases", value: requests.length, color: "from-violet-500 to-purple-600", lightBg: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400" },
    { icon: Activity, label: "In Progress", value: requests.filter(r => r.status === "in_progress").length, color: "from-blue-500 to-cyan-600", lightBg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
    { icon: CheckCircle, label: "Completed", value: requests.filter(r => r.status === "completed" || r.status === "paid").length, color: "from-emerald-500 to-green-600", lightBg: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: IndianRupee, label: "Revenue Collected", value: requests.filter(r => r.status === "paid").reduce((sum, r) => sum + (r.amount || 0), 0), color: "from-amber-500 to-orange-600", lightBg: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400", prefix: "₹" },
  ] : [
    { icon: FileText, label: "Total Services", value: requests.length, color: "from-violet-500 to-purple-600", lightBg: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400" },
    { icon: Activity, label: "In Progress", value: requests.filter(r => r.status === "in_progress").length, color: "from-blue-500 to-cyan-600", lightBg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
    { icon: CheckCircle, label: "Ready to Pay", value: requests.filter(r => r.status === "completed").length, color: "from-emerald-500 to-green-600", lightBg: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: CreditCard, label: "Paid & Done", value: requests.filter(r => r.status === "paid").length, color: "from-amber-500 to-orange-600", lightBg: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400" },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Cinematic Hero Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-foreground">
        {/* Ambient gradient blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-white/[0.03] blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-14 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
            
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 20 }}
              className="relative flex-shrink-0">
              
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl glass-dark border border-white/10 flex items-center justify-center text-background text-2xl md:text-3xl font-bold shadow-2xl">
                {initials}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-400 border-2 border-foreground flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            </motion.div>

            {/* Name & role */}
            <div className="flex-1">
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-background/50 text-sm font-medium tracking-widest uppercase mb-1">
                
                {isStaff ? "CA Workspace" : "Welcome back"}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="text-3xl md:text-4xl lg:text-5xl font-semibold text-background tracking-tight">
                
                {profile?.name || user.email?.split("@")[0]}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="flex items-center gap-3 mt-2">
                
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-background/80 text-xs font-medium">
                  {roleIcon}{roleLabel}
                </span>
                <span className="text-background/40 text-xs">{user.email}</span>
              </motion.div>
            </div>

            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3">
              
              {isStaff ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.18)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-dark border border-white/10 text-background text-sm font-medium transition-colors">
                    <Briefcase className="w-4 h-4" />
                    Manage Cases
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.18)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/contact")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-dark border border-white/10 text-background text-sm font-medium transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    Contact Support
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.18)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/services")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-dark border border-white/10 text-background text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" />
                    New Service
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.18)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/contact")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-dark border border-white/10 text-background text-sm font-medium transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    Support
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-10">

        {/* ── Stats Grid ─────────────────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {stats.map((stat) =>
          <motion.div
            key={stat.label}
            variants={itemVariants}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="relative group rounded-2xl border border-border/60 bg-card overflow-hidden shadow-soft cursor-default transition-all duration-500 hover:shadow-md hover:-translate-y-1">
            
              {/* Gradient top accent */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color}`} />
              <div className="p-5 md:p-6">
                <div className={`w-10 h-10 rounded-xl ${stat.lightBg} flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <p className="text-sm text-muted-foreground font-medium mb-1">{stat.label}</p>
                <p className="text-4xl font-bold tracking-tight">
                  <AnimatedNumber value={stat.value} />
                </p>
              </div>
              {/* Hover glow */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${stat.color} pointer-events-none`} style={{ opacity: 0 }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.03"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0"} />
            
            </motion.div>
          )}
        </motion.div>

        {/* ── Service Requests ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                  {!isStaff ? "My Services" : "All Service Requests"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {!isStaff ? "Pay after service completion — always." : "Manage and track client service requests."}
                </p>
              </div>
              {!isStaff && (
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl border-border/60"
                  onClick={() => navigate("/services")}>
                  
                  <Plus className="w-4 h-4" />
                  Request New
                </Button>
              </motion.div>
              )}
            </div>

          {loadingRequests ?
          <SkeletonDashboard /> :
          requests.length === 0 ?
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-dashed border-border/60 bg-secondary/20 py-20 text-center">
            
              <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-5 flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No services yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                Request a service and pay only after our CA team completes the work.
              </p>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button onClick={() => navigate("/services")} className="gap-2 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                  Explore Services
                </Button>
              </motion.div>
            </motion.div> :

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4">
            
              {requests.map((request) => {
              const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending;
              const isExpanded = expandedCard === request.id;

              return (
                <motion.div
                  key={request.id}
                  variants={itemVariants}
                  layout
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="group relative apple-card overflow-hidden">
                  
                    {/* Left status accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${cfg.dot}`} />

                    <div className="p-6 md:p-7 pl-7 md:pl-8">
                      {/* ── Top row ────────────────────────────────────── */}
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0 sm:justify-between mb-5">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            {request.status === "completed" && <CheckCircle className={`w-5 h-5 ${cfg.color}`} />}
                            {request.status === "in_progress" && <Clock className={`w-5 h-5 ${cfg.color} animate-pulse`} />}
                            {request.status === "pending" && <Clock className={`w-5 h-5 ${cfg.color}`} />}
                            {request.status === "paid" && <CreditCard className={`w-5 h-5 ${cfg.color}`} />}
                            {request.status === "cancelled" && <AlertCircle className={`w-5 h-5 ${cfg.color}`} />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-base md:text-lg leading-tight">
                              {resolveServiceName(request)}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(request.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                              </span>
                              {request.amount &&
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                  <IndianRupee className="w-3 h-3" />
                                  {request.amount.toLocaleString("en-IN")}
                                </span>
                            }
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <StatusBadge status={request.status} />
                          <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setExpandedCard(isExpanded ? null : request.id)}
                          className={`w-7 h-7 rounded-full border border-border/60 bg-secondary/50 flex items-center justify-center transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                          
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </motion.button>
                        </div>
                      </div>

                      {/* ── Progress bar ────────────────────────────────── */}
                      {request.status !== "cancelled" &&
                    <div className="mb-5">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                            <span>Progress</span>
                            <span className="font-medium text-foreground">{request.progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${request.progress}%` }}
                          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                          className={`h-full rounded-full bg-gradient-to-r ${request.status === "paid" ?
                          "from-emerald-400 to-emerald-600" :
                          request.status === "completed" ?
                          "from-emerald-400 to-emerald-500" :
                          "from-blue-400 to-blue-600"}`
                          } />
                        
                          </div>
                        </div>
                    }

                      {/* ── Stepper ─────────────────────────────────────── */}
                      <ServiceStatusStepper status={request.status} className="mb-5" />

                      {/* ── Expandable details ──────────────────────────── */}
                      <AnimatePresence initial={false}>
                        {isExpanded &&
                      <motion.div
                        key="details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden">
                        
                            <div className="space-y-4 mb-5 pt-2">
                              {/* CA Notes */}
                              {request.notes &&
                          <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes from your CA</p>
                                  <p className="text-sm leading-relaxed">{request.notes}</p>
                                </div>
                          }

                              {/* Doc download */}
                              {request.document_url &&
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDownloadDocument(request.document_url)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 bg-secondary/40 text-sm font-medium hover:bg-secondary/80 transition-colors w-full sm:w-auto">
                            
                                  <Download className="w-4 h-4" />
                                  Download Documents
                                </motion.button>
                          }

                              {/* Client upload — only for clients */}
                              {!isStaff && (
                              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                                <ClientDocumentUpload serviceRequestId={request.id} status={request.status} />
                              </div>
                              )}
                            </div>
                          </motion.div>
                      }
                      </AnimatePresence>

                      {/* ── Payment + Rating — client only ──────────────── */}
                      {!isStaff && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                        <ServicePaymentButton
                        serviceRequestId={request.id}
                        serviceName={resolveServiceName(request)}
                        amount={request.amount}
                        status={request.status}
                        onPaymentSuccess={fetchServiceRequests} />
                      
                        {!isExpanded &&
                      <motion.button
                        whileHover={{ x: 3 }}
                        onClick={() => setExpandedCard(request.id)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors self-end sm:self-auto">
                        
                            View details <ChevronRight className="w-3 h-3" />
                          </motion.button>
                      }
                        {request.status === "paid" && (
                          <div className="flex flex-wrap gap-2">
                            <ServiceRating serviceRequestId={request.id} serviceName={request.services?.name} />
                            <InvoiceButton
                              paymentId={request.payment_id || request.id}
                              serviceTitle={resolveServiceName(request)}
                              baseAmount={Math.round((request.amount || 0) / 1.18)}
                              gstAmount={Math.round((request.amount || 0) - (request.amount || 0) / 1.18)}
                              totalAmount={request.amount || 0}
                              date={new Date(request.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs rounded-full"
                              label="Download Invoice"
                            />
                          </div>
                        )}
                      </div>
                      )}
                    </div>
                  </motion.div>);

            })}
            </motion.div>
          }
        </motion.div>

        {/* ── Quick Actions ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {(isStaff ? [
            {
              icon: Briefcase,
              title: "Admin Panel",
              desc: "Manage all client service requests, update statuses, and upload deliverables.",
              action: () => navigate("/admin"),
              label: "Open Panel",
              gradient: "from-violet-500/10 to-purple-500/5"
            },
            {
              icon: TrendingUp,
              title: "Revenue Analytics",
              desc: "View collections, monthly revenue trends, and payment history.",
              action: () => navigate("/analytics"),
              label: "View Revenue",
              gradient: "from-blue-500/10 to-cyan-500/5"
            },
            {
              icon: Calendar,
              title: "Tax Deadlines",
              desc: "Stay on top of upcoming ITR, GST, and TDS filing deadlines for clients.",
              action: () => navigate("/tax-calendar"),
              label: "View Deadlines",
              gradient: "from-emerald-500/10 to-green-500/5"
            },
            {
              icon: MessageCircle,
              title: "Contact Support",
              desc: "Reach admin team for system help or escalations.",
              action: () => navigate("/contact"),
              label: "Contact Us",
              gradient: "from-amber-500/10 to-orange-500/5"
            },
          ] : [
            {
              icon: MessageCircle,
              title: "Get Support",
              desc: "Reach our team and get your queries resolved quickly.",
              action: () => navigate("/contact"),
              label: "Contact Us",
              gradient: "from-violet-500/10 to-purple-500/5"
            },
            {
              icon: TrendingUp,
              title: "View Analytics",
              desc: "Track your spending, services, and payment history.",
              action: () => navigate("/analytics"),
              label: "Analytics",
              gradient: "from-blue-500/10 to-cyan-500/5"
            },
            {
              icon: Calendar,
              title: "Book Consultation",
              desc: "Schedule a one-on-one session with our expert CAs.",
              action: () => navigate("/appointments"),
              label: "Book Now",
              gradient: "from-emerald-500/10 to-green-500/5"
            },
            {
              icon: User,
              title: "My Profile",
              desc: "Update your personal details, PAN, and GSTIN.",
              action: () => navigate("/profile"),
              label: "Edit Profile",
              gradient: "from-amber-500/10 to-orange-500/5"
            },
          ]).map(({ icon: Icon, title, desc, action, label, gradient }) =>
          <motion.div
            key={title}
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={action}
            className={`hover-lift group relative rounded-2xl border border-border/60 bg-gradient-to-br ${gradient} bg-card p-6 md:p-7 cursor-pointer overflow-hidden`}>
            
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border/60 flex items-center justify-center mb-4 shadow-sm">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-base mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{desc}</p>
                  <motion.span
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 400 }}>
                  
                    {label}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </motion.span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ── Tax Deadline Calendar — only for users with active services ── */}
        {requests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-border/60 bg-card p-6 md:p-7">
          <TaxDeadlineCalendar />
        </motion.div>
        )}
      </div>
    </div>);

}