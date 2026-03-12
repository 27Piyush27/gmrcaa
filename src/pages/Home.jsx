import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, BarChart3, FileCheck, Users } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Testimonials } from "@/components/Testimonials";
import { useRef } from "react";

const easing = [0.22, 1, 0.36, 1];

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const services = [
  {
    icon: BarChart3,
    title: "Accounting & Bookkeeping",
    desc: "Precision financial management with meticulous attention to every detail.",
    link: "/services/accounting",
    color: "from-blue-500/10 to-cyan-500/5"
  },
  {
    icon: Shield,
    title: "Auditing & Assurance",
    desc: "Comprehensive audits ensuring complete accuracy and regulatory compliance.",
    link: "/services/auditing",
    color: "from-purple-500/10 to-indigo-500/5"
  },
  {
    icon: FileCheck,
    title: "Tax Advisory",
    desc: "Strategic planning to optimize your tax position legally and responsibly.",
    link: "/services/tax",
    color: "from-emerald-500/10 to-teal-500/5"
  },
  {
    icon: Users,
    title: "Business Consulting",
    desc: "Expert guidance for growth, restructuring, and long-term financial health.",
    link: "/services",
    color: "from-orange-500/10 to-amber-500/5"
  }];


  const stats = [
  { value: 500, suffix: "+", label: "Clients Served" },
  { value: 13, suffix: "+", label: "Years of Excellence" },
  { value: 99, suffix: "%", label: "Client Retention" }];


  const ticker = [
  "Accounting & Bookkeeping",
  "Tax Advisory",
  "Auditing & Assurance",
  "Business Consulting",
  "GST Filing",
  "Company Registration",
  "Financial Planning",
  "Payroll Management"];


  return (
    <PageTransition>
      <div className="min-h-screen overflow-x-hidden">

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
          
          {/* Ambient gradient + parallax in a single layer to minimise per-frame transforms */}
          <motion.div
            style={{ y: heroY, willChange: "transform" }}
            className="absolute inset-0 pointer-events-none">
            
            {/* GPU-promoted blur blobs with reduced blur to save paint cost */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-accent/[0.07] blur-[70px]" style={{ transform: "translateX(-50%) translateZ(0)" }} />
            <div className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/[0.04] blur-[60px]" style={{ transform: "translateZ(0)" }} />
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-500/[0.04] blur-[50px]" style={{ transform: "translateZ(0)" }} />
          </motion.div>

          {/* Noise texture overlay */}
          <div className="absolute inset-0 bg-noise pointer-events-none opacity-40" />

          {/* Hero content fades out on scroll separately */}
          <motion.div
            style={{ opacity: heroOpacity, willChange: "opacity" }}
            className="relative max-w-5xl mx-auto px-6 lg:px-12 text-center">
            
            {/* Tag */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: easing, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Chartered Accountants · Since 2011
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: easing, delay: 0.2 }}
              className="text-5xl md:text-7xl lg:text-8xl mb-6 text-balance leading-[1.02]">
              
              Financial clarity.{" "}
              <br className="hidden md:block" />
              <span className="gradient-text-premium italic">Uncompromised.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: easing, delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              
              We partner with discerning businesses to deliver accounting,
              tax, and advisory services of the highest calibre — precisely
              when it matters most.
            </motion.p>

            {/* CTAs — CSS hover-lift replaces framer-motion whileHover scale wrappers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: easing, delay: 0.55 }}
              className="flex flex-col sm:flex-row gap-3 justify-center">
              
              <Link to="/services">
                <span className="flex items-center gap-2 hover-lift px-6 py-3 bg-foreground text-background font-medium rounded-full shadow-lg hover:shadow-xl transition-all">
                  Explore Services <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
              <Link to="/contact">
                <span className="flex items-center gap-2 hover-lift px-6 py-3 bg-secondary/80 backdrop-blur-md text-foreground font-medium rounded-full border border-border/50 hover:bg-secondary transition-all">
                  Talk to an Expert
                </span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll indicator — CSS animation, no framer-motion repeat: Infinity */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in delay-700">
            <span className="text-[11px] text-muted-foreground tracking-widest uppercase">Scroll</span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-muted-foreground/60 to-transparent animate-float" />
          </div>
        </section>

        {/* ── Ticker ──────────────────────────────────────────────────────── */}
        <div className="py-5 border-y border-border/40 overflow-hidden bg-secondary/30">
          <div className="ticker-wrap">
            <div className="ticker-track animate-ticker">
              {[...ticker, ...ticker].map((item, i) =>
              <span
                key={i}
                className="inline-flex items-center gap-3 px-6 text-sm text-muted-foreground whitespace-nowrap">
                
                  <span className="w-1 h-1 rounded-full bg-accent/60" />
                  {item}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <section className="section-padding-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <StaggerContainer
              className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/40"
              staggerDelay={0.15}>
              
              {stats.map((stat, i) =>
              <StaggerItem key={i} className="text-center py-12 px-8">
                  <AnimatedCounter
                  target={stat.value}
                  suffix={stat.suffix}
                  className="text-6xl md:text-7xl font-light tracking-tight mb-3 block" />
                
                  <p className="text-sm text-muted-foreground tracking-wide">{stat.label}</p>
                </StaggerItem>
              )}
            </StaggerContainer>
          </div>
        </section>

        {/* ── Services ────────────────────────────────────────────────────── */}
        <section className="section-padding bg-secondary/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <ScrollReveal className="text-center mb-20">
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">
                What We Do
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl max-w-3xl mx-auto">
                Comprehensive expertise across every financial discipline
              </h2>
            </ScrollReveal>

            <StaggerContainer
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              staggerDelay={0.1}>
              
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <StaggerItem key={index}>
                    <Link to={service.link} className="group block">
                      {/* CSS hover-lift instead of framer-motion whileHover */}
                      <div className="premium-card p-8 md:p-12">
                        {/* Background gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        <div className="relative">
                          {/* Icon */}
                          <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-accent/10 transition-colors duration-300">
                            <Icon className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
                          </div>

                          <span className="text-xs text-muted-foreground tracking-widest tabular-nums">
                            0{index + 1}
                          </span>
                          <h3 className="text-xl md:text-2xl mt-3 mb-3 group-hover:text-accent transition-colors duration-300">
                            {service.title}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed mb-6">
                            {service.desc}
                          </p>
                          <span className="text-sm flex items-center gap-1.5 font-medium group-hover:gap-3 transition-all duration-300">
                            Learn more
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </StaggerItem>);

              })}
            </StaggerContainer>
          </div>
        </section>

        {/* ── Philosophy / Quote ──────────────────────────────────────────── */}
        <section className="section-padding relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <ScrollReveal>
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-8">
                Our Philosophy
              </p>
              <motion.blockquote
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 1, ease: easing }}
                className="text-3xl md:text-4xl lg:text-5xl italic leading-tight text-balance mb-8 font-light">
                
                "Excellence is not a skill.
                <br />
                It's an attitude reflected in every{" "}
                <span className="gradient-text-blue not-italic font-medium">
                  balance sheet.
                </span>"
              </motion.blockquote>
              <p className="text-muted-foreground text-sm tracking-wide">— GMR & Associates</p>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Process ─────────────────────────────────────────────────────── */}
        <section className="section-padding bg-secondary/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <ScrollReveal className="text-center mb-20">
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">How It Works</p>
              <h2 className="text-4xl md:text-5xl">Simple. Transparent. Effective.</h2>
            </ScrollReveal>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8" staggerDelay={0.15}>
              {[
              { step: "01", title: "Consultation", desc: "We listen first. A dedicated CA understands your unique situation, goals, and challenges." },
              { step: "02", title: "Strategy", desc: "We craft a tailored plan optimised for compliance, efficiency, and your long-term growth." },
              { step: "03", title: "Execution", desc: "Transparent delivery with real-time updates through your personal client portal." }].
              map((item, i) =>
              <StaggerItem key={i}>
                  {/* CSS hover-lift: runs on compositor, no JS per frame */}
                  <div className="apple-card hover-lift p-8 h-full">
                    <span className="text-5xl font-light text-muted-foreground/30 tabular-nums block mb-4">
                      {item.step}
                    </span>
                    <h3 className="text-xl mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </StaggerItem>
              )}
            </StaggerContainer>
          </div>
        </section>

        {/* ── Testimonials ────────────────────────────────────────────────── */}
        <Testimonials />

        {/* ── CTA Banner ──────────────────────────────────────────────────── */}
        <section className="section-padding">
          <ScrollReveal>
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <motion.div
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: easing }}
                className="relative rounded-3xl overflow-hidden p-12 md:p-20 text-center bg-foreground text-background">
                
                {/* Ambient inside the CTA */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-accent/20 blur-[80px] pointer-events-none" />
                <div className="relative">
                  <p className="text-xs tracking-widest uppercase mb-4 text-background/50">
                    Ready to Begin?
                  </p>
                  <h2 className="text-3xl md:text-5xl mb-6 text-balance">
                    Let's elevate your
                    <br />
                    financial strategy today.
                  </h2>
                  <p className="text-background/60 mb-10 max-w-lg mx-auto leading-relaxed">
                    Join 500+ businesses who trust GMR & Associates for their most important financial decisions.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      asChild
                      size="lg"
                      className="h-12 px-8 rounded-full bg-background text-foreground hover:bg-background/90 font-medium hover-lift">
                      
                      <Link to="/contact">Schedule Consultation</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="h-12 px-8 rounded-full border-background/30 text-background hover:bg-background/10 hover-lift">
                      
                      <Link to="/auth?signup=true">Create Account</Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </ScrollReveal>
        </section>

      </div>
    </PageTransition>);

}