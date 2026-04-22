/**
 * PageLoader — Lightweight loading spinner for lazy-loaded pages.
 * Pure CSS animation, no JS library overhead. GPU-composited only.
 */
export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative w-10 h-10">
        <div
          className="absolute inset-0 rounded-full border-2 border-border"
          style={{ opacity: 0.2 }}
        />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent"
          style={{
            animation: "spin 0.7s linear infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
