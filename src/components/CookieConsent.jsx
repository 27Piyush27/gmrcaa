import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50"
        >
          <div className="glass-frosted rounded-2xl p-5 shadow-float">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <Cookie className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1">Cookie Notice</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  We use essential cookies for authentication and session management to ensure a secure experience.
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={accept} className="h-8 text-xs rounded-lg px-4">Accept</Button>
                  <Button size="sm" variant="ghost" onClick={decline} className="h-8 text-xs rounded-lg px-4 text-muted-foreground">Decline</Button>
                </div>
              </div>
              <button onClick={decline} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
