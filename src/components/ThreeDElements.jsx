import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { useRef, useCallback, useMemo } from "react";

const ease = [0.22, 1, 0.36, 1];

// ─── Floating 3D Cube ────────────────────────────────────────────────────────
// A CSS 3D cube that slowly rotates in space with ambient glow
export function FloatingCube({
  size = 60,
  className = "",
  color = "hsl(var(--accent))",
  delay = 0,
  duration = 20,
  opacity = 0.12,
}) {
  const half = size / 2;
  const faces = useMemo(() => [
    { transform: `rotateY(0deg) translateZ(${half}px)` },
    { transform: `rotateY(90deg) translateZ(${half}px)` },
    { transform: `rotateY(180deg) translateZ(${half}px)` },
    { transform: `rotateY(-90deg) translateZ(${half}px)` },
    { transform: `rotateX(90deg) translateZ(${half}px)` },
    { transform: `rotateX(-90deg) translateZ(${half}px)` },
  ], [half]);

  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay, ease }}
    >
      <div
        className="three-d-cube"
        style={{
          width: size,
          height: size,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        }}
      >
        {faces.map((face, i) => (
          <div
            key={i}
            className="three-d-cube-face"
            style={{
              width: size,
              height: size,
              transform: face.transform,
              background: `linear-gradient(135deg, ${color} 0%, transparent 60%)`,
              opacity,
              border: `1px solid ${color}`,
              borderColor: `${color}`,
              borderWidth: "1px",
              borderStyle: "solid",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Floating 3D Octahedron (Diamond shape) ──────────────────────────────────
export function FloatingOctahedron({
  size = 50,
  className = "",
  color = "hsl(211 100% 50%)",
  delay = 0,
  duration = 25,
}) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, delay, ease }}
    >
      <div
        className="three-d-octahedron"
        style={{
          width: size,
          height: size,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        }}
      >
        {/* Top pyramid */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={`top-${i}`}
            className="three-d-octa-face"
            style={{
              width: 0, height: 0,
              borderLeft: `${size / 2}px solid transparent`,
              borderRight: `${size / 2}px solid transparent`,
              borderBottom: `${size * 0.7}px solid ${color}`,
              opacity: 0.08 + i * 0.03,
              position: "absolute",
              top: "50%",
              left: "50%",
              transformOrigin: `0 ${size * 0.7}px`,
              transform: `translate(-50%, -100%) rotateY(${i * 90}deg) rotateX(35deg)`,
            }}
          />
        ))}
        {/* Bottom pyramid (inverted) */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={`bot-${i}`}
            className="three-d-octa-face"
            style={{
              width: 0, height: 0,
              borderLeft: `${size / 2}px solid transparent`,
              borderRight: `${size / 2}px solid transparent`,
              borderTop: `${size * 0.7}px solid ${color}`,
              opacity: 0.06 + i * 0.02,
              position: "absolute",
              top: "50%",
              left: "50%",
              transformOrigin: `0 0`,
              transform: `translate(-50%, 0%) rotateY(${i * 90 + 45}deg) rotateX(-35deg)`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── 3D Rotating Ring ────────────────────────────────────────────────────────
// An orbit-like ring that rotates in 3D perspective
export function FloatingRing({
  size = 120,
  className = "",
  color = "hsl(var(--accent))",
  delay = 0,
  duration = 15,
  strokeWidth = 1.5,
  opacity = 0.15,
}) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay, ease }}
    >
      <div
        className="three-d-ring"
        style={{
          width: size,
          height: size,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient id={`ring-grad-${delay}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={opacity} />
              <stop offset="50%" stopColor={color} stopOpacity={opacity * 2.5} />
              <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.5} />
            </linearGradient>
          </defs>
          <ellipse
            cx="50" cy="50" rx="45" ry="45"
            fill="none"
            stroke={`url(#ring-grad-${delay})`}
            strokeWidth={strokeWidth}
            strokeDasharray="8 4"
          />
        </svg>
      </div>
    </motion.div>
  );
}

// ─── 3D Floating Sphere ─────────────────────────────────────────────────────
// A glowing orb with CSS gradient to simulate 3D spherical lighting
export function FloatingSphere({
  size = 80,
  className = "",
  color = "hsl(var(--accent))",
  delay = 0,
  glowIntensity = 0.12,
}) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay, ease, type: "spring", stiffness: 100 }}
    >
      <div
        className="three-d-sphere animate-float"
        style={{
          width: size,
          height: size,
          animationDelay: `${delay}s`,
          background: `
            radial-gradient(circle at 30% 30%, 
              hsl(0 0% 100% / 0.3) 0%, 
              ${color} 20%, 
              transparent 70%
            )
          `,
          opacity: glowIntensity,
          borderRadius: "50%",
          boxShadow: `
            inset -${size * 0.15}px -${size * 0.15}px ${size * 0.3}px rgba(0,0,0,0.3),
            0 0 ${size * 0.6}px ${color}
          `,
        }}
      />
    </motion.div>
  );
}

