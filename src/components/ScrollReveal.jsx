import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// Apple easing
const easing = [0.22, 1, 0.36, 1];

export const ScrollReveal = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const dirMap = {
    up: { y: 24, x: 0 },
    left: { y: 0, x: -24 },
    right: { y: 0, x: 24 },
    none: { y: 0, x: 0 },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ willChange: "opacity, transform, filter" }}
      initial={{ opacity: 0, filter: "blur(6px)", ...dirMap[direction] }}
      animate={inView ? { opacity: 1, filter: "blur(0px)", y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, ease: easing, delay }}
    >
      {children}
    </motion.div>
  );
};

export const StaggerContainer = ({
  children,
  className = "",
  staggerDelay = 0.08,
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.05,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

// Blur-fade stagger item — premium reveal
export const StaggerItem = ({ children, className = "" }) => (
  <motion.div
    className={className}
    style={{ willChange: "opacity, transform, filter" }}
    variants={{
      hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
      visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.55, ease: easing },
      },
    }}
  >
    {children}
  </motion.div>
);