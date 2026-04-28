import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CalendarDays, Clock, Video, Phone, MapPin, ArrowLeft,
  Loader2, XCircle, CheckCircle, Calendar, Plus, Filter, ExternalLink, Download
} from "lucide-react";
import { buildGoogleCalendarUrl, downloadIcsFile } from "@/lib/googleCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const easing = [0.22, 1, 0.36, 1];

const FILTERS = ["all", "pending", "confirmed", "cancelled", "completed"];

const TYPE_ICONS = {
  video:     { icon: Video,  label: "Video Call" },
  phone:     { icon: Phone,  label: "Phone Call" },
  in_person: { icon: MapPin, label: "In Person"  },
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

export default function MyAppointments() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, navigate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, date, time_slot, type, topic, notes, status, created_at")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
      toast.success("Appointment cancelled");
    } catch {
      toast.error("Failed to cancel appointment");
    } finally {
      setCancelling(null);
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
            <Button variant="ghost" onClick={() => navigate("/dashboard")}
              className="text-background/80 hover:text-background hover:bg-background/10 mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CalendarDays className="h-6 w-6" />
                  <h1 className="text-3xl font-semibold tracking-tight">My Appointments</h1>
                </div>
                <p className="text-background/70">View and manage your consultation bookings.</p>
              </div>
              <Button onClick={() => navigate("/appointments")}
                className="gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-background">
                <Plus className="w-4 h-4" /> Book New
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* Filter tabs */}
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
                <p className="text-muted-foreground mb-4">
                  {filter !== "all" ? `No ${filter} appointments` : "You haven't booked any appointments yet."}
                </p>
                {filter === "all" && (
                  <Button onClick={() => navigate("/appointments")} className="rounded-xl gap-2">
                    <Plus className="w-4 h-4" /> Book Consultation
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: easing }} className="space-y-3">
              {filtered.map((appt, i) => {
                const TypeIcon = TYPE_ICONS[appt.type]?.icon || CalendarDays;
                const typeLabel = TYPE_ICONS[appt.type]?.label || appt.type;
                const statusStyle = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;
                const isCancelling = cancelling === appt.id;
                const apptDate = new Date(appt.date + "T00:00:00");
                const isPast = apptDate < new Date(new Date().toDateString());

                return (
                  <motion.div key={appt.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.35, ease: easing }}>
                    <Card className="border-border/50 hover:border-border transition-colors">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                            <p className="text-sm font-medium text-foreground">
                              {TOPIC_LABELS[appt.topic] || appt.topic}
                            </p>

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

                            {appt.notes && (
                              <p className="text-xs text-muted-foreground italic">"{appt.notes}"</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {(appt.status === "pending" || appt.status === "confirmed") && (
                              <>
                                <Button size="sm" variant="outline" asChild
                                  className="gap-1.5 text-xs h-8 rounded-lg">
                                  <a href={buildGoogleCalendarUrl({
                                    date: appt.date,
                                    time: appt.time_slot,
                                    type: appt.type,
                                    topic: appt.topic,
                                    notes: appt.notes || "",
                                  })} target="_blank" rel="noopener noreferrer">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    Add to Calendar
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </Button>
                                <Button size="sm" variant="outline"
                                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 rounded-lg"
                                  disabled={isCancelling}
                                  onClick={() => handleCancel(appt.id)}>
                                  {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                  Cancel
                                </Button>
                              </>
                            )}
                            {appt.status === "confirmed" && (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                <CheckCircle className="w-3.5 h-3.5" /> Confirmed
                              </span>
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
