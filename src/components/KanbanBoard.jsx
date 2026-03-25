import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, ArrowRight, User, Calendar } from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  in_progress: "bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
  completed: "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  paid: "bg-violet-100 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800",
  cancelled: "bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-800",
};

const STATUS_HEADERS = {
  pending: { label: "Pending", icon: "🟡", color: "text-amber-700 dark:text-amber-400" },
  in_progress: { label: "In Progress", icon: "🔵", color: "text-blue-700 dark:text-blue-400" },
  completed: { label: "Completed", icon: "🟢", color: "text-emerald-700 dark:text-emerald-400" },
  paid: { label: "Paid", icon: "🟣", color: "text-violet-700 dark:text-violet-400" },
  cancelled: { label: "Cancelled", icon: "🔴", color: "text-red-700 dark:text-red-400" },
};

const PRIORITY_BADGES = {
  urgent: "bg-red-500 text-white",
  high: "bg-amber-500 text-white",
  normal: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  low: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

export function KanbanBoard({ requests = [], onSelectRequest }) {
  const columns = useMemo(() => {
    const cols = {};
    ["pending", "in_progress", "completed", "paid"].forEach(status => {
      cols[status] = requests.filter(r => r.status === status);
    });
    return cols;
  }, [requests]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[400px]">
      {Object.entries(columns).map(([status, items]) => {
        const header = STATUS_HEADERS[status];
        return (
          <div key={status} className="flex flex-col">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span>{header.icon}</span>
                <span className={`text-sm font-semibold ${header.color}`}>{header.label}</span>
              </div>
              <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                {items.length}
              </span>
            </div>

            {/* Column Body */}
            <div className={`flex-1 rounded-xl border ${STATUS_COLORS[status]} p-2 space-y-2 min-h-[200px]`}>
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No requests</p>
              ) : (
                items.map((req, index) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onSelectRequest?.(req)}
                    className="bg-card p-3 rounded-lg border border-border/50 cursor-pointer hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-xs font-medium leading-snug line-clamp-2">
                        {req.services?.name || req.service_id}
                      </h4>
                      {req.priority && req.priority !== "normal" && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${PRIORITY_BADGES[req.priority] || ""}`}>
                          {req.priority}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {typeof req.progress === "number" && status === "in_progress" && (
                      <div className="mb-2">
                        <div className="h-1 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${req.progress}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{req.progress}%</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {req.due_date && (
                        <span className={`flex items-center gap-0.5 ${new Date(req.due_date) < new Date() ? "text-red-500 font-medium" : ""}`}>
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(req.due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      {req.amount && (
                        <span>₹{Number(req.amount).toLocaleString("en-IN")}</span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
