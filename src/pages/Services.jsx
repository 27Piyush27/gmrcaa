import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
  LayoutGroup } from
"framer-motion";
import { servicesData } from "@/lib/servicesData";
import { resolveServiceIdForDb } from "@/lib/serviceIdResolver";
import { getErrorMessage } from "@/lib/errorMessage";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useRef, useMemo } from "react";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  TextReveal,
  BlurFadeIn,
  MagneticWrap,
  AnimatedDivider,
} from "@/components/PremiumAnimations";
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
  Lightbulb } from
"lucide-react";

// ── Icon map ──────────────────────────────────────────────────────────────────
const iconMap = {
  Calculator: <Calculator className="h-5 w-5" />,
  FileCheck: <FileCheck className="h-5 w-5" />,
  Percent: <Percent className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  Building: <Building className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  ClipboardCheck: <ClipboardCheck className="h-5 w-5" />
};

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORIES = [
{ id: "All", label: "All Services", icon: <Sparkles className="w-3.5 h-3.5" /> },
{ id: "Tax Services", label: "Tax", icon: <Calculator className="w-3.5 h-3.5" /> },
{ id: "GST Services", label: "GST", icon: <Percent className="w-3.5 h-3.5" /> },
{ id: "Company Law", label: "Company Law", icon: <Building2 className="w-3.5 h-3.5" /> },
{ id: "Audit Services", label: "Audit", icon: <FileStack className="w-3.5 h-3.5" /> },
{ id: "Compliance", label: "Compliance", icon: <Shield className="w-3.5 h-3.5" /> },
{ id: "HR & Payroll", label: "HR & Payroll", icon: <UserCheck className="w-3.5 h-3.5" /> },
{ id: "Advisory", label: "Advisory", icon: <Lightbulb className="w-3.5 h-3.5" /> }];


const easing = [0.22, 1, 0.36, 1];

// ── 3D Magnetic Tilt Card ─────────────────────────────────────────────────────
function TiltCard({ children, className = "" }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 400, damping: 35 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 400, damping: 35 });

  const handleMouseMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {x.set(0);y.set(0);};

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
      className={className}>
      
      {children}
    </motion.div>);

}

// ─────────────────────────────────────────────────────────────────────────────

