import { motion, useScroll, useTransform } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import {
  TextReveal,
  BlurFadeIn,
  GlowCounter,
  AnimatedDivider,
  SpotlightCard,
  StaggerGrid,
  StaggerGridItem,
  MagneticWrap,
  ScaleOnScroll,
} from "@/components/PremiumAnimations";

const easing = [0.22, 1, 0.36, 1];

export default function About() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const values = [
    { title: "Precision", desc: "Every figure verified. Every detail considered. No exceptions.", num: "01", icon: "🎯" },
    { title: "Integrity", desc: "Transparent practices and honest counsel, even when it's difficult.", num: "02", icon: "🛡️" },
    { title: "Partnership", desc: "Your success is our measure. We invest in understanding your goals.", num: "03", icon: "🤝" },
    { title: "Excellence", desc: "Standards that exceed expectations, consistently delivered.", num: "04", icon: "⭐" },
  ];

  const partners = [
    {
      name: "Gaurav Makkar",
      title: "FCA",
      initials: "GM",
      gradient: "from-blue-500 to-cyan-400",
      desc: "Expert in capital markets and statutory audits with a strong financial background, assisting numerous SMEs with project financing from nationalised banks.",
    },
    {
      name: "Saurabh Madan",
      title: "FCA",
      initials: "SM",
      gradient: "from-emerald-500 to-teal-400",
      desc: "Corporate finance and advisory specialist, helping businesses navigate complex financial landscapes and achieve sustainable growth.",
    },
  ];

  const timeline = [
    { year: "2011", event: "Founded in Delhi with a vision for precision-driven accounting" },
    { year: "2014", event: "Expanded to Gurgaon, serving 100+ active clients" },
    { year: "2018", event: "Launched comprehensive GST advisory practice" },
    { year: "2021", event: "Celebrated 10 years with 99% client retention rate" },
    { year: "2024", event: "Digital-first client portal launch with 500+ clients served" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section ref={heroRef} className="relative py-28 md:py-40 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          {/* Animated gradient orbs */}
          <motion.div
            className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-[80px]"
            animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          <motion.div
            className="max-w-7xl mx-auto px-6 lg:px-12 relative"
            style={{ scale: heroScale, opacity: heroOpacity }}
          >
            <BlurFadeIn>
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-6">
                About Us
              </p>
            </BlurFadeIn>
            <TextReveal delay={0.15}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl mb-8 text-balance max-w-4xl">
                Thirteen years of{" "}
                <span className="italic gradient-text-iridescent">trusted expertise.</span>
              </h1>
            </TextReveal>
            <BlurFadeIn delay={0.4}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                Established in 2011, GMR & Associates has grown from a dedicated practice
                to a trusted partner for over 500 businesses across India.
              </p>
            </BlurFadeIn>
          </motion.div>
        </section>

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <section className="border-y border-border/40">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/40">
              {[
                { value: 500, suffix: "+", label: "Clients Served" },
                { value: 13, suffix: "+", label: "Years of Practice" },
                { value: 99, suffix: "%", label: "Client Retention" },
              ].map((stat, i) => (
                <div key={i} className="text-center py-14 px-8">
                  <GlowCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    className="text-6xl font-light tracking-tight mb-2 block"
                    duration={2.2}
                  />
                  <BlurFadeIn delay={0.2 + i * 0.1}>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </BlurFadeIn>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Mission & Vision ──────────────────────────────────────────────── */}
        <section className="section-padding">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
              <BlurFadeIn direction="left">
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Mission</p>
                <h2 className="text-2xl md:text-3xl mb-5 leading-tight">
                  Empowering businesses with precision.
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  To empower businesses with precise financial insights and compliance
                  solutions, delivered with the care and attention your enterprise deserves.
                </p>
              </BlurFadeIn>
              <BlurFadeIn direction="right" delay={0.15}>
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Vision</p>
                <h2 className="text-2xl md:text-3xl mb-5 leading-tight">
                  India's most trusted CA firm.
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  To be recognized as India's most trusted chartered accountancy firm —
                  setting the standard for quality, integrity, and client dedication.
                </p>
              </BlurFadeIn>
            </div>
          </div>
        </section>

        <AnimatedDivider className="max-w-7xl mx-auto px-6 lg:px-12" />

        {/* ── Values — Bento grid ────────────────────────────────────────────── */}
        <section className="section-padding bg-aurora">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="mb-16">
              <BlurFadeIn>
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Our Values</p>
              </BlurFadeIn>
              <TextReveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl max-w-xl">
                  The principles that guide every engagement
                </h2>
              </TextReveal>
            </div>

            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-4" staggerDelay={0.1}>
              {values.map((v, i) => (
                <StaggerGridItem key={i}>
                  <SpotlightCard className="p-8 md:p-10 h-full group">
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="text-2xl">{v.icon}</span>
                        <span className="text-xs text-muted-foreground tracking-widest">{v.num}</span>
                      </div>
                      <h3 className="text-2xl mt-2 mb-3 group-hover:text-accent transition-colors duration-500">
                        {v.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">{v.desc}</p>
                    </div>
                  </SpotlightCard>
                </StaggerGridItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── Story / Timeline ──────────────────────────────────────────────── */}
        <section className="section-padding">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mx-auto mb-20">
              <BlurFadeIn>
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-8">Our Story</p>
              </BlurFadeIn>
              <ScaleOnScroll>
                <div className="space-y-6 text-[17px] leading-relaxed">
                  <p>
                    Established in 2011, we are a premier chartered accountancy firm dedicated
                    to providing comprehensive professional services. We merge deep domain expertise
                    with innovative technology to deliver unparalleled value to our clients across India.
                  </p>
                  <p className="text-muted-foreground">
                    Over thirteen years, we've remained steadfast in our belief that great accounting
                    is about more than numbers. We've witnessed our clients grow from startups to
                    established enterprises, navigating complex regulatory landscapes and emerging stronger.
                  </p>
                  <p className="text-muted-foreground">
                    Our 99% client retention rate speaks not to our marketing, but to something more
                    fundamental — the relationships we build and the results we deliver, year after year.
                  </p>
                </div>
              </ScaleOnScroll>
            </div>

            {/* Timeline */}
            <div className="max-w-2xl mx-auto">
              <BlurFadeIn>
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-12 text-center">
                  Our Journey
                </p>
              </BlurFadeIn>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[27px] top-0 bottom-0 w-px bg-gradient-to-b from-accent/30 via-border to-transparent" />

                <div className="space-y-8">
                  {timeline.map((item, i) => (
                    <BlurFadeIn key={i} delay={i * 0.1}>
                      <div className="flex gap-6 items-start group">
                        {/* Dot */}
                        <div className="relative">
                          <div className="w-[14px] h-[14px] rounded-full bg-secondary border-2 border-accent/40 group-hover:border-accent group-hover:bg-accent/20 transition-all duration-500 mt-1 flex-shrink-0" />
                        </div>
                        <div>
                          <span className="text-xs text-accent font-semibold tracking-widest block mb-1">
                            {item.year}
                          </span>
                          <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-500">
                            {item.event}
                          </p>
                        </div>
                      </div>
                    </BlurFadeIn>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <AnimatedDivider className="max-w-7xl mx-auto px-6 lg:px-12" />

        {/* ── Partners ─────────────────────────────────────────────────────── */}
        <section className="section-padding bg-secondary/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <BlurFadeIn>
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Leadership</p>
              </BlurFadeIn>
              <TextReveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl">Our Partners</h2>
              </TextReveal>
            </div>

            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto" staggerDelay={0.12}>
              {partners.map((p, i) => (
                <StaggerGridItem key={i}>
                  <SpotlightCard className="p-8 text-center h-full group">
                    {/* Avatar with animated gradient border */}
                    <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center relative`}>
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${p.gradient} opacity-20 group-hover:opacity-40 transition-opacity duration-700`} />
                      <div className="absolute inset-[2px] rounded-full bg-card flex items-center justify-center">
                        <span className="text-lg font-medium text-accent">{p.initials}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-medium mb-1 group-hover:text-accent transition-colors duration-500">
                      {p.name}
                    </h3>
                    {p.title && (
                      <p className="text-xs text-muted-foreground tracking-wide mb-4">{p.title}</p>
                    )}
                    <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
                  </SpotlightCard>
                </StaggerGridItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="section-padding">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <TextReveal>
              <h2 className="text-3xl md:text-5xl mb-6">
                Ready to work together?
              </h2>
            </TextReveal>
            <BlurFadeIn delay={0.2}>
              <p className="text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed">
                Let's discuss how our expertise can serve your specific business needs.
              </p>
            </BlurFadeIn>
            <BlurFadeIn delay={0.3}>
              <MagneticWrap strength={0.12} className="inline-block">
                <Button
                  asChild
                  size="lg"
                  className="h-12 px-8 rounded-full bg-foreground text-background font-medium transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] hover:shadow-xl"
                >
                  <Link to="/contact">
                    Get in Touch <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </MagneticWrap>
            </BlurFadeIn>
          </div>
        </section>

      </div>
    </PageTransition>
  );
}