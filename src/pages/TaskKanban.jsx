import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus, GripVertical, Clock, User, Calendar, Tag, X,
  CheckCircle, AlertTriangle, ArrowRight, Columns3
} from "lucide-react";
import { Navigate } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

const PRIORITY_MAP = {
  low: { label: "Low", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  high: { label: "High", color: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
};

const COLUMNS = [
  { id: "todo", title: "To Do", color: "border-blue-500", icon: Clock, iconColor: "text-blue-500" },
  { id: "progress", title: "In Progress", color: "border-amber-500", icon: ArrowRight, iconColor: "text-amber-500" },
  { id: "review", title: "In Review", color: "border-violet-500", icon: AlertTriangle, iconColor: "text-violet-500" },
  { id: "done", title: "Done", color: "border-emerald-500", icon: CheckCircle, iconColor: "text-emerald-500" },
];

const INITIAL_TASKS = [
  { id: "1", title: "ITR Filing - Rahul Sharma", client: "Rahul Sharma", assignee: "CA Ravi", priority: "high", dueDate: "Jan 15", service: "ITR Filing", column: "todo" },
  { id: "2", title: "GST Return - Priya Industries", client: "Priya Industries", assignee: "CA Meena", priority: "medium", dueDate: "Jan 20", service: "GST Returns", column: "todo" },
  { id: "3", title: "Audit Report - Tech Innovations", client: "Tech Innovations", assignee: "CA Amit", priority: "high", dueDate: "Jan 25", service: "Audit", column: "progress" },
  { id: "4", title: "Company Reg - Sunrise Hotels", client: "Sunrise Hotels", assignee: "CA Ravi", priority: "medium", dueDate: "Feb 01", service: "Registration", column: "progress" },
  { id: "5", title: "Tax Plan - Neha Kapoor", client: "Neha Kapoor", assignee: "CA Meena", priority: "low", dueDate: "Feb 10", service: "Tax Planning", column: "review" },
  { id: "6", title: "ITR Filing - Amit Verma", client: "Amit Verma", assignee: "CA Ravi", priority: "medium", dueDate: "Dec 20", service: "ITR Filing", column: "done" },
  { id: "7", title: "GST Reg - Green Earth", client: "Green Earth Exports", assignee: "CA Amit", priority: "low", dueDate: "Dec 15", service: "GST Registration", column: "done" },
  { id: "8", title: "TDS Return - Vikram Realty", client: "Vikram Realty", assignee: "CA Meena", priority: "high", dueDate: "Jan 10", service: "TDS Filing", column: "todo" },
];

function TaskCard({ task, onMove, onDelete }) {
  const priority = PRIORITY_MAP[task.priority];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-3.5 rounded-xl border border-border/50 bg-card hover:shadow-md transition-all group cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium leading-tight flex-1 pr-2">{task.title}</h4>
        <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priority.color}`}>{priority.label}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{task.service}</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><User className="w-3 h-3" />{task.assignee}</span>
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{task.dueDate}</span>
      </div>
      {/* Move buttons */}
      <div className="flex gap-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {COLUMNS.map(col => col.id !== task.column && (
          <button key={col.id} onClick={() => onMove(task.id, col.id)}
            className="flex-1 text-[10px] py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors font-medium">
            {col.title}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function TaskKanban() {
  const { role } = useAuth();
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", client: "", assignee: "CA Ravi", priority: "medium", dueDate: "", service: "ITR Filing" });

  const moveTask = useCallback((taskId, targetColumn) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, column: targetColumn } : t));
  }, []);

  const deleteTask = useCallback((taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const addTask = () => {
    if (!newTask.title) return;
    setTasks(prev => [...prev, { ...newTask, id: Date.now().toString(), column: "todo" }]);
    setNewTask({ title: "", client: "", assignee: "CA Ravi", priority: "medium", dueDate: "", service: "ITR Filing" });
    setShowAddForm(false);
  };

  // Guard must come AFTER all hooks to comply with React's rules of hooks
  const isStaff = role === "admin" || role === "ca";
  if (!isStaff) return <Navigate to="/dashboard" replace />;

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
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Button onClick={() => setShowAddForm(!showAddForm)} className="rounded-xl gap-2">
                  <Plus className="w-4 h-4" />Add Task
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Add Task Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-6">
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Task Title</Label>
                        <Input placeholder="e.g. ITR Filing - Client Name" value={newTask.title}
                          onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} className="premium-input" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Client</Label>
                        <Input placeholder="Client name" value={newTask.client}
                          onChange={e => setNewTask(p => ({ ...p, client: e.target.value }))} className="premium-input" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Assign To</Label>
                        <Select value={newTask.assignee} onValueChange={v => setNewTask(p => ({ ...p, assignee: v }))}>
                          <SelectTrigger className="premium-input"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CA Ravi">CA Ravi</SelectItem>
                            <SelectItem value="CA Meena">CA Meena</SelectItem>
                            <SelectItem value="CA Amit">CA Amit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Priority</Label>
                        <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v }))}>
                          <SelectTrigger className="premium-input"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Due Date</Label>
                        <Input type="date" value={newTask.dueDate}
                          onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} className="premium-input" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="rounded-xl">Cancel</Button>
                      <Button size="sm" onClick={addTask} className="rounded-xl gap-2"><Plus className="w-4 h-4" />Create</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kanban Board */}
        <section className="pb-16">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {COLUMNS.map((col) => {
                const Icon = col.icon;
                const columnTasks = tasks.filter(t => t.column === col.id);
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
                          <TaskCard key={task.id} task={task} onMove={moveTask} onDelete={deleteTask} />
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
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
