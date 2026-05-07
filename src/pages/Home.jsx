import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, BarChart3, FileCheck, Users, CalendarDays } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import { Testimonials } from "@/components/Testimonials";
import {
  TextReveal,
  BlurFadeIn,
  GlowCounter,
  SmoothCounter,
  MagneticWrap,
  SpotlightCard,
  AnimatedDivider,
  StaggerGrid,
  StaggerGridItem,
  RotatingText,
  ScaleOnScroll,
  RevealOnScroll,
} from "@/components/PremiumAnimations";
import {
  FloatingCube,
  FloatingRing,
  FloatingSphere,
  Tilt3DCard,
  IsometricGrid,
  RotatingEmblem,
} from "@/components/ThreeDElements";
import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookConsultationDialog } from "@/components/BookConsultationDialog";

const easing = [0.22, 1, 0.36, 1];

export default function Home() {
  const { t } = useLanguage();
  const [bookingOpen, setBookingOpen] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Only transform + opacity — no filter:blur (very expensive on scroll)
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.95]);

  const services = [
    {
      icon: BarChart3,
      title: t("home.services.accounting.title"),
      desc: t("home.services.accounting.desc"),
      link: "/services/income-tax-filing",
      color: "from-blue-500/10 to-cyan-500/5",
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      icon: Shield,
      title: t("home.services.audit.title"),
      desc: t("home.services.audit.desc"),
      link: "/services/audit-assurance",
      color: "from-purple-500/10 to-indigo-500/5",
      gradient: "from-purple-500 to-indigo-400",
    },
    {
      icon: FileCheck,
      title: t("home.services.tax.title"),
      desc: t("home.services.tax.desc"),
      link: "/services/tds-compliance",
      color: "from-emerald-500/10 to-teal-500/5",
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      icon: Users,
      title: t("home.services.consulting.title"),
      desc: t("home.services.consulting.desc"),
      link: "/services",
      color: "from-orange-500/10 to-amber-500/5",
      gradient: "from-orange-500 to-amber-400",
    },
  ];

  const stats = [
    { value: 500, suffix: "+", label: t("home.stats.clients") },
    { value: 13, suffix: "+", label: t("home.stats.experience") },
    { value: 99, suffix: "%", label: t("home.stats.retention") },
  ];

  const ticker = [
    t("home.ticker.accounting"),
    t("home.ticker.tax"),
    t("home.ticker.audit"),
    t("home.ticker.consulting"),
    t("home.ticker.gst"),
    t("home.ticker.company"),
    t("home.ticker.planning"),
    t("home.ticker.payroll"),
  ];

  return (
    <PageTransition>
      <div className="min-h-screen overflow-x-hidden">

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative min-h-[100svh] flex items-center justify-center overflow-hidden"
          aria-label="Hero section"
        >
          {/* Ambient background — CSS-only, no JS animation for scroll perf */}
          <motion.div
            style={{ y: heroY, willChange: "transform" }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Primary ambient glow — pre-blurred via radial-gradient (no filter:blur for scroll perf) */}
            <div
              className="absolute top-[-20%] left-1/2 w-[800px] h-[800px] rounded-full"
              style={{
                transform: "translateX(-50%) translateZ(0)",
                background: "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 60%)",
              }}
            />
            {/* Purple accent glow */}
            <div
              className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full animate-breathe"
              style={{
                background: "radial-gradient(circle, hsl(280 80% 60% / 0.04) 0%, transparent 55%)",
                willChange: "transform",
                transform: "translateZ(0)",
              }}
            />
            {/* Cyan glow */}
            <div
              className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full animate-breathe"
              style={{
                background: "radial-gradient(circle, hsl(190 80% 50% / 0.03) 0%, transparent 55%)",
                willChange: "transform",
                transform: "translateZ(0)",
                animationDelay: "-3s",
              }}
            />
          </motion.div>

          {/* ── 3D Floating Elements in Hero ──────────────────────────────── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Large rotating cube — top right */}
            <FloatingCube
              size={70}
              className="top-[15%] right-[12%] hidden md:block"
              delay={0.5}
              duration={25}
              opacity={0.08}
            />

            {/* Small cube — bottom left */}
            <FloatingCube
              size={35}
              className="bottom-[20%] left-[8%] hidden md:block"
              color="hsl(280 80% 60%)"
              delay={1.2}
              duration={30}
              opacity={0.06}
            />

            {/* 3D Ring — left side */}
            <FloatingRing
              size={140}
              className="top-[30%] left-[5%] hidden lg:block"
              delay={0.8}
              duration={18}
              opacity={0.1}
            />

            {/* Glowing sphere */}
            <FloatingSphere
              size={50}
              className="top-[20%] left-[20%] hidden md:block"
              delay={0.3}
              glowIntensity={0.08}
            />
          </div>

          {/* Noise texture overlay */}
          <div className="absolute inset-0 bg-noise pointer-events-none opacity-40" aria-hidden="true" />

          {/* Hero content — fades + scales on scroll (no blur filter) */}
          <motion.div
            style={{
              opacity: heroOpacity,
              scale: heroScale,
              willChange: "opacity, transform",
            }}
            className="relative max-w-5xl mx-auto px-6 lg:px-12 text-center"
          >
            {/* Floating badge with pulse */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("home.badge")}
            </motion.div>

            {/* Headline — Split text reveal */}
            <div className="mb-6 overflow-hidden" style={{ perspective: "1000px" }}>
              <TextReveal delay={0.15}>
                <h1 className="text-5xl md:text-7xl lg:text-8xl leading-[1.02] text-balance">
                  {t("home.hero.line1")}{" "}
                  <br className="hidden md:block" />
                  <span className="gradient-text-premium italic">{t("home.hero.line2")}</span>
                </h1>
              </TextReveal>
            </div>

            {/* Subtitle with blur fade */}
            <BlurFadeIn delay={0.4}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                {t("home.hero.subtitle_pre")}{" "}
                <RotatingText
                  words={[t("home.rotating.accounting"), t("home.rotating.tax"), t("home.rotating.audit"), t("home.rotating.consulting")]}
                  className="font-medium text-foreground"
                  interval={2500}
                />{" "}
                {t("home.hero.subtitle_post")}
              </p>
            </BlurFadeIn>

            {/* CTAs — Magnetic hover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55, ease: easing, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <MagneticWrap strength={0.15}>
                <Link to="/services">
                  <span className="btn-shine flex items-center gap-2 px-8 py-3.5 bg-foreground text-background font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] group">
                    {t("home.cta.explore")}
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </MagneticWrap>
              <MagneticWrap strength={0.15}>
                <Link to="/contact">
                  <span className="flex items-center gap-2 px-8 py-3.5 bg-secondary/80 backdrop-blur-md text-foreground font-medium rounded-full border border-border/50 hover:bg-secondary transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] shimmer-sweep">
                    {t("home.cta.expert")}
                  </span>
                </Link>
              </MagneticWrap>
            </motion.div>
          </motion.div>

          {/* Scroll indicator — CSS animation only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-[11px] text-muted-foreground tracking-widest uppercase">
              {t("home.scroll")}
            </span>
            <div
              className="w-[1px] h-8 bg-gradient-to-b from-muted-foreground/60 to-transparent animate-float"
            />
          </motion.div>
        </section>

        {/* ── Ticker ──────────────────────────────────────────────────────── */}
        <div className="py-5 border-y border-border/40 overflow-hidden bg-secondary/30">
          <div className="ticker-wrap">
            <div className="ticker-track animate-ticker">
              {[...ticker, ...ticker].map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-3 px-6 text-sm text-muted-foreground whitespace-nowrap"
                >
                  <span className="w-1 h-1 rounded-full bg-accent/60" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats — Premium counter reveal ──────────────────────────────── */}
        <section className="section-padding-sm content-defer">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <AnimatedDivider className="mb-16" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x divide-border/40">
              {stats.map((stat, i) => (
                <div key={i} className="text-center py-8 px-8">
                  <SmoothCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    className="text-6xl md:text-7xl font-light tracking-tight mb-3 block"
                    duration={2}
                  />
                  <BlurFadeIn delay={0.2 + i * 0.1}>
                    <p className="text-sm text-muted-foreground tracking-wide">
                      {stat.label}
                    </p>
                  </BlurFadeIn>
                </div>
              ))}
            </div>
            <AnimatedDivider className="mt-16" />
          </div>
        </section>

        {/* ── Services — 3D Tilt cards with spotlight glow ──────────────────── */}
        <section className="section-padding bg-aurora content-defer relative">
          {/* 3D decorative elements behind the service cards */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <RotatingEmblem
              size={250}
              className="top-[5%] right-[-2%] hidden xl:block"
            />
            <FloatingCube
              size={40}
              className="bottom-[10%] left-[5%] hidden lg:block"
              color="hsl(280 80% 60%)"
              delay={0.5}
              duration={28}
              opacity={0.05}
            />
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="text-center mb-20">
              <BlurFadeIn>
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">
                  {t("home.services.label")}
                </p>
              </BlurFadeIn>
              <TextReveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl lg:text-6xl max-w-3xl mx-auto">
                  {t("home.services.heading")}
                </h2>
              </TextReveal>
            </div>

            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-4" staggerDelay={0.1}>
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <StaggerGridItem key={index}>
                    <Link to={service.link} className="group block">
                      <Tilt3DCard tiltStrength={6} glareEnabled={true}>
                        <SpotlightCard className="p-8 md:p-12 h-full shimmer-sweep">
                          {/* Background gradient on hover */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
                          />

                          <div className="relative">
                            {/* Icon with gradient ring on hover */}
                            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-accent/10 transition-all duration-500 group-hover:shadow-glow">
                              <Icon className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors duration-500" />
                            </div>

                            <span className="text-xs text-muted-foreground tracking-widest tabular-nums">
                              0{index + 1}
                            </span>
                            <h3 className="text-xl md:text-2xl mt-3 mb-3 group-hover:text-accent transition-colors duration-500">
                              {service.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed mb-6">
                              {service.desc}
                            </p>

                            {/* Arrow with trail effect */}
                            <span className="text-sm flex items-center gap-1.5 font-medium group-hover:gap-3 transition-all duration-500">
                              {t("common.learnMore")}
                              <ArrowRight className="h-3.5 w-3.5 transition-all duration-500 group-hover:translate-x-1" />
                            </span>
                          </div>
                        </SpotlightCard>
                      </Tilt3DCard>
                    </Link>
                  </StaggerGridItem>
                );
              })}
            </StaggerGrid>
          </div>
        </section>

        {/* ── Philosophy / Quote — Scale on scroll ─────────────────────────── */}
        <section className="section-padding relative overflow-hidden content-defer">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />

          {/* Subtle 3D decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <FloatingRing
              size={100}
              className="top-[10%] right-[15%] hidden lg:block"
              delay={0.3}
              duration={20}
              opacity={0.06}
            />
            <FloatingSphere
              size={40}
              className="bottom-[15%] left-[10%] hidden md:block"
              delay={0.6}
              glowIntensity={0.05}
              color="hsl(280 80% 60%)"
            />
          </div>

          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <BlurFadeIn>
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-8">
                {t("home.philosophy.label")}
              </p>
            </BlurFadeIn>
            <ScaleOnScroll>
              <blockquote className="text-3xl md:text-4xl lg:text-5xl italic leading-tight text-balance mb-8 font-light">
                {t("home.philosophy.quote1")}
                <br />
                {t("home.philosophy.quote2")}{" "}
                <span className="gradient-text-blue not-italic font-medium">
                  {t("home.philosophy.quote3")}
                </span>
                {t("home.philosophy.quote4")}
              </blockquote>
            </ScaleOnScroll>
            <BlurFadeIn delay={0.3}>
              <p className="text-muted-foreground text-sm tracking-wide">
                {t("home.philosophy.author")}
              </p>
            </BlurFadeIn>
          </div>
        </section>

        {/* ── Process — 3D Bento-style cards ──────────────────────────────────── */}
        <section className="section-padding bg-secondary/20 content-defer relative">
          {/* Isometric grid decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-end">
            <IsometricGrid
              className="right-[-5%] top-[10%] hidden xl:block"
              rows={5}
              cols={6}
              cellSize={35}
              opacity={0.04}
            />
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="text-center mb-20">
              <BlurFadeIn>
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">
                  {t("home.process.label")}
                </p>
              </BlurFadeIn>
              <TextReveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl">
                  {t("home.process.heading")}
                </h2>
              </TextReveal>
            </div>

            <StaggerGrid
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              staggerDelay={0.12}
            >
              {[
                {
                  step: "01",
                  title: t("home.process.step1.title"),
                  desc: t("home.process.step1.desc"),
                  icon: "💬",
                },
                {
                  step: "02",
                  title: t("home.process.step2.title"),
                  desc: t("home.process.step2.desc"),
                  icon: "📊",
                },
                {
                  step: "03",
                  title: t("home.process.step3.title"),
                  desc: t("home.process.step3.desc"),
                  icon: "🚀",
                },
              ].map((item, i) => (
                <StaggerGridItem key={i}>
                  <Tilt3DCard tiltStrength={5} glareEnabled={false}>
                    <div className="bento-card p-8 md:p-10 h-full group three-d-card-lift">
                      {/* Decorative top accent */}
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                      <div className="text-3xl mb-4">{item.icon}</div>
                      <span className="text-5xl font-light text-muted-foreground/20 tabular-nums block mb-4">
                        {item.step}
                      </span>
                      <h3 className="text-xl mb-3 group-hover:text-accent transition-colors duration-500">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </Tilt3DCard>
                </StaggerGridItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── Testimonials ────────────────────────────────────────────────── */}
        <Testimonials />

        {/* ── Book Free Consultation CTA ───────────────────────────────────── */}
        <section className="section-padding-sm content-defer">
          <ScrollReveal>
            <div className="max-w-4xl mx-auto px-6 lg:px-12">
              <motion.div
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 24 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: easing }}
                className="relative rounded-3xl overflow-hidden border border-border/40 bg-card/80 backdrop-blur-xl shadow-lg"
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

                <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                      <CalendarDays className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-semibold mb-2">Book Free Consultation</h3>
                    <p className="text-muted-foreground leading-relaxed max-w-lg">
                      Schedule a one-on-one session with our expert Chartered Accountants. Get personalized advice on tax planning, GST, audits, and more.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <MagneticWrap strength={0.12}>
                      <button onClick={() => setBookingOpen(true)}>
                        <span className="btn-shine flex items-center gap-2 px-8 py-3.5 bg-foreground text-background font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] group whitespace-nowrap">
                          Book Now
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </button>
                    </MagneticWrap>
                  </div>
                </div>
              </motion.div>
            </div>
          </ScrollReveal>
        </section>

        {/* ── CTA Banner — Magnetic, glowing ──────────────────────────────── */}
        <section className="section-padding content-defer">
          <ScrollReveal>
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <motion.div
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: easing }}
                className="relative rounded-3xl overflow-hidden p-12 md:p-20 text-center bg-foreground text-background"
              >
                {/* Static ambient glow — no JS animation */}
                <div
                  className="absolute top-0 left-1/2 w-[600px] h-[300px] rounded-full bg-accent/20 pointer-events-none"
                  style={{
                    transform: "translateX(-50%) translateZ(0)",
                    filter: "blur(80px)",
                  }}
                />

                {/* 3D floating elements inside CTA */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <FloatingCube
                    size={30}
                    className="top-[15%] left-[10%] hidden md:block"
                    color="hsl(0 0% 100%)"
                    delay={0.2}
                    duration={20}
                    opacity={0.06}
                  />
                  <FloatingRing
                    size={70}
                    className="bottom-[10%] right-[8%] hidden md:block"
                    color="hsl(0 0% 100%)"
                    delay={0.5}
                    duration={16}
                    opacity={0.05}
                    strokeWidth={1}
                  />
                </div>

                <div className="relative">
                  <BlurFadeIn>
                    <p className="text-xs tracking-widest uppercase mb-4 text-background/50">
                      {t("home.cta.label")}
                    </p>
                  </BlurFadeIn>
                  <TextReveal delay={0.1}>
                    <h2 className="text-3xl md:text-5xl mb-6 text-balance text-background">
                      {t("home.cta.heading1")}
                      <br />
                      {t("home.cta.heading2")}
                    </h2>
                  </TextReveal>
                  <BlurFadeIn delay={0.3}>
                    <p className="text-background/60 mb-10 max-w-lg mx-auto leading-relaxed">
                      {t("home.cta.desc")}
                    </p>
                  </BlurFadeIn>
                  <BlurFadeIn delay={0.4}>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <MagneticWrap strength={0.12}>
                        <Button
                          asChild
                          size="lg"
                          className="h-12 px-8 rounded-full bg-background text-foreground hover:bg-background/90 font-medium transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] hover:shadow-xl"
                        >
                          <Link to="/contact">{t("home.cta.schedule")}</Link>
                        </Button>
                      </MagneticWrap>
                      <MagneticWrap strength={0.12}>
                        <Button
                          asChild
                          variant="outline"
                          size="lg"
                          className="h-12 px-8 rounded-full border-background/30 text-background hover:bg-background/10 transition-all duration-500 hover:scale-[1.03] active:scale-[0.98]"
                        >
                          <Link to="/auth?signup=true">{t("home.cta.create")}</Link>
                        </Button>
                      </MagneticWrap>
                    </div>
                  </BlurFadeIn>
                </div>
              </motion.div>
            </div>
          </ScrollReveal>
        </section>

      </div>

      {/* Book Consultation Dialog */}
      <BookConsultationDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </PageTransition>
  );
}