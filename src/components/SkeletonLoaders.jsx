import { motion } from "framer-motion";

export function SkeletonLine({ className = "h-4 w-full" }) {
  return (
    <div className={`bg-secondary/80 rounded-lg animate-pulse ${className}`} />
  );
}

export function SkeletonCard({ lines = 3, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-2xl border border-border/50 bg-card p-6 space-y-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary/80 animate-pulse" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-2/3" />
          <SkeletonLine className="h-3 w-1/3" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} className={`h-3 ${i === lines - 1 ? "w-3/4" : "w-full"}`} />
      ))}
    </motion.div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="rounded-2xl border border-border/50 overflow-hidden">
      <div className="bg-secondary/30 px-5 py-3 flex gap-4 border-b border-border/30">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="px-5 py-4 flex gap-4 border-b border-border/20 last:border-0">
          {Array.from({ length: cols }).map((_, col) => (
            <SkeletonLine key={col} className={`h-3 flex-1 ${col === 0 ? "w-1/2" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-secondary/80 animate-pulse" />
            <SkeletonLine className="h-3 w-1/2" />
            <SkeletonLine className="h-6 w-2/3" />
          </div>
        ))}
      </div>
      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={5} />
      </div>
      <SkeletonTable rows={3} cols={5} />
    </div>
  );
}
