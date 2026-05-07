/**
 * PageLoader — Premium shimmer skeleton for lazy-loaded pages.
 * 
 * Replaces the basic spinner with a branded skeleton layout
 * that mimics the page structure for a smoother perceived load.
 * 
 * Performance: Pure CSS animation (skeleton-shimmer), GPU-composited.
 */
export default function PageLoader() {
  return (
    <div className="min-h-[80vh] max-w-7xl mx-auto px-6 lg:px-12 pt-12" role="status" aria-label="Loading page">
      {/* Hero skeleton */}
      <div className="flex flex-col items-center gap-6 mb-16">
        {/* Badge */}
        <div className="skeleton-shimmer h-7 w-40 rounded-full" />

        {/* Headline lines */}
        <div className="flex flex-col items-center gap-3 w-full max-w-2xl">
          <div className="skeleton-shimmer h-10 md:h-14 w-[85%] rounded-xl" />
          <div className="skeleton-shimmer h-10 md:h-14 w-[65%] rounded-xl" />
        </div>

        {/* Subtitle */}
        <div className="flex flex-col items-center gap-2 w-full max-w-lg mt-2">
          <div className="skeleton-shimmer h-4 w-[90%] rounded-lg" />
          <div className="skeleton-shimmer h-4 w-[70%] rounded-lg" />
        </div>

        {/* CTA buttons */}
        <div className="flex gap-3 mt-4">
          <div className="skeleton-shimmer h-12 w-36 rounded-full" />
          <div className="skeleton-shimmer h-12 w-36 rounded-full" />
        </div>
      </div>

      {/* Content cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-4 p-8 rounded-2xl border border-border/30">
            <div className="skeleton-shimmer h-12 w-12 rounded-xl" />
            <div className="skeleton-shimmer h-5 w-[60%] rounded-lg" />
            <div className="skeleton-shimmer h-3 w-full rounded-md" />
            <div className="skeleton-shimmer h-3 w-[80%] rounded-md" />
          </div>
        ))}
      </div>

      {/* Animated spinner at center for additional feedback */}
      <div className="flex justify-center mt-8">
        <div className="relative w-8 h-8">
          <div
            className="absolute inset-0 rounded-full border-2 border-border"
            style={{ opacity: 0.15 }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin"
            aria-hidden="true"
          />
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
