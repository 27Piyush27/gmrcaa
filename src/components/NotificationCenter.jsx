import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellDot, X, Check, Clock, CheckCircle, CreditCard, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const NOTIFICATION_ICONS = {
  status_update: Clock,
  payment: CreditCard,
  completed: CheckCircle,
  alert: AlertCircle,
};

export function NotificationCenter() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    // Subscribe to realtime notifications
    if (!user) return;
    const channel = supabase
      .channel("user_notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-xl bg-secondary/60 border border-border/40 flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
      >
        {unreadCount > 0 ? <BellDot className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-80 z-50 rounded-2xl border border-border/60 bg-card shadow-float overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <h3 className="text-sm font-semibold">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notification => {
                    const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-border/20 hover:bg-secondary/30 transition-colors ${!notification.read ? "bg-accent/5" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!notification.read ? "bg-accent/10" : "bg-secondary"}`}>
                          <Icon className={`w-4 h-4 ${!notification.read ? "text-accent" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => markAsRead(notification.id)}>
                          <p className={`text-xs leading-snug ${!notification.read ? "font-medium" : "text-muted-foreground"}`}>
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(notification.created_at)}</p>
                        </div>
                        <button onClick={() => deleteNotification(notification.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
