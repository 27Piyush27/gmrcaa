import { Quote, Star } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useCallback } from "react";
import { TextReveal, BlurFadeIn } from "@/components/PremiumAnimations";

const ease = [0.22, 1, 0.36, 1];

const testimonials = [
  {
    name: "Rajesh K.",
    role: "CEO, Technology Sector",
    initials: "RK",
    content: "GMR & Associates transformed our financial operations. Their auditing process was meticulous and brought a level of clarity we've never had before.",
  },
  {
    name: "Priya S.",
    role: "Founder, Retail Sector",
    initials: "PS",
    content: "The tax advisory team here is exceptionally proactive. They not only ensured compliance but helped us restructure our strategy for long-term growth.",
  },
  {
    name: "Amit D.",
    role: "Director, Infrastructure",
    initials: "AD",
    content: "Finding an accounting partner who truly understands the nuances of the construction industry was tough, until we met GMR. Highly recommended.",
  },
  {
    name: "Neha G.",
    role: "Managing Partner, Legal Services",
    initials: "NG",
    content: "Accurate, timely, and professional. The monthly MIS reports they generate give us exact visibility into our cash flow.",
  },
  {
    name: "Vikram S.",
    role: "CFO, Corporate Client",
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

const ACCENT_COLORS = [
  "from-blue-400 to-cyan-400",
  "from-purple-400 to-indigo-400",
  "from-emerald-400 to-teal-400",
  "from-orange-400 to-amber-400",
  "from-pink-400 to-rose-400",
];

// Card with mouse-tracking spotlight glow
function TestimonialCard({ testimonial, index, isInView }) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="premium-card shimmer-sweep p-8 flex-shrink-0 w-[350px] md:w-[400px] flex flex-col justify-between min-h-[260px] group"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${(index % testimonials.length) * 0.1}s, transform 0.5s ease ${(index % testimonials.length) * 0.1}s`,
      }}
    >
      {/* Top gradient accent — animated width on hover */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${ACCENT_COLORS[index % ACCENT_COLORS.length]} opacity-0 group-hover:opacity-100 transition-all duration-700`}
        style={{ transformOrigin: "left" }}
      />

      {/* Spotlight glow overlay */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), hsl(var(--accent) / 0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative">
        {/* Animated quote icon */}
        <motion.div
          whileHover={{ rotate: -10, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Quote className="w-8 h-8 text-accent/30 mb-4 group-hover:text-accent/60 transition-colors duration-500" />
        </motion.div>
        <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
          "{testimonial.content}"
        </p>

        {/* Star rating with staggered fade */}
        <div className="flex items-center gap-0.5 mt-4">
          {[...Array(5)].map((_, j) => (
            <motion.div
              key={j}
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                duration: 0.3,
                delay: (index % testimonials.length) * 0.1 + j * 0.05 + 0.3,
                ease,
              }}
            >
              <Star
                className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
              />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        {/* Avatar with hover glow ring */}
        <div
          className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${COLORS[index % COLORS.length]} border border-border/30 flex items-center justify-center flex-shrink-0 group-hover:border-accent/30 transition-all duration-500`}
        >
          {/* Glow ring on hover */}
          <div className="absolute inset-[-3px] rounded-full border border-accent/0 group-hover:border-accent/20 transition-all duration-500 group-hover:animate-soft-pulse" />
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
  );
}

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
          {[...testimonials, ...testimonials, ...testimonials].map(
            (testimonial, i) => (
              <TestimonialCard
                key={i}
                testimonial={testimonial}
                index={i}
                isInView={isInView}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}