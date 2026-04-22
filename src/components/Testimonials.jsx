import { Quote, Star } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TextReveal, BlurFadeIn } from "@/components/PremiumAnimations";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "CEO, TechFlow Solutions",
    initials: "RK",
    content: "GMR & Associates transformed our financial operations. Their auditing process was meticulous and brought a level of clarity we've never had before.",
  },
  {
    name: "Priya Sharma",
    role: "Founder, Zenith Retail",
    initials: "PS",
    content: "The tax advisory team here is exceptionally proactive. They not only ensured compliance but helped us restructure our strategy for long-term growth.",
  },
  {
    name: "Amit Desai",
    role: "Director, BuildCorp Infrastructure",
    initials: "AD",
    content: "Finding an accounting partner who truly understands the nuances of the construction industry was tough, until we met GMR. Highly recommended.",
  },
  {
    name: "Neha Gupta",
    role: "Managing Partner, LegalFirst",
    initials: "NG",
    content: "Accurate, timely, and professional. The monthly MIS reports they generate give us exact visibility into our cash flow.",
  },
  {
    name: "Vikram Singh",
    role: "CFO, GlobalTrade Inc.",
    initials: "VS",
    content: "Handling intricate GST and corporate law matters requires absolute precision, and the team at GMR consistently delivers flawless execution.",
  },
];

const COLORS = [
  "from-blue-500/20 to-cyan-500/10",
  "from-purple-500/20 to-indigo-500/10",
  "from-emerald-500/20 to-teal-500/10",
  "from-orange-500/20 to-amber-500/10",
  "from-pink-500/20 to-rose-500/10",
];

export function Testimonials() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="py-24 overflow-hidden relative border-y border-border/40 bg-background/50 content-defer"
    >
      {/* Static ambient glow — no JS animation, GPU-promoted */}
      <div
        className="absolute top-1/2 left-1/2 w-[500px] h-[250px] bg-accent/5 rounded-full pointer-events-none"
        style={{
          transform: "translate(-50%, -50%) translateZ(0)",
          filter: "blur(80px)",
        }}
      />

      <div className="mb-16 text-center px-6">
        <BlurFadeIn>
          <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">
            Client Success
          </p>
        </BlurFadeIn>
        <TextReveal delay={0.1}>
          <h2 className="text-3xl md:text-5xl">Trusted by industry leaders</h2>
        </TextReveal>
      </div>

      <div className="ticker-wrap w-[200vw] sm:w-[150vw] md:w-[150vw] lg:w-[120vw] xl:w-screen mx-auto">
        {/* Pause animation on hover for better UX */}
        <div className="ticker-track animate-ticker flex hover:[animation-play-state:paused] gap-6 px-3">
          {/* Use plain divs instead of motion.div for ticker items — 
              they don't need individual animation, the CSS ticker handles movement */}
          {[...testimonials, ...testimonials, ...testimonials].map(
            (testimonial, i) => (
              <div
                key={i}
                className="premium-card p-8 flex-shrink-0 w-[350px] md:w-[400px] flex flex-col justify-between min-h-[260px] group"
                style={{
                  opacity: isInView ? 1 : 0,
                  transform: isInView ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.5s ease ${(i % testimonials.length) * 0.1}s, transform 0.5s ease ${(i % testimonials.length) * 0.1}s`,
                }}
              >
                {/* Top gradient accent */}
                <div
                  className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${COLORS[i % COLORS.length]} opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative">
                  <Quote className="w-8 h-8 text-accent/30 mb-4 group-hover:text-accent/50 transition-colors duration-500" />
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    "{testimonial.content}"
                  </p>

                  {/* Star rating */}
                  <div className="flex items-center gap-0.5 mt-4">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${COLORS[i % COLORS.length]} border border-border/30 flex items-center justify-center flex-shrink-0 group-hover:border-accent/30 transition-colors duration-500`}
                  >
                    <span className="text-xs font-semibold text-foreground/80">
                      {testimonial.initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground tracking-tight text-sm group-hover:text-accent transition-colors duration-500">
                      {testimonial.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-widest">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}