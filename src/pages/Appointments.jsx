import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Video, Phone, MapPin, Plus, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { TIME_SLOTS, SERVICE_TYPES } from "@/components/BookConsultationDialog";
import { notifyStaff } from "@/lib/notifications";

const easing = [0.22, 1, 0.36, 1];

const STATUS_CONFIG = {
  pending:     { label: "Pending",     variant: "outline" },
  scheduled:   { label: "Scheduled",   variant: "default" },
  confirmed:   { label: "Confirmed",   variant: "default" },
  completed:   { label: "Completed",   variant: "secondary" },
  cancelled:   { label: "Cancelled",   variant: "destructive" },
  rescheduled: { label: "Rescheduled", variant: "outline" },
};

const MEETING_ICONS = {
  video:       <Video className="h-4 w-4" />,
  phone:       <Phone className="h-4 w-4" />,
  "in-person": <MapPin className="h-4 w-4" />,
};

export default function Appointments() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: "30",
    meeting_type: "video",
    service_type: "",
    notes: "",
  });

  const [bookedSlots, setBookedSlots] = useState([]);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!form.date) { setBookedSlots([]); return; }
    supabase
      .from("appointments")
      .select("time_slot")
      .eq("appointment_day", form.date)
      .neq("status", "cancelled")
      .then(({ data }) => {
        setBookedSlots((data || []).map(r => r.time_slot).filter(Boolean));
      });
  }, [form.date]);

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) console.error("Error fetching appointments:", error);
    else setAppointments(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) fetchAppointments();
  }, [user, authLoading, navigate, fetchAppointments]);

  const handleBook = async () => {
    if (!form.date || !form.time) { toast.error("Please select a date and time"); return; }
    if (!form.service_type) { toast.error("Please select a service"); return; }
    setSubmitting(true);

    const appointmentDate = new Date(`${form.date}T${form.time}`).toISOString();
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      appointment_date: appointmentDate,
      date: form.date, // backward compatibility
      time_slot: form.time,
      duration_minutes: parseInt(form.duration),
      meeting_type: form.meeting_type,
      type: form.meeting_type === "in-person" ? "in_person" : form.meeting_type, // backward compatibility
      service_type: form.service_type,
      topic: form.service_type || "Consultation", // backward compatibility
      full_name: profile?.name || "",
      email: profile?.email || user?.email || "",
      phone: profile?.phone || "",
      status: "pending",
      notes: form.notes || null,
    });

    if (error) {
      if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
        toast.error("This slot is already booked. Please choose another.");
        setBookedSlots(prev => [...prev, form.time]);
        setForm(prev => ({ ...prev, time: "" }));
      } else {
        toast.error("Failed to book appointment");
        console.error(error);
      }
    } else {
      toast.success("Appointment booked successfully!");
      setDialogOpen(false);
      setForm({ date: "", time: "", duration: "30", meeting_type: "video", service_type: "", notes: "" });
      fetchAppointments();
      notifyStaff(
        "New Appointment",
        `${profile?.name || user?.email || "A client"} booked a ${form.duration}m appointment for ${form.date} at ${form.time}.`,
        "appointment"
      );
    }
    setSubmitting(false);
  };

  // Reschedule
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment? This action cannot be undone.")) return;
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error("Failed to cancel");
    else { toast.success("Appointment cancelled"); fetchAppointments(); }
  };

  const handleReschedule = async () => {
    if (!rescheduleId || !rescheduleDate || !rescheduleTime) { toast.error("Select new date and time"); return; }
    const newDate = new Date(`${rescheduleDate}T${rescheduleTime}`).toISOString();
    const { error } = await supabase.from("appointments")
      .update({ appointment_date: newDate, date: rescheduleDate, time_slot: rescheduleTime, status: "rescheduled" })
      .eq("id", rescheduleId);
    if (error) toast.error("Failed to reschedule");
    else { toast.success("Appointment rescheduled!"); setRescheduleId(null); fetchAppointments(); }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>;
  }

  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.appointment_date || a.date) >= now && a.status !== "cancelled");
  const past = appointments.filter(a => new Date(a.appointment_date || a.date) < now || a.status === "cancelled");

  const getTimeLabel = (slot) => TIME_SLOTS.find(s => s.value === slot)?.label || slot || "";

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-foreground text-background py-12">
          <div className="container mx-auto px-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}
              className="text-background/80 hover:text-background hover:bg-background/10 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Appointments</h1>
            <p className="text-background/70 mt-2">Book and manage consultations with our CAs</p>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Book New */}
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Book Appointment</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Book a Consultation</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={form.date} min={new Date().toISOString().split("T")[0]}
                        onChange={e => setForm({ ...form, date: e.target.value, time: "" })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Time Slot</Label>
                      <Select value={form.time} onValueChange={v => setForm({ ...form, time: v })} disabled={!form.date}>
                        <SelectTrigger><SelectValue placeholder={form.date ? "Pick a slot" : "Pick date first"} /></SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(s => {
                            const taken = bookedSlots.includes(s.value);
                            return (
                              <SelectItem key={s.value} value={s.value} disabled={taken}>
                                <span className="flex items-center justify-between gap-3 w-full">
                                  <span>{s.label}</span>
                                  {taken && <span className="text-xs text-muted-foreground">Unavailable</span>}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select value={form.duration} onValueChange={v => setForm({ ...form, duration: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={form.meeting_type} onValueChange={v => setForm({ ...form, meeting_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video Call</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="in-person">In Person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Service Type <span className="text-red-500">*</span></Label>
                    <Select value={form.service_type} onValueChange={v => setForm({ ...form, service_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea placeholder="Describe what you'd like to discuss..." value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <Button onClick={handleBook} disabled={submitting} className="w-full rounded-xl">
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Confirm Booking
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Upcoming */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-emerald-500" /> Upcoming Appointments</CardTitle>
              <CardDescription>{upcoming.length} upcoming</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : upcoming.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No upcoming appointments</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(apt => (
                    <motion.div key={apt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/50 gap-3">
                      <div className="flex items-center gap-4">
                        <div className="bg-foreground/5 p-2.5 rounded-xl">
                          {MEETING_ICONS[apt.meeting_type] || <Video className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(apt.appointment_date || apt.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                            {" · "}{getTimeLabel(apt.time_slot)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" /> {apt.duration_minutes} min
                            {apt.service_type && <span>· {apt.service_type}</span>}
                          </div>
                          {apt.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{apt.notes.substring(0, 60)}{apt.notes.length > 60 ? "..." : ""}"</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={STATUS_CONFIG[apt.status]?.variant || "outline"}>
                          {STATUS_CONFIG[apt.status]?.label || apt.status}
                        </Badge>
                        {apt.status !== "cancelled" && apt.status !== "completed" && (
                          <>
                            <Button variant="outline" size="sm" className="rounded-lg text-xs h-8"
                              onClick={() => setRescheduleId(apt.id)}>Reschedule</Button>
                            <Button variant="ghost" size="sm" className="rounded-lg text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => handleCancel(apt.id)}>Cancel</Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past */}
          {past.length > 0 && (
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-muted-foreground text-base">Past Appointments</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {past.map(apt => (
                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl border border-border/30 opacity-60">
                      <div className="flex items-center gap-3">
                        {MEETING_ICONS[apt.meeting_type] || <Video className="h-4 w-4" />}
                        <div>
                          <span className="text-sm">{new Date(apt.appointment_date || apt.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                          {apt.service_type && <span className="text-xs text-muted-foreground ml-2">· {apt.service_type}</span>}
                        </div>
                      </div>
                      <Badge variant={STATUS_CONFIG[apt.status]?.variant || "outline"}>
                        {STATUS_CONFIG[apt.status]?.label || apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reschedule Dialog */}
          <Dialog open={!!rescheduleId} onOpenChange={open => !open && setRescheduleId(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Reschedule Appointment</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>New Date</Label>
                  <Input type="date" value={rescheduleDate} min={new Date().toISOString().split("T")[0]}
                    onChange={e => setRescheduleDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>New Time</Label>
                  <Input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} />
                </div>
                <Button onClick={handleReschedule} className="w-full rounded-xl">Confirm Reschedule</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PageTransition>
  );
}
