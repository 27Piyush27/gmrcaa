import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Megaphone, Bell } from "lucide-react";

export function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    // This would normally fetch from Supabase - using a static announcement for demo
    const staticAnnouncement = {
      id: "ann-1",
      message: "🎉 New: Book online consultations with our CAs! Schedule your appointment today.",
      link: "/appointments",
      type: "info" // info, warning, success
    };

    const dismissed = localStorage.getItem(`dismissed_${staticAnnouncement.id}`);
    if (!dismissed) {
      setAnnouncement(staticAnnouncement);
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    if (announcement) {
      localStorage.setItem(`dismissed_${announcement.id}`, "true");
    }
    setVisible(false);
  };

  const bgColor = {
    info: "bg-accent text-white",
    warning: "bg-amber-500 text-white",
    success: "bg-emerald-500 text-white",
  };

  return (
    <AnimatePresence>
      {visible && announcement && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`relative z-[60] overflow-hidden ${bgColor[announcement.type] || bgColor.info}`}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-2 flex items-center justify-center gap-3">
            <Megaphone className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs md:text-sm font-medium text-center">
              {announcement.message}
              {announcement.link && (
                <a href={announcement.link} className="underline ml-1 font-bold hover:opacity-80">Learn more →</a>
              )}
            </p>
            <button onClick={dismiss} className="ml-3 opacity-70 hover:opacity-100 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
