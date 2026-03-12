import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

// Only opacity + y — no scale, which avoids repaints on children
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export const PageTransition = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ willChange: "opacity, transform" }}>
        
        {children}
      </motion.div>
    </AnimatePresence>);

};