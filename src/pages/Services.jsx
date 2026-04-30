import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { servicesData } from "@/lib/servicesData";
import { resolveServiceIdForDb } from "@/lib/serviceIdResolver";
import { notifyStaff } from "@/lib/notifications";
import { getErrorMessage } from "@/lib/errorMessage";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useMemo, useCallback } from "react";
import { PageTransition } from "@/components/PageTransition";
import {
  Calculator,
  FileCheck,
  Percent,
  Users,
  TrendingUp,
  Building,
  Shield,
  ClipboardCheck,
  Clock,
  ArrowRight,
  IndianRupee,
  Sparkles,
  Loader2,
  CheckCircle,
  Star,
  Search,
  X,
  Building2,
  FileStack,
  UserCheck,
  Lightbulb,
} from "lucide-react";

/* ── Icon map ────────────────────────────────────────────────────────────── */
const iconMap = {
  Calculator, FileCheck, Percent, Users,
  TrendingUp, Building, Shield, ClipboardCheck,
};

/* ── Category config ─────────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: "All",          label: "All Services", Icon: Sparkles },
  { id: "Tax Services", label: "Tax",          Icon: Calculator },
  { id: "GST Services", label: "GST",          Icon: Percent },
  { id: "Company Law",  label: "Company Law",  Icon: Building2 },
  { id: "Audit Services", label: "Audit",      Icon: FileStack },
  { id: "Compliance",   label: "Compliance",   Icon: Shield },
  { id: "HR & Payroll", label: "HR & Payroll", Icon: UserCheck },
  { id: "Advisory",     label: "Advisory",     Icon: Lightbulb },
];

/* ── Minimal fade transition ─────────────────────────────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 },
  }),
};

/* ═════════════════════════════════════════════════════════════════════════ */
export default function Services() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requestingId, setRequestingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  /* ── Filtering ────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return servicesData.filter((s) => {
      const matchesCat = activeCategory === "All" || s.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.shortDesc?.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  /* ── Service Request ──────────────────────────────────────────────────── */
  const handleRequestService = useCallback(async (serviceId) => {
    if (!user) {
      toast.error("Please login to request a service");
      navigate("/auth", { state: { redirectTo: `/services` } });
      return;
    }
    const selectedService = servicesData.find((s) => s.id === serviceId);
    const backendServiceId = selectedService?.backendServiceId ?? serviceId;
    const serviceIdForDb = await resolveServiceIdForDb(backendServiceId, selectedService?.title);

    setRequestingId(serviceId);
    try {
      const { data: existing, error: checkError } = await supabase
        .from("service_requests")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("service_id", serviceIdForDb)
        .in("status", ["pending", "in_progress", "completed"]);
      if (checkError) throw checkError;
      if (existing?.length > 0) {
        toast.info("You already have an active request for this service.");
        navigate("/dashboard");
        return;
      }
      const { error: insertError } = await supabase
        .from("service_requests")
        .insert({ user_id: user.id, service_id: serviceIdForDb, status: "pending", progress: 0 });
      if (insertError) throw insertError;
      toast.success("Service requested! Track progress on your dashboard.");
      notifyStaff(
        "New Service Request",
        `A client requested the ${selectedService?.title || "new"} service.`,
        "service_update"
      );
      navigate("/dashboard");
    } catch (error) {
      console.error("Error requesting service:", error);
      toast.error(getErrorMessage(error, "Failed to request service. Please try again."));
    } finally {
      setRequestingId(null);
    }
  }, [user, navigate]);

  return (
    <PageTransition>
      <div className="min-h-screen">

        {/* ── Hero — lightweight, no 3D ──────────────────────────────── */}
        <section className="relative pt-28 pb-14 md:pt-36 md:pb-20 overflow-hidden">
          {/* Soft ambient glow — pure CSS, GPU-composited */}
          <div
            className="absolute top-1/4 left-1/3 w-[28rem] h-[28rem] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 70%)", transform: "translateZ(0)" }}
          />
          <div
            className="absolute bottom-0 right-[15%] w-[24rem] h-[24rem] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(260 60% 55% / 0.04) 0%, transparent 70%)", transform: "translateZ(0)" }}
          />

          <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {servicesData.length} Professional Services
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-balance mb-6">
              Expert Financial
              <br />
              <span className="italic gradient-text-premium">Solutions.</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
              Request a service and pay only after our CA team completes the work.{" "}
              <span className="text-foreground font-medium">Zero risk. Full transparency.</span>
            </p>

            {/* Process steps */}
            <div className="flex flex-wrap justify-center items-center gap-3">
              {["Request", "We Work", "You Pay"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border/50 bg-background/50 backdrop-blur-sm text-xs text-muted-foreground font-medium">
                    <span className="w-5 h-5 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    {step}
                  </span>
                  {i < 2 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 hidden sm:block" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Sticky filter bar ──────────────────────────────────────── */}
        <div
          className="sticky top-16 z-30 bg-background/85 backdrop-blur-md border-b border-border/40"
          style={{ transform: "translateZ(0)" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

              {/* Search */}
              <div className="relative flex-shrink-0 sm:w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search services…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-8 rounded-xl border border-border/50 bg-secondary/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category pills — plain CSS transitions, no LayoutGroup */}
              <div className="flex-1 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1.5 min-w-max">
                  {CATEGORIES.map((cat) => {
                    const active = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                          active
                            ? "bg-foreground text-background shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        <cat.Icon className="w-3.5 h-3.5" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Count */}
              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 hidden sm:block">
                {filtered.length} {filtered.length === 1 ? "service" : "services"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Services Grid ──────────────────────────────────────────── */}
        <section className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
            {filtered.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-5 flex items-center justify-center">
                  <Search className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No services found</h3>
                <p className="text-muted-foreground text-sm mb-6">Try a different search or category</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                  className="rounded-xl gap-2"
                >
                  <X className="w-4 h-4" /> Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {filtered.map((service, index) => {
                  const IconComp = iconMap[service.icon];
                  const isRequesting = requestingId === service.id;

                  return (
                    <motion.div
                      key={service.id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      className="group"
                    >
                      <div className="relative h-full rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-500 ease-out hover:border-border/80 hover:shadow-lg hover:-translate-y-1">
                        {/* Top accent line — pure CSS */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Popular ribbon */}
                        {service.popular && (
                          <div className="absolute top-5 right-5 z-10">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-foreground text-background text-[10px] font-semibold shadow-md">
                              <Star className="w-3 h-3 fill-current" />
                              Popular
                            </span>
                          </div>
                        )}

                        <div className="p-6 md:p-7 flex flex-col h-full">
                          {/* Icon + Category */}
                          <div className="flex items-start justify-between mb-5">
                            <div className="w-11 h-11 rounded-xl bg-secondary border border-border/40 flex items-center justify-center text-foreground transition-transform duration-300 group-hover:scale-105">
                              {IconComp && <IconComp className="h-5 w-5" />}
                            </div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-border/40 bg-secondary/40 text-[11px] text-muted-foreground font-medium">
                              {service.category}
                            </span>
                          </div>

                          {/* Title & description */}
                          <Link
                            to={`/services/${service.id}`}
                            className="text-lg md:text-xl font-semibold leading-snug mb-2 hover:text-accent transition-colors duration-200 block"
                          >
                            {service.title}
                          </Link>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-2">
                            {service.shortDesc}
                          </p>

                          {/* Features — 3 max */}
                          <ul className="space-y-2 mb-5 flex-grow">
                            {service.features.slice(0, 3).map((f, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm">
                                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span className="text-muted-foreground leading-snug">{f}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Bottom: Pricing + CTA */}
                          <div className="pt-5 border-t border-border/40">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest">From</p>
                                <div className="flex items-baseline gap-0.5">
                                  <IndianRupee className="w-4 h-4 self-start mt-0.5 text-foreground" />
                                  <span className="text-2xl font-bold tracking-tight">
                                    {service.price.toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {service.duration}
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <Shield className="w-3.5 h-3.5" />
                                  Pay after
                                </span>
                              </div>
                            </div>

                            {/* CTA — plain CSS hover, no whileHover/whileTap */}
                            <button
                              onClick={() => handleRequestService(service.id)}
                              disabled={isRequesting}
                              className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 active:scale-[0.97] ${
                                isRequesting
                                  ? "bg-secondary text-muted-foreground cursor-not-allowed"
                                  : "bg-foreground text-background hover:bg-foreground/90 hover:shadow-md"
                              }`}
                            >
                              {isRequesting ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Requesting…
                                </>
                              ) : (
                                <>
                                  Request Service
                                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA Section ────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-foreground text-background relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 70% 30%, hsl(var(--accent) / 0.08) 0%, transparent 60%)" }}
          />

          <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center relative">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-6 leading-tight tracking-tight text-background">
              Don't see what you need?
            </h2>
            <p className="text-background/60 mb-10 max-w-xl mx-auto text-base leading-relaxed">
              Every business is unique. Let's discuss how we can tailor our services to your exact requirements.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="h-12 px-8 rounded-xl text-sm font-medium gap-2 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:shadow-xl"
            >
              <Link to="/contact">
                Get in Touch
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>

      </div>
    </PageTransition>
  );
}