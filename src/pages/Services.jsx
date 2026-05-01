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
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-black font-sans">

        {/* ── Apple-style Clean Hero ──────────────────────────────── */}
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-white dark:from-[#111] to-transparent pointer-events-none" />
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            {/* Pill */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-sm mb-6"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[11px] font-medium tracking-wide text-gray-600 dark:text-gray-300 uppercase">
                {servicesData.length} Professional Services
              </span>
            </motion.div>

            {/* Headline */}
            <style>
              {`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap');
                .aesthetic-cursive {
                  font-family: 'Dancing Script', cursive;
                  line-height: 1.2;
                  padding-bottom: 0.2em;
                }
              `}
            </style>
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl sm:text-7xl md:text-[6rem] text-balance mb-6 text-gray-900 dark:text-white aesthetic-cursive"
            >
              Expert financial solutions.
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 text-7xl sm:text-8xl md:text-[7.5rem] drop-shadow-sm">
                Tailored for you.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10 tracking-tight"
            >
              Request a service and pay only after our CA team completes the work. Zero risk. Full transparency.
            </motion.p>
          </div>
        </section>

        {/* ── Sticky filter bar (Apple/Google style) ──────────────────────────────────────── */}
        <div className="sticky top-16 z-40 pb-6 pt-2 bg-[#F5F5F7]/80 dark:bg-black/80 backdrop-blur-2xl border-b border-gray-200/50 dark:border-white/10" style={{ transform: "translateZ(0)" }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Category pills */}
              <div className="flex-1 w-full overflow-x-auto scrollbar-none pb-2 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0">
                <div className="flex items-center gap-2 min-w-max p-1 bg-gray-200/50 dark:bg-white/5 rounded-full w-fit">
                  {CATEGORIES.map((cat) => {
                    const active = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-300 ${
                          active
                            ? "bg-white dark:bg-white text-black shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-64 group flex-shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search services…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-10 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* ── Services Grid ──────────────────────────────────────────── */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-white/5 mx-auto mb-6 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white tracking-tight">No services found</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Try a different search term or category.</p>
                <Button
                  onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                  className="rounded-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  Clear search
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
                      <div className="flex flex-col h-full rounded-[24px] bg-white dark:bg-[#1C1C1E] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-400 hover:-translate-y-1 relative overflow-hidden">
                        
                        {/* Apple-style top reflection */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/5 dark:via-white/10 to-transparent" />

                        {service.popular && (
                          <div className="absolute top-6 right-6">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold tracking-wide uppercase">
                              Popular
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col flex-grow">
                          {/* Icon */}
                          <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-900 dark:text-white mb-6 group-hover:scale-105 transition-transform duration-300">
                            {IconComp && <IconComp className="h-5 w-5" />}
                          </div>

                          {/* Category Tag */}
                          <p className="text-[11px] font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase mb-2">
                            {service.category}
                          </p>

                          {/* Title & description */}
                          <Link
                            to={`/services/${service.id}`}
                            className="text-2xl font-semibold tracking-tight leading-tight mb-3 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {service.title}
                          </Link>
                          <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed mb-6 line-clamp-2">
                            {service.shortDesc}
                          </p>

                          {/* Features */}
                          <ul className="space-y-2.5 mb-8 flex-grow">
                            {service.features.slice(0, 3).map((f, i) => (
                              <li key={i} className="flex items-start gap-3 text-[13px] text-gray-600 dark:text-gray-300">
                                <CheckCircle className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                <span className="leading-snug">{f}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Bottom Area */}
                          <div className="mt-auto">
                            <div className="flex items-end justify-between mb-6">
                              <div>
                                <p className="text-[11px] text-gray-400 font-medium mb-0.5">Starting from</p>
                                <div className="flex items-start gap-0.5">
                                  <IndianRupee className="w-4 h-4 mt-1.5 text-gray-900 dark:text-white" />
                                  <span className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                    {service.price.toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 text-[11px] font-medium text-gray-500">
                                <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md">
                                  <Clock className="w-3.5 h-3.5" />
                                  {service.duration}
                                </span>
                              </div>
                            </div>

                            {/* CTA Button */}
                            <button
                              onClick={() => handleRequestService(service.id)}
                              disabled={isRequesting}
                              className={`w-full h-11 rounded-full flex items-center justify-center gap-2 text-[14px] font-medium transition-all duration-300 ${
                                isRequesting
                                  ? "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
                                  : "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 active:scale-[0.98]"
                              }`}
                            >
                              {isRequesting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Request Service"
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
        <section className="py-24 md:py-32 bg-white dark:bg-[#111] text-center border-t border-gray-100 dark:border-white/5">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-[-0.04em] mb-5 text-gray-900 dark:text-white">
              Need something custom?
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 tracking-tight max-w-xl mx-auto">
              Our experts can build a tailored solution for your exact requirements.
            </p>
            <Button
              asChild
              className="h-12 px-8 rounded-full text-[15px] font-medium bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-none hover:scale-105 transition-transform"
            >
              <Link to="/contact">
                Talk to an Expert
              </Link>
            </Button>
          </div>
        </section>

      </div>
    </PageTransition>
  );
}