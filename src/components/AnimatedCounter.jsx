import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";








// Pure rAF-based counter — no framer-motion spring subscription firing 60/s
export const AnimatedCounter = ({
  target,
  suffix = "",
  duration = 1.8,
  className = ""
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [display, setDisplay] = useState("0");
  const rafRef = useRef(0);
  const startRef = useRef(null);

  useEffect(() => {
    if (!isInView) return;

    const totalMs = duration * 1000;
    startRef.current = null;

    const tick = (now) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / totalMs, 1);
      // ease-out cubic for natural deceleration
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
    <span
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease"
      }}>
      
      {display}{suffix}
    </span>);

};