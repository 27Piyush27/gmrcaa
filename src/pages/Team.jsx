import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Linkedin, Mail, Award, Users } from "lucide-react";

const easing = [0.22, 1, 0.36, 1];

const TEAM = [
  {
    name: "CA Gaurav Mittal", role: "Founding Partner", emoji: "👨‍💼",
    specialization: "Direct Tax, International Taxation, Transfer Pricing",
    experience: "15+ years", qualifications: "FCA, DISA, B.Com (H)",
    bio: "A seasoned tax professional specializing in complex direct tax matters and cross-border transactions."
  },
  {
    name: "CA Ritu Sharma", role: "Senior Partner", emoji: "👩‍💼",
    specialization: "GST, Indirect Tax, Business Advisory",
    experience: "12+ years", qualifications: "ACA, M.Com",
    bio: "Expert in GST compliance and indirect tax planning, helping businesses streamline their tax obligations."
  },
  {
    name: "CA Priyanka Verma", role: "Partner - Corporate", emoji: "👩‍💼",
    specialization: "Company Law, Startup Advisory, Compliance",
    experience: "10+ years", qualifications: "ACA, CS, LLB",
    bio: "Specialist in corporate law and startup ecosystem, guiding companies from incorporation to IPO readiness."
  },
  {
    name: "CA Arun Kapoor", role: "Partner - Audit", emoji: "👨‍💼",
    specialization: "Statutory Audit, Internal Audit, Risk Advisory",
    experience: "14+ years", qualifications: "FCA, CIA, CISA",
    bio: "Leading our audit practice with expertise in both statutory and internal audit across diverse industries."
  },
  {
    name: "Neha Singh", role: "Manager - Tax", emoji: "👩‍💻",
    specialization: "ITR Filing, Tax Planning, TDS",
    experience: "6+ years", qualifications: "CA Inter, MBA Finance",
    bio: "Manages day-to-day tax filing operations ensuring timely and accurate returns for all our clients."
  },
  {
    name: "Rohit Mehra", role: "Manager - GST", emoji: "👨‍💻",
    specialization: "GST Returns, E-way Bills, GST Audit",
    experience: "5+ years", qualifications: "CA Inter, B.Com",
    bio: "Handles GST compliance for 200+ clients, ensuring error-free filing and timely updates on regulatory changes."
  },
];

export default function Team() {
  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Users className="w-3.5 h-3.5" /> Our People
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.12 }}>
              Meet the{" "}<span className="italic gradient-text-premium">Experts</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.28 }}>
              A dedicated team of qualified CAs and finance professionals committed to your success.
            </motion.p>
          </div>
        </section>

        {/* Team Grid */}
        <section className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEAM.map((member, i) => (
                <ScrollReveal key={i} delay={i * 0.08}>
                  <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="premium-card p-6 relative group">
                    <div className="text-5xl mb-4">{member.emoji}</div>
                    <h3 className="text-lg font-semibold mb-0.5">{member.name}</h3>
                    <p className="text-sm text-accent font-medium mb-2">{member.role}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">{member.bio}</p>
                    <div className="space-y-2 pt-3 border-t border-border/40">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Award className="w-3 h-3" />
                        <span>{member.qualifications}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong>Specialization:</strong> {member.specialization}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Experience:</strong> {member.experience}
                      </p>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-28 bg-foreground text-background relative overflow-hidden">
          <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
            <ScrollReveal>
              <h2 className="text-3xl sm:text-4xl font-semibold mb-4">Want to join our team?</h2>
              <p className="text-background/60 mb-8 max-w-md mx-auto">
                We're always looking for talented CAs and finance professionals to join our growing practice.
              </p>
              <a href="mailto:careers@gmrindia.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-background text-foreground text-sm font-medium hover:bg-background/90 transition-colors">
                <Mail className="w-4 h-4" /> careers@gmrindia.com
              </a>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
