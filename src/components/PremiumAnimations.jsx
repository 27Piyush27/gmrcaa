import { motion, useInView, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";

// Premium easing — Apple's custom cubic-bezier
const ease = [0.22, 1, 0.36, 1];

// ─── Text Split Reveal — Apple Product Page Style ──────────────────────────

export function TextReveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <Tag ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={isInView ? { y: "0%", opacity: 1 } : {}}
        transition={{
          duration: 0.75,
          ease,
          delay,
        }}
        style={{ transformOrigin: "bottom center" }}
      >
        {children}
      </motion.div>
    </Tag>
  );
}

// ─── Word-by-word stagger reveal ───────────────────────────────────────────

export function WordReveal({ text, className = "", delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const words = text.split(" ");

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "100%", opacity: 0 }}
            animate={isInView ? { y: "0%", opacity: 1 } : {}}
            transition={{
              duration: 0.5,
              ease,
              delay: delay + i * 0.04,
            }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// ─── Parallax Container — Apple-style scroll-based depth ────────────────────

export function ParallaxSection({ children, className = "", speed = 0.3 }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * -100}px`, `${speed * 100}px`]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y, willChange: "transform", transform: "translateZ(0)" }}>{children}</motion.div>
    </div>
  );
}

// ─── Scale on Scroll — Google-inspired zoom-in reveal ───────────────────────

export function ScaleOnScroll({ children, className = "" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.85, 1, 1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.3]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ scale, opacity, willChange: "transform, opacity", transform: "translateZ(0)" }}>
        {children}
      </motion.div>
    </div>
  );
}

// ─── Magnetic Button — Follows cursor within boundary like Apple buttons ────

export function MagneticWrap({ children, className = "", strength = 0.3 }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      x.set((e.clientX - centerX) * strength);
      y.set((e.clientY - centerY) * strength);
    },
    [x, y, strength]
  );

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.div>
  );
}

// ─── Spotlight Card — Mouse-tracking inner glow ─────────────────────────────

export function SpotlightCard({ children, className = "" }) {
  const ref = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={ref}
      className={`spotlight-card ${className}`}
      onMouseMove={handleMouseMove}
    >
      {children}
    </div>
  );
}

// ─── Horizontal Scroll Section — Modern magazine-style showcase ─────────────

export function HorizontalScroll({ children, className = "" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);

  return (
    <div ref={ref} className={`relative h-[300vh] ${className}`}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div className="flex gap-6" style={{ x }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Animated Divider — Expands on scroll ───────────────────────────────────

export function AnimatedDivider({ className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        className="h-px bg-gradient-to-r from-transparent via-border to-transparent"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2, ease }}
        style={{ transformOrigin: "center" }}
      />
    </div>
  );
}

// ─── Counter with Glow — Premium stat reveal ────────────────────────────────

export function GlowCounter({ target, suffix = "", prefix = "", className = "", duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [display, setDisplay] = useState("0");
  const [glowing, setGlowing] = useState(false);
  const rafRef = useRef(0);
  const startRef = useRef(null);

  useEffect(() => {
    if (!isInView) return;

    setGlowing(true);
    setTimeout(() => setGlowing(false), 2000);

    const totalMs = duration * 1000;
    startRef.current = null;

    const tick = (now) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / totalMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target).toString());
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isInView, target, duration]);

  return (
    <motion.span
      ref={ref}
      className={`${className} ${glowing ? "animate-number-glow" : ""}`}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease }}
    >
      {prefix}{display}{suffix}
    </motion.span>
  );
}

// ─── Blur Fade In — Premium content reveal (opacity + transform only) ────────

export function BlurFadeIn({ children, className = "", delay = 0, direction = "up" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const dirMap = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { y: 0, x: -20 },
    right: { y: 0, x: 20 },
    none: { y: 0, x: 0 },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        ...dirMap[direction],
      }}
      animate={
        isInView
          ? { opacity: 1, y: 0, x: 0 }
          : {}
      }
      transition={{ duration: 0.55, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── Staggered Grid — Children animate in one-by-one ──────────────────────

export function StaggerGrid({ children, className = "", staggerDelay = 0.08 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGridItem({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Rotating Text — Cycling through words with animation ───────────────────

export function RotatingText({ words, className = "", interval = 3000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <span className={`inline-block relative overflow-hidden align-bottom ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={word}
          className="inline-block absolute left-0"
          initial={{ y: "100%", opacity: 0 }}
          animate={
            i === currentIndex
              ? { y: "0%", opacity: 1 }
              : { y: "-100%", opacity: 0 }
          }
          transition={{ duration: 0.5, ease }}
          style={i === currentIndex ? { position: "relative" } : {}}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
