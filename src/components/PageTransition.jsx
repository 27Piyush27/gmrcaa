import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";

/*
 * PageTransition — Enhanced 2026 version
 * 
 * Two-layer transition:
 * 1. Opacity crossfade on content (zero CLS)
 * 2. A brief wipe overlay for visual "premium" feel
 *
 * Performance notes:
 * - Only transform + opacity are animated (GPU-composited)
 * - Wipe overlay uses scaleX (no layout thrash)
 * - Overlay is display:none when inactive to avoid paint
 * - Respects prefers-reduced-motion via CSS
 */

const ease = [0.22, 1, 0.36, 1];

// Content variants — opacity + subtle y movement (small enough to avoid CLS)
const pageVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.35,
      ease,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease,
    },
  },
};

// Wipe overlay variants — horizontal reveal
const wipeVariants = {
  initial: {
    scaleX: 0,
  },
  enter: {
    scaleX: [0, 1, 1, 0],
    transition: {
      duration: 0.55,
      ease: [0.77, 0, 0.175, 1],
      times: [0, 0.45, 0.55, 1],
    },
  },
};

export const PageTransition = ({ children }) => {
  const location = useLocation();
  const [showWipe, setShowWipe] = useState(false);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      // Check reduced motion preference
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!prefersReduced) {
        setShowWipe(true);
        const timer = setTimeout(() => setShowWipe(false), 600);
        return () => clearTimeout(timer);
      }
    }
    prevPath.current = location.pathname;
  }, [location.pathname]);

  return (
    <>
      {/* Wipe overlay — GPU-composited scaleX only */}
      <AnimatePresence>
        {showWipe && (
          <motion.div
            key="wipe"
            variants={wipeVariants}
            initial="initial"
            animate="enter"
            className="fixed inset-0 z-[9998] pointer-events-none"
            style={{
              background: "hsl(var(--foreground))",
              transformOrigin: "left",
              willChange: "transform",
            }}
          />
        )}
      </AnimatePresence>

      {/* Content with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ willChange: "opacity" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
};