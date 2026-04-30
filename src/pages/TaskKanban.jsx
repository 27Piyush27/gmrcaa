import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, User, Calendar, Tag, ArrowRight, Columns3, CheckCircle, Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { resolveServiceName } from "@/lib/resolveServiceName";

const COLUMNS = [
  { id: "pending", title: "Pending", color: "border-amber-500", icon: Clock, iconColor: "text-amber-500" },
  { id: "in_progress", title: "In Progress", color: "border-blue-500", icon: ArrowRight, iconColor: "text-blue-500" },
  { id: "completed", title: "Completed", color: "border-emerald-500", icon: CheckCircle, iconColor: "text-emerald-500" },
  { id: "paid", title: "Paid", color: "border-violet-500", icon: Tag, iconColor: "text-violet-500" },
];

function TaskCard({ task, onMove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-3.5 rounded-xl border border-border/50 bg-card hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium leading-tight flex-1 pr-2">
          {resolveServiceName(task)}
        </h4>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
          {task.profiles?.name || "Unknown Client"}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {task.assigned_ca_profile?.name || "Unassigned"}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(task.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
        </span>
      </div>
      
      {/* Progress bar */}
      {typeof task.progress === "number" && task.status === "in_progress" && (
        <div className="mt-2.5 mb-1">
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${task.progress}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{task.progress}% Complete</p>
        </div>
      )}

      {/* Move buttons */}
      <div className="flex flex-wrap gap-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {COLUMNS.map(col => col.id !== task.status && (
          <button key={col.id} onClick={() => onMove(task.id, col.id)}
            className="flex-1 text-[10px] py-1 px-1 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors font-medium min-w-[20%]">
            Move to {col.title}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function TaskKanban() {
  const { user, role, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      let query = supabase.from("service_requests").select(`
        id, user_id, service_id, status, progress, notes,
        amount, document_url, assigned_ca, created_at, updated_at,
        services (name)
      `).order("created_at", { ascending: false });

      if (role === "ca") {
        query = query.eq("assigned_ca", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set((data || []).map((r) => r.user_id))];
      const { data: userProfiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);
      const userMap = new Map((userProfiles || []).map(p => [p.user_id, p]));

      // Fetch CA profiles
      const { data: caProfiles } = await supabase.from("profiles").select("user_id, name");
      const caMap = new Map((caProfiles || []).map(p => [p.user_id, p]));

      const enriched = (data || []).map(r => ({
        ...r,
        profiles: userMap.get(r.user_id) || null,
        assigned_ca_profile: caMap.get(r.assigned_ca) || null
      }));

      setTasks(enriched);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load task board");
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchTasks();
    }
  }, [user, authLoading, fetchTasks]);

  const moveTask = async (taskId, targetColumn) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetColumn } : t));
      const { error } = await supabase.from("service_requests")
        .update({ status: targetColumn })
        .eq("id", taskId);
      if (error) throw error;
      toast.success("Task status updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task status");
      fetchTasks();
    }
  };

  const isStaff = role === "admin" || role === "ca";
  if (!authLoading && !isStaff) return <Navigate to="/dashboard" replace />;

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-6 md:pt-36 md:pb-10 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-4">
                  <Columns3 className="w-3.5 h-3.5" /> Workflow
                </motion.div>
                <motion.h1 className="text-4xl sm:text-5xl font-semibold tracking-tight"
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  Task <span className="italic gradient-text-premium">Board</span>
                </motion.h1>
              </div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-2">
                <Button variant="outline" onClick={fetchTasks} className="rounded-xl gap-2">
                  <Clock className="w-4 h-4" /> Refresh
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Kanban Board */}
        <section className="pb-16">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {COLUMNS.map((col) => {
                  const Icon = col.icon;
                  const columnTasks = tasks.filter(t => t.status === col.id);
                  return (
                    <motion.div key={col.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: COLUMNS.indexOf(col) * 0.1 }}
                      className="flex flex-col">
                      <div className={`flex items-center gap-2 mb-4 pb-3 border-b-2 ${col.color}`}>
                        <Icon className={`w-4 h-4 ${col.iconColor}`} />
                        <h3 className="text-sm font-semibold">{col.title}</h3>
                        <Badge variant="secondary" className="ml-auto text-[11px] h-5 px-1.5">{columnTasks.length}</Badge>
                      </div>
                      <div className="flex flex-col gap-2.5 min-h-[200px]">
                        <AnimatePresence>
                          {columnTasks.map(task => (
                            <TaskCard key={task.id} task={task} onMove={moveTask} />
                          ))}
                        </AnimatePresence>
                        {columnTasks.length === 0 && (
                          <div className="flex-1 flex items-center justify-center p-8 rounded-xl border-2 border-dashed border-border/40 text-xs text-muted-foreground">
                            No tasks
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
