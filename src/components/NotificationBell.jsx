import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from
"@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
  service_update:     { color: "bg-blue-500" },
  payment_received:   { color: "bg-green-600" },
  document_uploaded:  { color: "bg-violet-500" },
  document_reviewed:  { color: "bg-teal-500" },
  system:             { color: "bg-yellow-500" },
  chat:               { color: "bg-orange-400" },
};

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  // ── Fetch from the real notifications table ─────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }
    setNotifications(data || []);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Realtime subscription on notifications table ────────────────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notif-bell-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => { fetchNotifications(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  // ── Mark all as read ─────────────────────────────────────────────────────
  const markAllRead = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase
      .from("notifications")
      .update({ read: true, read_at: now })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: now })));
  };

  const handleOpen = (isOpen) => {
    setOpen(isOpen);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 &&
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Notifications</h4>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={markAllRead}>
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ?
          <div className="px-4 py-8 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div> :

          <div className="divide-y">
              {notifications.map((n) => {
              const config = TYPE_CONFIG[n.type] || { color: "bg-muted" };
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                    !n.read && "bg-muted/30"
                  )}>
                  
                    <div
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      config.color
                    )} />
                  
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm truncate", !n.read && "font-semibold")}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatTime(n.created_at)}
                    </span>
                  </div>);

            })}
            </div>
          }
        </ScrollArea>
      </PopoverContent>
    </Popover>);

}