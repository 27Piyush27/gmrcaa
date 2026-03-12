import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
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










const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-500" },
  in_progress: { label: "In Progress", color: "bg-blue-500" },
  completed: { label: "Ready to Pay", color: "bg-green-500" },
  paid: { label: "Paid", color: "bg-green-600" },
  cancelled: { label: "Cancelled", color: "bg-destructive" }
};

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchRecentRequests = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase.
    from("service_requests").
    select("id, service_id, status, progress, updated_at, services(name)").
    eq("user_id", user.id).
    order("updated_at", { ascending: false }).
    limit(10);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    
    const mapped = (data || []).map((r) => ({
      id: r.id,
      serviceId: r.service_id,
      serviceName: r.services?.name || r.service_id,
      status: r.status,
      progress: r.progress,
      updatedAt: r.updated_at
    }));

    setNotifications(mapped);
  }, [user]);

  useEffect(() => {
    fetchRecentRequests();
  }, [fetchRecentRequests]);

  // Listen for realtime updates to refresh notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase.
    channel(`notification-bell-${user.id}`).
    on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "service_requests",
        filter: `user_id=eq.${user.id}`
      },
      () => {
        fetchRecentRequests();
        setUnreadCount((prev) => prev + 1);
      }
    ).
    subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRecentRequests]);

  const handleOpen = (isOpen) => {
    setOpen(isOpen);
    if (isOpen) {
      setUnreadCount(0);
    }
  };

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
        <div className="border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          <p className="text-xs text-muted-foreground">
            Your recent service request updates
          </p>
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ?
          <div className="px-4 py-8 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div> :

          <div className="divide-y">
              {notifications.map((n) => {
              const config = STATUS_CONFIG[n.status] || {
                label: n.status,
                color: "bg-muted"
              };
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                  
                    <div
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      config.color
                    )} />
                  
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {n.serviceName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0">
                        
                          {config.label}
                        </Badge>
                        {n.progress > 0 && n.status !== "cancelled" &&
                      <span className="text-[10px] text-muted-foreground">
                            {n.progress}%
                          </span>
                      }
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatTime(n.updatedAt)}
                    </span>
                  </div>);

            })}
            </div>
          }
        </ScrollArea>
      </PopoverContent>
    </Popover>);

}