// ─── 3D Parallax Layer System ────────────────────────────────────────────────
// Creates depth by moving child elements at different scroll speeds
export function ParallaxDepthLayer({ children, className = "", depth = 0.5, direction = "up" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const factor = direction === "up" ? -1 : 1;
  const y = useTransform(scrollYProgress, [0, 1], [factor * depth * 100, factor * depth * -100]);
  const rotate = useTransform(scrollYProgress, [0, 1], [depth * -5, depth * 5]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div
        style={{
          y,
          rotateZ: rotate,
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── 3D Tilt Card (Enhanced) ─────────────────────────────────────────────────
// Mouse-tracking perspective tilt with lighting effect
export function Tilt3DCard({
  children,
  className = "",
  tiltStrength = 8,
  glareEnabled = true,
}) {
  const ref = useRef(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [tiltStrength, -tiltStrength]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-tiltStrength, tiltStrength]), { stiffness: 300, damping: 30 });

  // Glare position — hooks must be called unconditionally
  const glareX = useTransform(x, [0, 1], [0, 100]);
  const glareY = useTransform(y, [0, 1], [0, 100]);
  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, hsl(0 0% 100% / 0.06) 0%, transparent 60%)`
  );

  const handleMouseMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0.5);
    y.set(0.5);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1200,
      }}
      className={`relative ${className}`}
    >
      {children}
      {glareEnabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{
            background: glareBackground,
          }}
        />
      )}
    </motion.div>
  );
}

// ─── 3D Isometric Grid ──────────────────────────────────────────────────────
// Decorative isometric grid lines, think Stripe/Linear style
export function IsometricGrid({
  className = "",
  rows = 6,
  cols = 8,
  cellSize = 40,
  opacity = 0.06,
}) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, delay: 0.5 }}
    >
      <svg
        width={cols * cellSize}
        height={rows * cellSize}
        viewBox={`0 0 ${cols * cellSize} ${rows * cellSize}`}
        style={{
          transform: "rotateX(60deg) rotateZ(-45deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Horizontal lines */}
        {Array.from({ length: rows + 1 }).map((_, i) => (
          <motion.line
            key={`h-${i}`}
            x1={0}
            y1={i * cellSize}
            x2={cols * cellSize}
            y2={i * cellSize}
            stroke="hsl(var(--accent))"
            strokeWidth={0.5}
            opacity={opacity}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: i * 0.08 }}
          />
        ))}
        {/* Vertical lines */}
        {Array.from({ length: cols + 1 }).map((_, i) => (
          <motion.line
            key={`v-${i}`}
            x1={i * cellSize}
            y1={0}
            x2={i * cellSize}
            y2={rows * cellSize}
            stroke="hsl(var(--accent))"
            strokeWidth={0.5}
            opacity={opacity}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.5 + i * 0.06 }}
          />
        ))}
        {/* Intersection dots */}
        {Array.from({ length: (rows + 1) * (cols + 1) }).map((_, idx) => {
          const r = Math.floor(idx / (cols + 1));
          const c = idx % (cols + 1);
          return (
            <motion.circle
              key={`d-${idx}`}
              cx={c * cellSize}
              cy={r * cellSize}
              r={1.5}
              fill="hsl(var(--accent))"
              opacity={opacity * 1.5}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 1.5 + idx * 0.01 }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

// ─── 3D Rotating Emblem ─────────────────────────────────────────────────────
// Decorative rotating emblem with nested 3D layers
export function RotatingEmblem({
  size = 200,
  className = "",
}) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, ease }}
    >
      <div
        style={{
          width: size,
          height: size,
          transformStyle: "preserve-3d",
          perspective: 800,
        }}
      >
        {/* Outer ring */}
        <div
          className="three-d-emblem-ring"
          style={{
            width: size,
            height: size,
            border: "1.5px solid hsl(var(--accent) / 0.15)",
            borderRadius: "50%",
            position: "absolute",
            animationDuration: "30s",
          }}
        />
        {/* Middle ring – tilted */}
        <div
          className="three-d-emblem-ring"
          style={{
            width: size * 0.75,
            height: size * 0.75,
            border: "1px solid hsl(var(--accent) / 0.1)",
            borderRadius: "50%",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotateX(60deg)",
            animationDuration: "25s",
            animationDirection: "reverse",
          }}
        />
        {/* Inner ring – differently tilted */}
        <div
          className="three-d-emblem-ring"
          style={{
            width: size * 0.5,
            height: size * 0.5,
            border: "1px solid hsl(var(--accent) / 0.08)",
            borderRadius: "50%",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotateY(60deg)",
            animationDuration: "20s",
          }}
        />
        {/* Center glow */}
        <div
          style={{
            width: size * 0.15,
            height: size * 0.15,
            borderRadius: "50%",
            background: "radial-gradient(circle, hsl(var(--accent) / 0.3) 0%, transparent 70%)",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </motion.div>
  );
}

// ─── 3D Floating Dots Field ─────────────────────────────────────────────────
// Scattered floating dots with depth to create a starfield-like 3D ambience
export function FloatingDots({
  count = 20,
  className = "",
  color = "hsl(var(--accent))",
  spread = 400,
}) {
  const dots = useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      x: Math.random() * spread,
      y: Math.random() * spread,
      z: Math.random() * 100,
      size: 1 + Math.random() * 3,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
    })),
    [count, spread]
  );

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        width: spread,
        height: spread,
        perspective: 600,
        transformStyle: "preserve-3d",
      }}
    >
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: dot.size,
            height: dot.size,
            left: dot.x,
            top: dot.y,
            backgroundColor: color,
            opacity: 0.1 + (dot.z / 100) * 0.2,
            transform: `translateZ(${dot.z}px)`,
          }}
          animate={{
            y: [0, -10 - Math.random() * 15, 0],
            opacity: [0.08, 0.25, 0.08],
          }}
          transition={{
            duration: dot.duration,
            delay: dot.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
