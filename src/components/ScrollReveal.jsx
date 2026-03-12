import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// Only opacity + translate — no scale to keep animations compositor-only
const easing = [0.22, 1, 0.36, 1];








export const ScrollReveal = ({
  children,
  className = "",
  delay = 0,
  direction = "up"
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const dirMap = {
    up: { y: 18, x: 0 },
    left: { y: 0, x: -18 },
    right: { y: 0, x: 18 },
    none: { y: 0, x: 0 }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ willChange: "opacity, transform" }}
      initial={{ opacity: 0, ...dirMap[direction] }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.5, ease: easing, delay }}>
      
      {children}
    </motion.div>);

};







export const StaggerContainer = ({
  children,
  className = "",
  staggerDelay = 0.08
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
            delayChildren: 0.03
          }
        }
      }}>
      
      {children}
    </motion.div>);

};






// No scale — only opacity + y (GPU composited)
export const StaggerItem = ({ children, className = "" }) =>
<motion.div
  className={className}
  style={{ willChange: "opacity, transform" }}
  variants={{
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: easing }
    }
  }}>
  
    {children}
  </motion.div>;