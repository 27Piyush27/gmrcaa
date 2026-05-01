import { motion, useScroll, useTransform } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Target, Shield, Users, Star } from "lucide-react";
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
import {
  FloatingCube,
  FloatingRing,
  FloatingSphere,
  FloatingDots,
  Tilt3DCard,
  RotatingEmblem,
  IsometricGrid,
} from "@/components/ThreeDElements";

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
    { title: "Precision", desc: "Every figure verified. Every detail considered. No exceptions.", num: "01", icon: <Target className="h-6 w-6" /> },
    { title: "Integrity", desc: "Transparent practices and honest counsel, even when it's difficult.", num: "02", icon: <Shield className="h-6 w-6" /> },
    { title: "Partnership", desc: "Your success is our measure. We invest in understanding your goals.", num: "03", icon: <Users className="h-6 w-6" /> },
    { title: "Excellence", desc: "Standards that exceed expectations, consistently delivered.", num: "04", icon: <Star className="h-6 w-6" /> },
  ];

  const partners = [
    {
      name: "Gaurav Makkar",
      title: "Senior Partner, FCA",
      initials: "GM",
      gradient: "from-blue-500 to-cyan-400",
      desc: "Expert in capital markets and statutory audits with a strong financial background, assisting numerous SMEs with project financing from nationalised banks.",
    },
    {
      name: "Saurabh Madan",
      title: "Senior Partner, FCA",
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
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section ref={heroRef} className="relative min-h-[90svh] flex flex-col items-center justify-center pt-28 pb-20 md:pt-32 md:pb-32 overflow-hidden">
          
          {/* Ambient Glows matching Home Page Theme */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] left-1/2 w-[800px] h-[800px] rounded-full"
              style={{ transform: "translateX(-50%) translateZ(0)", background: "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 60%)" }}
            />
            <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full animate-breathe"
              style={{ background: "radial-gradient(circle, hsl(280 80% 60% / 0.04) 0%, transparent 55%)", transform: "translateZ(0)" }}
            />
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full animate-breathe"
              style={{ background: "radial-gradient(circle, hsl(190 80% 50% / 0.03) 0%, transparent 55%)", transform: "translateZ(0)", animationDelay: "-3s" }}
            />
          </div>

          {/* 3D Hero Decorations (Wireframe style like Home) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <FloatingCube size={70} className="top-[15%] right-[12%] hidden md:block" delay={0.5} duration={25} opacity={0.08} />
            <FloatingCube size={35} className="bottom-[20%] left-[8%] hidden md:block" color="hsl(280 80% 60%)" delay={1.2} duration={30} opacity={0.06} />
            <FloatingRing size={140} className="top-[30%] left-[5%] hidden lg:block" delay={0.8} duration={18} opacity={0.1} />
            <FloatingRing size={90} className="bottom-[25%] right-[8%] hidden lg:block" color="hsl(280 80% 60%)" delay={1.5} duration={22} opacity={0.08} strokeWidth={1} />
            <FloatingSphere size={50} className="top-[20%] left-[20%] hidden md:block" delay={0.3} glowIntensity={0.08} />
            <FloatingDots count={15} className="top-[10%] left-[10%] hidden lg:block" spread={300} />
          </div>

          {/* Noise texture overlay */}
          <div className="absolute inset-0 bg-noise pointer-events-none opacity-40" />

          <motion.div
            className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 text-center"
            style={{ scale: heroScale, opacity: heroOpacity }}
          >
            {/* Pill Badge exactly matching Home */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ABOUT OUR FIRM
            </motion.div>
            
            {/* Massive Bold Typography exactly matching Home "Financial clarity. Uncompromised." */}
            <div className="mb-6 overflow-hidden" style={{ perspective: "1000px" }}>
              <TextReveal delay={0.15}>
                <h1 className="text-5xl md:text-7xl lg:text-8xl leading-[1.02] text-balance font-bold tracking-tight text-foreground">
                  Thirteen years of{" "}
                  <br className="hidden md:block" />
                  <span className="gradient-text-premium italic">trusted expertise.</span>
                </h1>
              </TextReveal>
            </div>

            {/* Subtitle */}
            <BlurFadeIn delay={0.4}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                Established in 2011, GMR & Associates has grown from a dedicated practice
                to a trusted partner for over 500 businesses across India.
              </p>
            </BlurFadeIn>

            {/* CTAs matching Home exactly */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: easing, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <MagneticWrap strength={0.15}>
                <Link to="/services">
                  <span className="flex items-center gap-2 px-8 py-3.5 bg-foreground text-background font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] group">
                    Explore Services
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </MagneticWrap>
              <MagneticWrap strength={0.15}>
                <Link to="/contact">
                  <span className="flex items-center gap-2 px-8 py-3.5 bg-secondary/80 backdrop-blur-md text-foreground font-medium rounded-full border border-border/50 hover:bg-secondary transition-all duration-500 hover:scale-[1.03] active:scale-[0.98]">
                    Talk to an Expert
                  </span>
                </Link>
              </MagneticWrap>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-[11px] text-muted-foreground tracking-widest uppercase">
              SCROLL
            </span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-muted-foreground/60 to-transparent animate-float" />
          </motion.div>
        </section>

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <section className="section-padding-sm content-defer border-y border-border/40">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x divide-border/40">
              {[
                { value: 500, suffix: "+", label: "Clients Served" },
                { value: 13, suffix: "+", label: "Years of Practice" },
                { value: 99, suffix: "%", label: "Client Retention" },
              ].map((stat, i) => (
                <div key={i} className="text-center py-8 px-8">
                  <GlowCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    className="text-6xl md:text-7xl font-light tracking-tight mb-3 block"
                    duration={2}
                  />
                  <BlurFadeIn delay={0.2 + i * 0.1}>
                    <p className="text-sm text-muted-foreground tracking-wide">{stat.label}</p>
                  </BlurFadeIn>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Mission & Vision (Using the 3D process card style) ──────────────────────────────────────────────── */}
        <section className="section-padding bg-secondary/20 content-defer relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-end">
            <IsometricGrid className="right-[-5%] top-[10%] hidden xl:block" rows={5} cols={6} cellSize={35} opacity={0.04} />
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <BlurFadeIn direction="up">
                <Tilt3DCard tiltStrength={5} glareEnabled={false}>
                  <div className="bento-card p-10 md:p-14 h-full group three-d-card-lift relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="text-4xl mb-6">🎯</div>
                    <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-4 font-semibold">Mission</p>
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground tracking-tight leading-tight">
                      Empowering businesses <br className="hidden md:block"/> with <span className="italic text-muted-foreground">precision.</span>
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-lg font-light">
                      To empower businesses with precise financial insights and compliance
                      solutions, delivered with the care and attention your enterprise deserves.
                    </p>
                  </div>
                </Tilt3DCard>
              </BlurFadeIn>
              
              <BlurFadeIn direction="up" delay={0.15}>
                <Tilt3DCard tiltStrength={5} glareEnabled={false}>
                  <div className="bento-card p-10 md:p-14 h-full group three-d-card-lift relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="text-4xl mb-6">⭐</div>
                    <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-4 font-semibold">Vision</p>
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground tracking-tight leading-tight">
                      India's most trusted <br className="hidden md:block"/> <span className="italic text-muted-foreground">CA firm.</span>
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-lg font-light">
                      To be recognized as India's most trusted chartered accountancy firm —
                      setting the standard for quality, integrity, and client dedication.
                    </p>
                  </div>
                </Tilt3DCard>
              </BlurFadeIn>
            </div>
          </div>
        </section>

        {/* ── Values ────────────────────────────────────────────── */}
        <section className="section-padding bg-aurora content-defer relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <RotatingEmblem size={250} className="top-[5%] right-[-2%] hidden xl:block" />
            <FloatingCube size={40} className="bottom-[10%] left-[5%] hidden lg:block" color="hsl(280 80% 60%)" delay={0.5} duration={28} opacity={0.05} />
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="text-center mb-20">
              <BlurFadeIn>
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Our Values</p>
              </BlurFadeIn>
              <TextReveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl lg:text-6xl max-w-3xl mx-auto font-bold tracking-tight">
                  The principles that guide <span className="italic gradient-text-premium">every engagement.</span>
                </h2>
              </TextReveal>
            </div>

            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-4" staggerDelay={0.1}>
              {values.map((v, i) => (
                <StaggerGridItem key={i}>
                  <Tilt3DCard tiltStrength={6} glareEnabled={true}>
                    <SpotlightCard className="p-8 md:p-12 h-full group">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-accent/10 transition-all duration-500 group-hover:shadow-glow">
                          <span className="text-muted-foreground group-hover:text-accent transition-colors duration-500">{v.icon}</span>
                        </div>
                        <span className="text-xs text-muted-foreground tracking-widest tabular-nums">0{i + 1}</span>
                        <h3 className="text-xl md:text-2xl mt-3 mb-3 group-hover:text-accent transition-colors duration-500 font-bold tracking-tight">
                          {v.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed mb-6 font-light">
                          {v.desc}
                        </p>
                      </div>
                    </SpotlightCard>
                  </Tilt3DCard>
                </StaggerGridItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── Story / Timeline ──────────────────────────────────────────────── */}
        <section className="section-padding relative overflow-hidden content-defer">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <FloatingRing size={100} className="top-[10%] right-[15%] hidden lg:block" delay={0.3} duration={20} opacity={0.06} />
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-20 relative z-10">
            <div className="flex-1 lg:sticky lg:top-32 h-fit">
              <BlurFadeIn>
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-6">Our Story</p>
              </BlurFadeIn>
              <TextReveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-8 leading-tight">
                  A legacy of <span className="gradient-text-premium italic">excellence.</span>
                </h2>
              </TextReveal>
              <ScaleOnScroll>
                <div className="space-y-6 text-[17px] text-muted-foreground leading-relaxed max-w-md">
                  <p>
                    Established in 2011, we are a premier chartered accountancy firm dedicated
                    to providing comprehensive professional services. We merge deep domain expertise
                    with innovative technology to deliver unparalleled value.
                  </p>
                  <p>
                    Our 99% client retention rate speaks not to our marketing, but to something more
                    fundamental — the relationships we build and the results we deliver, year after year.
                  </p>
                </div>
              </ScaleOnScroll>
            </div>

            {/* Timeline */}
            <div className="flex-1 relative pt-8">
              <div className="absolute left-[27px] top-0 bottom-0 w-px bg-gradient-to-b from-accent/30 via-border to-transparent" />

              <div className="space-y-12">
                {timeline.map((item, i) => (
                  <BlurFadeIn key={i} delay={i * 0.1}>
                    <div className="flex gap-6 items-start group relative">
                      <div className="relative">
                        <div className="w-[14px] h-[14px] rounded-full bg-secondary border-2 border-accent/40 group-hover:border-accent group-hover:bg-accent/20 transition-all duration-500 mt-1.5 flex-shrink-0" />
                      </div>
                      <div>
                        <span className="text-xs text-accent font-semibold tracking-widest block mb-2">
                          {item.year}
                        </span>
                        <p className="text-lg text-foreground font-medium leading-relaxed group-hover:text-accent transition-colors duration-500">
                          {item.event}
                        </p>
                      </div>
                    </div>
                  </BlurFadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Partners ─────────────────────────────────────── */}
        <section className="section-padding bg-secondary/20 content-defer relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <div className="text-center mb-20">
              <BlurFadeIn>
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Leadership</p>
              </BlurFadeIn>
              <TextReveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Our <span className="gradient-text-premium italic">Partners.</span></h2>
              </TextReveal>
            </div>

            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto" staggerDelay={0.12}>
              {partners.map((p, i) => (
                <StaggerGridItem key={i}>
                  <Tilt3DCard tiltStrength={6} glareEnabled={true}>
                    <SpotlightCard className="p-10 md:p-14 text-center rounded-[32px] h-full group">
                      <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center relative">
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${p.gradient} opacity-20 group-hover:opacity-40 transition-opacity duration-700`} />
                        <div className="absolute inset-[2px] rounded-full bg-card flex items-center justify-center">
                          <span className="text-lg font-medium text-accent">{p.initials}</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-2 text-foreground tracking-tight group-hover:text-accent transition-colors duration-500">
                        {p.name}
                      </h3>
                      <p className="text-xs tracking-wide text-muted-foreground uppercase mb-6">{p.title}</p>
                      <p className="text-muted-foreground leading-relaxed text-sm">{p.desc}</p>
                    </SpotlightCard>
                  </Tilt3DCard>
                </StaggerGridItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
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
                <div className="absolute top-0 left-1/2 w-[600px] h-[300px] rounded-full bg-accent/20 pointer-events-none" style={{ transform: "translateX(-50%) translateZ(0)", filter: "blur(80px)" }} />
                
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <FloatingCube size={30} className="top-[15%] left-[10%] hidden md:block" color="hsl(0 0% 100%)" delay={0.2} duration={20} opacity={0.06} />
                  <FloatingRing size={70} className="bottom-[10%] right-[8%] hidden md:block" color="hsl(0 0% 100%)" delay={0.5} duration={16} opacity={0.05} strokeWidth={1} />
                </div>

                <div className="relative">
                  <BlurFadeIn>
                    <p className="text-xs tracking-widest uppercase mb-4 text-background/50">Next Steps</p>
                  </BlurFadeIn>
                  <TextReveal delay={0.1}>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance text-background tracking-tight">
                      Ready to work <span className="italic font-light">together?</span>
                    </h2>
                  </TextReveal>
                  <BlurFadeIn delay={0.3}>
                    <p className="text-background/60 mb-10 max-w-lg mx-auto leading-relaxed text-lg">
                      Let's discuss how our expertise can serve your specific business needs.
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
                          <Link to="/contact">Talk to an Expert</Link>
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
    </PageTransition>
  );
}