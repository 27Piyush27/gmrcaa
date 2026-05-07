import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, useInView } from "framer-motion";
import { useRef, memo } from "react";

const ease = [0.22, 1, 0.36, 1];

export const Footer = memo(function Footer() {
  const year = new Date().getFullYear();
  const { t } = useLanguage();
  const footerRef = useRef(null);
  const isInView = useInView(footerRef, { once: true, margin: "-60px" });

  const links = {
    company: [
      { name: t("footer.about"), path: "/about" },
      { name: t("nav.services"), path: "/services" },
      { name: t("footer.contact"), path: "/contact" },
      { name: t("footer.clientPortal"), path: "/dashboard" },
      { name: t("footer.blog"), path: "/blog" },
      { name: t("footer.faq"), path: "/faq" },
      { name: t("footer.team"), path: "/team" },
      { name: t("footer.testimonials"), path: "/testimonials" },
      { name: t("footer.careers"), path: "/careers" },
      { name: t("footer.feedback"), path: "/feedback" },
    ],
    services: [
      { name: t("footer.taxCalc"), path: "/tax-calculator" },
      { name: t("footer.financialCalc"), path: "/calculators" },
      { name: t("footer.gstTracker"), path: "/gst-tracker" },
      { name: t("footer.resources"), path: "/resources" },
      { name: t("footer.bookConsultation"), path: "/appointments" },
      { name: t("footer.viewAllServices"), path: "/services" },
    ],
    legal: [
      { name: t("footer.terms"), path: "/terms" },
      { name: t("footer.privacy"), path: "/privacy" },
    ],
  };

  // Stagger variants for link columns
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.35, ease },
    },
  };

  return (
    <footer ref={footerRef} className="relative border-t border-border/40 mt-0" aria-label="Site footer">
      {/* Animated gradient top accent — draws from center on scroll reveal */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2, ease }}
        style={{
          transformOrigin: "center",
          background:
            "linear-gradient(90deg, transparent 0%, hsl(var(--accent) / 0.3) 30%, hsl(var(--accent) / 0.5) 50%, hsl(var(--accent) / 0.3) 70%, transparent 100%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand — fade up */}
          <motion.div
            className="md:col-span-5"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease, delay: 0.05 }}
          >
            <p className="text-lg font-semibold tracking-tight mb-4">
              GMR<span className="text-accent">&</span>Associates
            </p>
            <p className="text-muted-foreground text-[15px] leading-relaxed max-w-sm mb-8">
              {t("footer.brand_desc")}
            </p>

            <div className="space-y-3">
              <motion.a
                href="mailto:info@gmrindia.com"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 group"
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-accent/10 group-hover:scale-110 transition-all duration-300" aria-hidden="true">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                info@gmrindia.com
              </motion.a>
              <motion.a
                href="tel:+919871209393"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 group"
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-accent/10 group-hover:scale-110 transition-all duration-300" aria-hidden="true">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                +91 98712 09393
              </motion.a>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center" aria-hidden="true">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                Gurgaon & Delhi, India
              </div>
            </div>
          </motion.div>

          {/* Company Links — staggered reveal */}
          <div className="md:col-span-2 md:col-start-7">
            <motion.p
              className="text-xs tracking-widest text-muted-foreground uppercase mb-5"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {t("footer.company")}
            </motion.p>
            <motion.ul
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              {links.company.map((link) => (
                <motion.li key={link.path + link.name} variants={itemVariants}>
                  <Link
                    to={link.path}
                    className="text-[15px] text-foreground/70 hover:text-foreground hover:translate-x-0.5 transition-all duration-300 flex items-center gap-1.5 group"
                  >
                    {link.name}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300" aria-hidden="true" />
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Services Links — staggered reveal */}
          <div className="md:col-span-2">
            <motion.p
              className="text-xs tracking-widest text-muted-foreground uppercase mb-5"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {t("footer.services")}
            </motion.p>
            <motion.ul
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              {links.services.map((link) => (
                <motion.li key={link.path + link.name} variants={itemVariants}>
                  <Link
                    to={link.path}
                    className="text-[15px] text-foreground/70 hover:text-foreground hover:translate-x-0.5 transition-all duration-300 flex items-center gap-1.5 group"
                  >
                    {link.name}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300" aria-hidden="true" />
                  </Link>
                </motion.li>
              ))}
            </motion.ul>

            <motion.p
              className="text-xs tracking-widest text-muted-foreground uppercase mb-5 mt-8"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              {t("footer.legal")}
            </motion.p>
            <motion.ul
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              {links.legal.map((link) => (
                <motion.li key={link.path + link.name} variants={itemVariants}>
                  <Link
                    to={link.path}
                    className="text-[15px] text-foreground/70 hover:text-foreground hover:translate-x-0.5 transition-all duration-300 flex items-center gap-1.5 group"
                  >
                    {link.name}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300" aria-hidden="true" />
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>

        {/* Bottom bar — animated divider */}
        <div className="relative pt-8 border-t border-border/40 flex flex-col items-center gap-4">
          {/* Animated accent line — draws on scroll */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-px"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1, ease, delay: 0.3 }}
            style={{
              transformOrigin: "center",
              background: "linear-gradient(90deg, transparent, hsl(var(--accent) / 0.2), transparent)",
            }}
          />

          <motion.div
            className="w-full flex flex-col md:flex-row justify-between items-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease, delay: 0.35 }}
          >
            <p className="text-xs text-muted-foreground">
              © {year} GMR & Associates. {t("footer.rights")}.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-soft-pulse" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">
                {t("footer.available")}
              </p>
            </div>
          </motion.div>

          {/* University project credit */}
          <motion.div
            className="w-full pt-4 border-t border-border/20 flex flex-col items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-[11px] text-muted-foreground tracking-wide">
              A Major Project by students of{" "}
              <span className="font-medium text-muted-foreground">
                Jaypee University of Information Technology, Solan
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 flex-wrap justify-center">
              Built by{" "}
              <a
                href="https://www.linkedin.com/in/piyushthakur2727"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground/60 hover:text-accent transition-colors underline underline-offset-2 decoration-accent/30 hover:decoration-accent"
              >
                Piyush Thakur
              </a>
              <span className="text-border">•</span>
              <span className="font-medium text-foreground/60">
                Pranav Roy
              </span>
              <span className="text-border">•</span>
              <span className="font-medium text-foreground/60">
                Aakarsh Sharma
              </span>
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
});