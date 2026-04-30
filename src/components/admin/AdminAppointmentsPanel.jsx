import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Calendar, Clock, CheckCircle, XCircle, Loader2, CalendarDays,
  Search, Trash2, Download, Phone, Mail, Briefcase, Video, MapPin,
  ChevronLeft, ChevronRight, Ban, Plus, User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TIME_SLOTS } from "@/components/BookConsultationDialog";

const easing = [0.22, 1, 0.36, 1];
const TABS = ["all", "today", "upcoming", "pending", "confirmed", "completed", "cancelled"];

const STATUS_STYLES = {
  pending:     "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200",
  scheduled:   "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200",
  confirmed:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
  cancelled:   "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200",
  completed:   "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200",
  rescheduled: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200",
};

const MEETING_ICONS = {
  video: Video, phone: Phone, "in-person": MapPin,
};

const STATUS_TRANSITIONS = {
  pending:     ["confirmed", "cancelled"],
  scheduled:   ["confirmed", "cancelled"],
  confirmed:   ["completed", "cancelled"],
  rescheduled: ["confirmed", "cancelled"],
  cancelled:   [],
  completed:   [],
};

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function getTimeLabel(slot) {
  return TIME_SLOTS.find(s => s.value === slot)?.label || slot || "";
}

export default function AdminAppointmentsPanel() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [view, setView] = useState("list");
  const [calMonth, setCalMonth] = useState(new Date());

  const todayStr = new Date().toISOString().split("T")[0];

  // ── Fetch ──
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: false });
      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchAppointments(); }, [user]);

  // ── Update status + notify ──
  const updateStatus = async (appt, newStatus) => {
    setUpdating(appt.id);
    try {
      const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", appt.id);
      if (error) throw error;
      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: newStatus } : a));
      toast.success(`Appointment ${newStatus}`);

      // Send notification if client has user_id
      if (appt.user_id) {
        try {
          await supabase.from("notifications").insert({
            user_id: appt.user_id,
            title: `Appointment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
            message: `Your appointment on ${formatDate(appt.appointment_date)} at ${getTimeLabel(appt.time_slot)} has been ${newStatus}.`,
            type: "service_update",
          });
        } catch (e) { console.warn("Notification insert failed:", e); }
      }
    } catch { toast.error("Failed to update"); }
    finally { setUpdating(null); }
  };

  // ── Delete ──
  const deleteAppointment = async (id) => {
    if (!confirm("Delete this appointment?")) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
      setAppointments(prev => prev.filter(a => a.id !== id));
      toast.success("Deleted");
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(null); }
  };

  // ── CSV Export ──
  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Service", "Date", "Time", "Type", "Status", "Notes", "Booked"];
    const rows = filtered.map(a => [
      a.full_name || "", a.email || "", a.phone || "", a.service_type || "",
      a.appointment_date ? new Date(a.appointment_date).toLocaleDateString() : "",
      getTimeLabel(a.time_slot), a.meeting_type || "", a.status || "",
      (a.notes || "").replace(/,/g, ";"),
      a.created_at ? new Date(a.created_at).toLocaleDateString() : "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `appointments_${todayStr}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  // ── Filter ──
  const filtered = useMemo(() => {
    let list = appointments;
    if (tab === "today") list = list.filter(a => a.appointment_date && new Date(a.appointment_date).toISOString().split("T")[0] === todayStr);
    else if (tab === "upcoming") list = list.filter(a => a.appointment_date && new Date(a.appointment_date) >= new Date(todayStr));
    else if (tab !== "all") list = list.filter(a => a.status === tab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        (a.full_name || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q) ||
        (a.phone || "").includes(q) ||
        (a.service_type || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [appointments, tab, searchQuery, todayStr]);

  const counts = useMemo(() => {
    const c = { all: appointments.length };
    c.today = appointments.filter(a => a.appointment_date && new Date(a.appointment_date).toISOString().split("T")[0] === todayStr).length;
    c.upcoming = appointments.filter(a => a.appointment_date && new Date(a.appointment_date) >= new Date(todayStr)).length;
    ["pending", "confirmed", "completed", "cancelled"].forEach(s => {
      c[s] = appointments.filter(a => a.status === s).length;
    });
    return c;
  }, [appointments, todayStr]);

  // ── Calendar ──
  const calDays = useMemo(() => {
    const year = calMonth.getFullYear(), month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calMonth]);

  const appointmentsByDate = useMemo(() => {
    const map = {};
    appointments.forEach(a => {
      if (!a.appointment_date) return;
      const key = new Date(a.appointment_date).toISOString().split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, phone, service..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-10 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <Button variant={view === "calendar" ? "default" : "outline"} size="sm"
            className="rounded-xl h-10 gap-1.5 text-xs"
            onClick={() => setView(view === "list" ? "calendar" : "list")}>
            <Calendar className="w-3.5 h-3.5" /> {view === "list" ? "Calendar" : "List"}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-xl h-10 gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium capitalize transition-all ${
              tab === t ? "bg-foreground text-background border-foreground" : "border-border/50 text-muted-foreground hover:border-foreground/30"
            }`}>
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            <span className={`ml-1.5 px-1 py-0.5 rounded-full text-[10px] ${tab === t ? "bg-background/20" : "bg-secondary"}`}>
              {counts[t] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {view === "calendar" && (
        <Card className="border-border/40">
          <div className="flex items-center justify-between p-4 pb-2">
            <Button variant="ghost" size="sm" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="text-sm font-medium">{calMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
            <Button variant="ghost" size="sm" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calDays.map((day, i) => {
                if (day === null) return <div key={`e${i}`} />;
                const dateStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayAppts = appointmentsByDate[dateStr] || [];
                const isToday = dateStr === todayStr;
                return (
                  <div key={day} className={`min-h-[56px] p-1 rounded-lg border text-xs ${
                    isToday ? "border-foreground/40 bg-foreground/5" : "border-border/20"
                  }`}>
                    <span className={`text-[11px] font-medium ${isToday ? "text-foreground" : "text-muted-foreground"}`}>{day}</span>
                    {dayAppts.slice(0, 2).map(a => (
                      <div key={a.id} className={`rounded px-1 py-0.5 text-[9px] font-medium mb-0.5 truncate border ${STATUS_STYLES[a.status]?.split(" ").slice(0, 3).join(" ") || ""}`}>
                        {getTimeLabel(a.time_slot)} · {(a.full_name || "").split(" ")[0] || "Client"}
                      </div>
                    ))}
                    {dayAppts.length > 2 && <span className="text-[9px] text-muted-foreground">+{dayAppts.length - 2}</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No appointments found</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
          <p className="text-xs text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
          {filtered.map((appt, i) => {
            const MeetingIcon = MEETING_ICONS[appt.meeting_type] || CalendarDays;
            const actions = STATUS_TRANSITIONS[appt.status] || [];
            const isUpdating = updating === appt.id;
            const isDeleting = deleting === appt.id;

            return (
              <motion.div key={appt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025, duration: 0.3, ease: easing }}>
                <Card className="border-border/40 hover:border-border/60 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        {/* Status + service */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_STYLES[appt.status] || STATUS_STYLES.pending}`}>
                            {(appt.status || "pending").charAt(0).toUpperCase() + (appt.status || "pending").slice(1)}
                          </span>
                          {appt.service_type && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-secondary border border-border/30">
                              <Briefcase className="w-2.5 h-2.5" />{appt.service_type}
                            </span>
                          )}
                          {appt.meeting_type && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MeetingIcon className="w-3 h-3" />{appt.meeting_type}
                            </span>
                          )}
                        </div>

                        {/* Client */}
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                            {(appt.full_name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{appt.full_name || "Unknown"}</p>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              {appt.email && <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{appt.email}</span>}
                              {appt.phone && <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{appt.phone}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Date/Time */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(appt.appointment_date)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{getTimeLabel(appt.time_slot)}</span>
                          {appt.duration_minutes && <span>({appt.duration_minutes} min)</span>}
                        </div>

                        {appt.notes && <p className="text-[11px] text-muted-foreground italic truncate max-w-md">"{appt.notes}"</p>}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                        {actions.includes("confirmed") && (
                          <Button size="sm" className="gap-1 rounded-xl h-7 text-[11px] px-2.5" disabled={isUpdating}
                            onClick={() => updateStatus(appt, "confirmed")}>
                            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Confirm
                          </Button>
                        )}
                        {actions.includes("completed") && (
                          <Button size="sm" variant="outline" className="gap-1 rounded-xl h-7 text-[11px] px-2.5" disabled={isUpdating}
                            onClick={() => updateStatus(appt, "completed")}>
                            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Done
                          </Button>
                        )}
                        {actions.includes("cancelled") && (
                          <Button size="sm" variant="outline"
                            className="gap-1 rounded-xl h-7 text-[11px] px-2.5 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                            disabled={isUpdating} onClick={() => updateStatus(appt, "cancelled")}>
                            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Cancel
                          </Button>
                        )}
                        <Button size="sm" variant="ghost"
                          className="rounded-xl h-7 text-[11px] px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          disabled={isDeleting} onClick={() => deleteAppointment(appt.id)}>
                          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
