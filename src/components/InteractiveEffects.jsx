import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { ArrowUp } from "lucide-react";

// ── 1. Scroll Progress Bar ──────────────────────────────────────────────────
// A sleek gradient bar fixed at the top of the viewport showing scroll progress.
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z-[9999] origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, #6366f1, #06b6d4, #10b981)",
        willChange: "transform",
      }}
    />
  );
}

// ── 2. Custom Cursor ────────────────────────────────────────────────────────
// A dot + ring cursor that scales up on interactive elements. Hidden on touch.
export function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);
  const pos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const raf = useRef(null);

  // Check for touch device
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const animate = useCallback(() => {
    // Smooth ring follow
    ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.15;
    ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.15;

    if (dotRef.current) {
      dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
    }
    if (ringRef.current) {
      ringRef.current.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px) translate(-50%, -50%) scale(${hovering ? 1.8 : clicking ? 0.8 : 1})`;
    }
    raf.current = requestAnimationFrame(animate);
  }, [hovering, clicking]);

  useEffect(() => {
    if (isTouch) return;

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };
    const onEnter = () => setVisible(true);
    const onLeave = () => setVisible(false);
    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    const onOver = (e) => {
      const t = e.target;
      if (t.closest("a, button, [role='button'], input, textarea, select, [data-interactive], .cursor-pointer")) {
        setHovering(true);
      }
    };
    const onOut = () => setHovering(false);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(raf.current);
    };
  }, [isTouch, visible, animate]);

  if (isTouch) return null;

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[99999] mix-blend-difference"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#fff",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s",
          willChange: "transform",
        }}
      />
      {/* Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[99998] mix-blend-difference"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.5)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s, border-color 0.3s",
          willChange: "transform",
          borderColor: hovering ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.5)",
        }}
      />
    </>
  );
}

// ── 3. Back to Top ──────────────────────────────────────────────────────────
export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-6 z-50 w-11 h-11 rounded-full bg-foreground text-background shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 group"
          aria-label="Back to top"
        >
          <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ── 4. Ripple Effect Hook ───────────────────────────────────────────────────
// Add to any element for Material-style ripple on click.
export function useRipple() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleClick = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;

      const ripple = document.createElement("span");
      ripple.style.cssText = `
        position: absolute; border-radius: 50%; pointer-events: none;
        width: ${size}px; height: ${size}px;
        left: ${x - size / 2}px; top: ${y - size / 2}px;
        background: currentColor; opacity: 0.12;
        transform: scale(0); animation: ripple-anim 0.6s ease-out forwards;
      `;
      el.style.position = "relative";
      el.style.overflow = "hidden";
      el.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    };

    el.addEventListener("click", handleClick);
    return () => el.removeEventListener("click", handleClick);
  }, []);

  return ref;
}

// ── 5. Animated Tooltip ─────────────────────────────────────────────────────
export function AnimatedTooltip({ children, content, side = "top" }) {
  const [show, setShow] = useState(false);

  const positionClass = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[side];

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: side === "top" ? 4 : side === "bottom" ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute ${positionClass} z-50 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap shadow-lg pointer-events-none`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 6. Interactive Counter ──────────────────────────────────────────────────
// A number that animates on hover with a glow pulse effect.
export function InteractiveCounter({ value, prefix = "", suffix = "", className = "" }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.span
      className={`inline-block cursor-default ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{
        scale: hovered ? 1.08 : 1,
        textShadow: hovered
          ? "0 0 20px rgba(99,102,241,0.4), 0 0 40px rgba(99,102,241,0.1)"
          : "0 0 0px transparent",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {prefix}{value}{suffix}
    </motion.span>
  );
}

// ── 7. Confetti Burst ───────────────────────────────────────────────────────
// Lightweight CSS confetti for success moments.
export function ConfettiBurst({ trigger = false, duration = 2500 }) {
  const [active, setActive] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (trigger && !active) {
      setActive(true);
      const colors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];
      const p = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 30,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        angle: Math.random() * 360,
        velocity: 2 + Math.random() * 4,
        delay: Math.random() * 0.3,
      }));
      setParticles(p);
      setTimeout(() => { setActive(false); setParticles([]); }, duration);
    }
  }, [trigger, active, duration]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}vw`,
            y: "50vh",
            scale: 1,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: `${p.x + (Math.random() - 0.5) * 40}vw`,
            y: `${-20 + Math.random() * 120}vh`,
            scale: 0,
            opacity: 0,
            rotate: p.angle,
          }}
          transition={{
            duration: 1.5 + Math.random(),
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}
