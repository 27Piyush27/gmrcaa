import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Calendar, Clock, Video, Phone, MapPin, CheckCircle, XCircle, Loader2, CalendarDays, Users, ArrowLeft, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const easing = [0.22, 1, 0.36, 1];

const FILTERS = ["all", "pending", "confirmed", "cancelled", "completed"];

const TYPE_ICONS = {
  video:     { icon: Video,   label: "Video Call" },
  phone:     { icon: Phone,   label: "Phone Call" },
  in_person: { icon: MapPin,  label: "In Person"  },
};

const STATUS_STYLES = {
  pending:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200",
};

const TOPIC_LABELS = {
  "income-tax": "Income Tax Filing",
  "gst":        "GST Registration/Filing",
  "company":    "Company Incorporation",
  "audit":      "Audit & Compliance",
  "advisory":   "Tax Advisory",
  "other":      "Other",
};

export default function AppointmentManagement() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState(null); // track which appt is being updated

  // ── Guard: only CA/admin ──────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    // Wait until role has loaded (role !== null) before checking access
    if (!authLoading && user && role !== null && role !== "admin" && role !== "ca") {
      toast.error("Access denied");
      navigate("/dashboard");
    }
  }, [user, role, authLoading, navigate]);

  // ── Fetch appointments with client profiles ───────────────────────────────
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, user_id, date, time_slot, type, topic, notes, status, created_at")
        .order("date", { ascending: true });

      if (error) throw error;

      // Fetch profiles for client names
      const userIds = [...new Set((data || []).map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email, phone")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setAppointments((data || []).map(a => ({ ...a, profile: profileMap.get(a.user_id) || null })));
    } catch (err) {
      console.error("Error fetching appointments:", err);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user]);

  // ── Update appointment status ─────────────────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      toast.success(`Appointment ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update appointment");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = appointments.filter(a => filter === "all" || a.status === filter);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "all" ? appointments.length : appointments.filter(a => a.status === f).length;
    return acc;
  }, {});

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-foreground text-background py-10">
          <div className="container mx-auto px-6">
            <Button variant="ghost" onClick={() => navigate("/admin")}
              className="text-background/80 hover:text-background hover:bg-background/10 mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <CalendarDays className="h-6 w-6" />
              <h1 className="text-3xl font-semibold tracking-tight">Appointment Management</h1>
            </div>
            <p className="text-background/70">Confirm or cancel client consultation bookings.</p>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">

          {/* Stats / Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/50 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}>
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${filter === f ? "bg-background/20" : "bg-secondary"}`}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No {filter !== "all" ? filter : ""} appointments</p>
              </CardContent>
            </Card>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: easing }}
              className="space-y-3">
              {filtered.map((appt, i) => {
                const TypeIcon = TYPE_ICONS[appt.type]?.icon || CalendarDays;
                const typeLabel = TYPE_ICONS[appt.type]?.label || appt.type;
                const statusStyle = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;
                const isUpdating = updating === appt.id;
                const apptDate = new Date(appt.date + "T00:00:00");
                const isPast = apptDate < new Date(new Date().toDateString());

                return (
                  <motion.div key={appt.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.35, ease: easing }}>
                    <Card className="border-border/50 hover:border-border transition-colors">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          {/* Left: client + details */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle}`}>
                                {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                              </span>
                              {isPast && appt.status === "pending" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                  Past Date
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-sm">{appt.profile?.name || "Unknown Client"}</p>
                                <p className="text-xs text-muted-foreground">{appt.profile?.email}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {apptDate.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {appt.time_slot}
                              </span>
                              <span className="flex items-center gap-1">
                                <TypeIcon className="w-3.5 h-3.5" />
                                {typeLabel}
                              </span>
                            </div>

                            <p className="text-sm font-medium text-foreground">
                              {TOPIC_LABELS[appt.topic] || appt.topic}
                            </p>
                            {appt.notes && (
                              <p className="text-xs text-muted-foreground italic">"{appt.notes}"</p>
                            )}
                          </div>

                          {/* Right: action buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {appt.status === "pending" && (
                              <>
                                <Button size="sm" variant="outline"
                                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  disabled={isUpdating}
                                  onClick={() => updateStatus(appt.id, "cancelled")}>
                                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                  Cancel
                                </Button>
                                <Button size="sm"
                                  className="gap-1.5"
                                  disabled={isUpdating}
                                  onClick={() => updateStatus(appt.id, "confirmed")}>
                                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                  Confirm
                                </Button>
                              </>
                            )}
                            {appt.status === "confirmed" && (
                              <>
                                <Button size="sm" variant="outline"
                                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  disabled={isUpdating}
                                  onClick={() => updateStatus(appt.id, "cancelled")}>
                                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                  Cancel
                                </Button>
                                <Button size="sm" variant="outline"
                                  className="gap-1.5"
                                  disabled={isUpdating}
                                  onClick={() => updateStatus(appt.id, "completed")}>
                                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                  Mark Done
                                </Button>
                              </>
                            )}
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
      </div>
    </PageTransition>
  );
}
