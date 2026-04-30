import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CalendarDays, Clock, ArrowLeft, Loader2, XCircle, CheckCircle,
  Calendar, Plus, Video, Phone, MapPin, Briefcase
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TIME_SLOTS } from "@/components/BookConsultationDialog";

const easing = [0.22, 1, 0.36, 1];
const FILTERS = ["all", "pending", "confirmed", "cancelled", "completed"];

const STATUS_CONFIG = {
  pending:     { label: "Pending",     variant: "outline" },
  scheduled:   { label: "Scheduled",   variant: "default" },
  confirmed:   { label: "Confirmed",   variant: "default" },
  completed:   { label: "Completed",   variant: "secondary" },
  cancelled:   { label: "Cancelled",   variant: "destructive" },
  rescheduled: { label: "Rescheduled", variant: "outline" },
};

const MEETING_ICONS = {
  video: Video, phone: Phone, "in-person": MapPin,
};

function getTimeLabel(slot) {
  return TIME_SLOTS.find(s => s.value === slot)?.label || slot || "";
}

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
  }, [user, authLoading, navigate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
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

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
      toast.success("Appointment cancelled");
    } catch { toast.error("Failed to cancel"); }
    finally { setCancelling(null); }
  };

  const filtered = appointments.filter(a => filter === "all" || a.status === filter);
  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "all" ? appointments.length : appointments.filter(a => a.status === f).length;
    return acc;
  }, {});

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
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
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium capitalize transition-all duration-200 ${
                  filter === f ? "bg-foreground text-background border-foreground" : "border-border/50 text-muted-foreground hover:border-foreground/30"
                }`}>
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${filter === f ? "bg-background/20" : "bg-secondary"}`}>{counts[f]}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{filter !== "all" ? `No ${filter} appointments` : "No appointments yet."}</p>
                {filter === "all" && (
                  <Button onClick={() => navigate("/appointments")} className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Book Consultation</Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {filtered.map((appt, i) => {
                const MeetingIcon = MEETING_ICONS[appt.meeting_type] || CalendarDays;
                const isCancelling = cancelling === appt.id;
                const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;

                return (
                  <motion.div key={appt.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.35, ease: easing }}>
                    <Card className="border-border/50 hover:border-border transition-colors">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={cfg.variant}>{cfg.label}</Badge>
                              {appt.service_type && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-secondary border border-border/30">
                                  <Briefcase className="w-2.5 h-2.5" />{appt.service_type}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {appt.appointment_date
                                  ? new Date(appt.appointment_date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
                                  : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />{getTimeLabel(appt.time_slot)}
                                {appt.duration_minutes && <span className="text-muted-foreground/60">({appt.duration_minutes} min)</span>}
                              </span>
                              <span className="flex items-center gap-1">
                                <MeetingIcon className="w-3.5 h-3.5" />{appt.meeting_type || ""}
                              </span>
                            </div>

                            {appt.notes && <p className="text-xs text-muted-foreground italic">"{appt.notes}"</p>}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {(appt.status === "pending" || appt.status === "confirmed" || appt.status === "scheduled") && (
                              <Button size="sm" variant="outline"
                                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 rounded-lg text-xs"
                                disabled={isCancelling} onClick={() => handleCancel(appt.id)}>
                                {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Cancel
                              </Button>
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