export default function Services() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requestingId, setRequestingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered services
  const filtered = useMemo(() => {
    return servicesData.filter((s) => {
      const matchesCat = activeCategory === "All" || s.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
      !q || s.title.toLowerCase().includes(q) || s.shortDesc?.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleRequestService = async (serviceId) => {
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
      const { data: existing, error: checkError } = await supabase.
      from("service_requests").
      select("id, status").
      eq("user_id", user.id).
      eq("service_id", serviceIdForDb).
      in("status", ["pending", "in_progress", "completed"]);
      if (checkError) throw checkError;
      if (existing && existing.length > 0) {
        toast.info("You already have an active request for this service.");
        navigate("/dashboard");
        return;
      }
      const { error: insertError } = await supabase.
      from("service_requests").
      insert({ user_id: user.id, service_id: serviceIdForDb, status: "pending", progress: 0 });
      if (insertError) throw insertError;
      toast.success("Service requested! Track progress on your dashboard.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error requesting service:", error);
      toast.error(getErrorMessage(error, "Failed to request service. Please try again."));
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen">

        {/* ── Clean Hero ─────────────────────────────────────────────── */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <motion.div
            className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-violet-400/[0.06] blur-3xl pointer-events-none"
            animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-1/2 right-[20%] w-96 h-96 rounded-full bg-blue-400/[0.05] blur-3xl pointer-events-none"
            animate={{ x: [0, -25, 15, 0], y: [0, 15, -25, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />

          <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative">
            {/* Pill badge */}
            <BlurFadeIn>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {servicesData.length} Professional Services
              </div>
            </BlurFadeIn>

            {/* Headline */}
            <TextReveal delay={0.1}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-balance mb-6">
                Expert Financial
                <br />
                <span className="italic gradient-text-premium">Solutions.</span>
              </h1>
            </TextReveal>

            <BlurFadeIn delay={0.3}>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
                Request a service and pay only after our CA team completes the work.{" "}
                <span className="text-foreground font-medium">Zero risk. Full transparency.</span>
              </p>
            </BlurFadeIn>

            {/* Compact process steps */}
            <BlurFadeIn delay={0.45}>
              <div className="flex flex-wrap justify-center items-center gap-3">
                {["Request", "We Work", "You Pay"].map((step, i) =>
                <div key={step} className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border/50 bg-background/50 backdrop-blur-sm text-xs text-muted-foreground font-medium">
                      <span className="w-5 h-5 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      {step}
                    </span>
                    {i < 2 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 hidden sm:block" />}
                  </div>
                )}
              </div>
            </BlurFadeIn>
          </div>
        </section>

        {/* ── Sticky filter bar ────────────────────────────────────── */}
        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

              {/* Search input */}
              <div className="relative flex-shrink-0 sm:w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search services…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-8 rounded-xl border border-border/50 bg-secondary/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition-all" />
                
                <AnimatePresence>
                  {searchQuery &&
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  }
                </AnimatePresence>
              </div>

              {/* Category pills */}
              <div className="flex-1 overflow-x-auto scrollbar-none">
                <LayoutGroup id="category-filter">
                  <div className="flex items-center gap-1.5 min-w-max">
                    {CATEGORIES.map((cat) =>
                    <motion.button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === cat.id ?
                      "text-background" :
                      "text-muted-foreground hover:text-foreground hover:bg-secondary"}`
                      }
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}>
                      
                        {activeCategory === cat.id &&
                      <motion.div
                        layoutId="category-pill"
                        className="absolute inset-0 rounded-xl bg-foreground"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }} />

                      }
                        <span className="relative z-10 flex items-center gap-1.5">
                          {cat.icon}
                          {cat.label}
                        </span>
                      </motion.button>
                    )}
                  </div>
                </LayoutGroup>
              </div>

              {/* Result count */}
              <motion.span
                key={filtered.length}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 hidden sm:block">
                
                {filtered.length} {filtered.length === 1 ? "service" : "services"}
              </motion.span>
            </div>
          </div>
        </div>

        {/* ── Services Grid — 2 columns, spacious cards ─────────────── */}
        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <AnimatePresence mode="wait">
              {filtered.length === 0 ?
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="py-24 text-center">
                
                  <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-5 flex items-center justify-center">
                    <Search className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No services found</h3>
                  <p className="text-muted-foreground text-sm mb-6">Try a different search or category</p>
                  <Button variant="outline" size="sm" onClick={() => {setSearchQuery("");setActiveCategory("All");}} className="rounded-xl gap-2">
                    <X className="w-4 h-4" />
                    Clear filters
                  </Button>
                </motion.div> :

              <motion.div
                key={`${activeCategory}-${searchQuery}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                  {filtered.map((service, index) =>
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.45,
                    ease: easing,
                    delay: index * 0.06
                  }}
                  className="group relative">
                  
                      <TiltCard className="h-full relative">
                        <div className="premium-card h-full flex flex-col relative z-10">

                          {/* Top accent bar */}
                          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                          {/* Popular ribbon */}
                          {service.popular &&
                      <div className="absolute top-5 right-5 z-20">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-foreground text-background text-[10px] font-semibold shadow-lg">
                                <Star className="w-3 h-3 fill-current" />
                                Popular
                              </span>
                            </div>
                      }

                          <div className="p-7 md:p-8 flex flex-col flex-1">
                            {/* Icon + Category */}
                            <div className="flex items-start justify-between mb-6">
                              <motion.div
                            whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                            transition={{ duration: 0.4 }}
                            className="w-12 h-12 rounded-2xl bg-secondary border border-border/40 flex items-center justify-center text-foreground">
                            
                                {iconMap[service.icon]}
                              </motion.div>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-border/40 bg-secondary/40 text-[11px] text-muted-foreground font-medium">
                                {service.category}
                              </span>
                            </div>

                            {/* Title & description */}
                            <Link to={`/services/${service.id}`} className="text-xl font-semibold leading-snug mb-2 hover:text-accent transition-colors block">
                              {service.title}
                            </Link>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-2">{service.shortDesc}</p>

                            {/* Key features — 3 max, clean */}
                            <ul className="space-y-2.5 mb-6 flex-grow">
                              {service.features.slice(0, 3).map((f, i) =>
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-muted-foreground leading-snug">{f}</span>
                                </li>
                          )}
                            </ul>

                            {/* Bottom row: Pricing + Duration + CTA */}
                            <div className="pt-6 border-t border-border/40">
                              <div className="flex items-center justify-between mb-5">
                                <div>
                                  <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest">From</p>
                                  <div className="flex items-baseline gap-0.5">
                                    <IndianRupee className="w-4 h-4 self-start mt-0.5 text-foreground" />
                                    <span className="text-2xl font-bold tracking-tight">
                                      {service.price.toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
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

                              {/* CTA */}
                              <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleRequestService(service.id)}
                            disabled={requestingId === service.id}
                            className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors
                                  ${requestingId !== service.id ?
                            "bg-foreground text-background hover:bg-foreground/90" :
                            "bg-secondary text-muted-foreground cursor-not-allowed"}`}>
                            
                                {requestingId === service.id ?
                            <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Requesting…
                                  </> :

                            <>
                                    Request Service
                                    <ArrowRight className="w-4 h-4" />
                                  </>
                            }
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </TiltCard>
                    </motion.div>
                )}
                </motion.div>
              }
            </AnimatePresence>
          </div>
        </section>

        {/* ── CTA Section ──────────────────────────────────────────── */}
        <section className="py-20 md:py-32 bg-foreground text-background relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-accent/15 to-transparent pointer-events-none"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/[0.04] blur-[100px] pointer-events-none"
            animate={{ scale: [1, 1.15, 1], x: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center relative">
            <TextReveal>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-6 leading-tight tracking-tight text-background">
                Don't see what you need?
              </h2>
            </TextReveal>

            <BlurFadeIn delay={0.2}>
              <p className="text-background/60 mb-10 max-w-xl mx-auto text-base leading-relaxed">
                Every business is unique. Let's discuss how we can tailor our services to your exact requirements.
              </p>
            </BlurFadeIn>

            <BlurFadeIn delay={0.35}>
              <div className="flex flex-wrap justify-center gap-4">
                <MagneticWrap strength={0.12}>
                  <Button asChild size="lg" variant="secondary" className="h-12 px-8 rounded-xl text-sm font-medium gap-2 transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] hover:shadow-xl">
                    <Link to="/contact">
                      Get in Touch
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </MagneticWrap>
              </div>
            </BlurFadeIn>
          </div>
        </section>

      </div>
    </PageTransition>);

}