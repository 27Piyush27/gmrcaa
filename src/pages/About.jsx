import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const easing = [0.22, 1, 0.36, 1];

export default function About() {
  const values = [
  { title: "Precision", desc: "Every figure verified. Every detail considered. No exceptions.", num: "01" },
  { title: "Integrity", desc: "Transparent practices and honest counsel, even when it's difficult.", num: "02" },
  { title: "Partnership", desc: "Your success is our measure. We invest in understanding your goals.", num: "03" },
  { title: "Excellence", desc: "Standards that exceed expectations, consistently delivered.", num: "04" }];


  const partners = [
  {
    name: "Gaurav Makkar",
    title: "FCA",
    initials: "GM",
    desc: "Expert in capital markets and statutory audits with a strong financial background, assisting numerous SMEs with project financing from nationalised banks."
  },
  {
    name: "Mohit Gupta",
    title: "FCA, LLB",
    initials: "MG",
    desc: "10+ years specialising in Taxation and the NGO sector. Expert consultancy on complex GST cases, searches, and appeals."
  },
  {
    name: "Saurabh Madan",
    title: "FCA",
    initials: "SM",
    desc: "Corporate finance and advisory specialist, helping businesses navigate complex financial landscapes and achieve sustainable growth."
  }];


  return (
    <PageTransition>
      <div className="min-h-screen">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative py-28 md:py-40 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <motion.p
              className="text-xs tracking-widest text-muted-foreground uppercase mb-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing, delay: 0.1 }}>
              
              About Us
            </motion.p>
            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl mb-8 text-balance max-w-4xl"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.2 }}>
              
              Thirteen years of{" "}
              <span className="italic gradient-text">trusted expertise.</span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.38 }}>
              
              Established in 2011, GMR & Associates has grown from a dedicated practice
              to a trusted partner for over 500 businesses across India.
            </motion.p>
          </div>
        </section>

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <section className="border-y border-border/40">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <StaggerContainer
              className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/40"
              staggerDelay={0.15}>
              
              {[
              { value: 500, suffix: "+", label: "Clients Served" },
              { value: 13, suffix: "+", label: "Years of Practice" },
              { value: 99, suffix: "%", label: "Client Retention" }].
              map((stat, i) =>
              <StaggerItem key={i} className="text-center py-14 px-8">
                  <AnimatedCounter
                  target={stat.value}
                  suffix={stat.suffix}
                  className="text-6xl font-light tracking-tight mb-2 block" />
                
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </StaggerItem>
              )}
            </StaggerContainer>
          </div>
        </section>

        {/* ── Mission & Vision ──────────────────────────────────────────────── */}
        <section className="section-padding">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
              <ScrollReveal direction="left">
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Mission</p>
                <h2 className="text-2xl md:text-3xl mb-5 leading-tight">
                  Empowering businesses with precision.
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  To empower businesses with precise financial insights and compliance
                  solutions, delivered with the care and attention your enterprise deserves.
                </p>
              </ScrollReveal>
              <ScrollReveal direction="right" delay={0.1}>
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Vision</p>
                <h2 className="text-2xl md:text-3xl mb-5 leading-tight">
                  India's most trusted CA firm.
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  To be recognized as India's most trusted chartered accountancy firm —
                  setting the standard for quality, integrity, and client dedication.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Values ───────────────────────────────────────────────────────── */}
        <section className="section-padding bg-secondary/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <ScrollReveal className="mb-16">
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Our Values</p>
              <h2 className="text-4xl md:text-5xl max-w-xl">
                The principles that guide every engagement
              </h2>
            </ScrollReveal>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4" staggerDelay={0.1}>
              {values.map((v, i) =>
              <StaggerItem key={i}>
                  <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="apple-card p-8 md:p-10">
                  
                    <span className="text-xs text-muted-foreground tracking-widest">{v.num}</span>
                    <h3 className="text-2xl mt-4 mb-3">{v.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{v.desc}</p>
                  </motion.div>
                </StaggerItem>
              )}
            </StaggerContainer>
          </div>
        </section>

        {/* ── Story ────────────────────────────────────────────────────────── */}
        <section className="section-padding">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mx-auto">
              <ScrollReveal>
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-8">Our Story</p>
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
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Partners ─────────────────────────────────────────────────────── */}
        <section className="section-padding bg-secondary/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <ScrollReveal className="text-center mb-16">
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Leadership</p>
              <h2 className="text-4xl md:text-5xl">Our Partners</h2>
            </ScrollReveal>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto" staggerDelay={0.12}>
              {partners.map((p, i) =>
              <StaggerItem key={i}>
                  <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="apple-card p-8 text-center">
                  
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 mx-auto mb-6 flex items-center justify-center">
                      <span className="text-lg font-medium text-accent">{p.initials}</span>
                    </div>
                    <h3 className="text-xl font-medium mb-1">{p.name}</h3>
                    {p.title &&
                  <p className="text-xs text-muted-foreground tracking-wide mb-4">{p.title}</p>
                  }
                    <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
                  </motion.div>
                </StaggerItem>
              )}
            </StaggerContainer>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="section-padding">
          <ScrollReveal className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <h2 className="text-3xl md:text-5xl mb-6">
              Ready to work together?
            </h2>
            <p className="text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed">
              Let's discuss how our expertise can serve your specific business needs.
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button asChild size="lg" className="h-12 px-8 rounded-full bg-foreground text-background font-medium">
                <Link to="/contact">
                  Get in Touch <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </ScrollReveal>
        </section>

      </div>
    </PageTransition>);

}