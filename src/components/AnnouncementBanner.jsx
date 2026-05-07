import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Megaphone } from "lucide-react";

const ANNOUNCEMENT = {
  id: "ann-1",
  message: "🎉 New: Book online consultations with our CAs! Schedule your appointment today.",
  link: "/appointments",
  type: "info",
};

const bgColor = {
  info: "bg-blue-700 text-white",
  warning: "bg-amber-600 text-white",
  success: "bg-emerald-600 text-white",
};

// Check dismissal synchronously to prevent CLS
function wasDismissed(id) {
  try { return localStorage.getItem(`dismissed_${id}`) === "true"; } catch { return false; }
}

export function AnnouncementBanner() {
  // Initialize synchronously — no layout shift
  const [visible, setVisible] = useState(() => !wasDismissed(ANNOUNCEMENT.id));

  const dismiss = () => {
    try {
      localStorage.setItem(`dismissed_${ANNOUNCEMENT.id}`, "true");
    } catch (e) {
      console.warn("Failed to save dismissal state:", e);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={`relative z-[60] ${bgColor[ANNOUNCEMENT.type]}`}
      role="banner"
      aria-label="Announcement"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-2 flex items-center justify-center gap-3">
        <Megaphone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs md:text-sm font-medium text-center text-white">
          {ANNOUNCEMENT.message}
          {ANNOUNCEMENT.link && (
            <a href={ANNOUNCEMENT.link} className="underline ml-1 font-bold text-white hover:text-white/90">
              Learn more →
            </a>
          )}
        </p>
        <button onClick={dismiss} className="ml-3 hover:opacity-80 flex-shrink-0 text-white" aria-label="Dismiss announcement">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
