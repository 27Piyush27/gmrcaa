import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Clock, Video, Phone, MapPin, ArrowLeft, CheckCircle, Loader2, CalendarDays, ExternalLink, Download } from "lucide-react";
import { buildGoogleCalendarUrl, downloadIcsFile } from "@/lib/googleCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";

const easing = [0.22, 1, 0.36, 1];

const TIME_SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM"
];

const CONSULTATION_TYPES = [
  { value: "video", label: "Video Call", icon: Video, desc: "Google Meet / Zoom" },
  { value: "phone", label: "Phone Call", icon: Phone, desc: "We'll call you" },
  { value: "in_person", label: "In Person", icon: MapPin, desc: "Visit our office" },
];

export default function Appointments() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    type: "video",
    topic: "",
    notes: ""
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generate next 14 available dates (excluding Sundays)
  const availableDates = [];
  const today = new Date();
  for (let i = 1; i <= 20 && availableDates.length < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0) { // Skip Sundays
      availableDates.push(d.toISOString().split("T")[0]);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error("Please login first"); navigate("/auth"); return; }
    if (!formData.date || !formData.time || !formData.topic) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("appointments").insert({
        user_id: user.id,
        date: formData.date,
        time_slot: formData.time,
        type: formData.type,
        topic: formData.topic,
        notes: formData.notes || null,
        status: "pending",
      });
      if (error) throw error;
      setBooked(true);
      toast.success("Appointment booked successfully!");
    } catch (err) {
      console.error("Appointment booking error:", err);
      toast.error("Failed to book appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (booked) {
    const gcalUrl = buildGoogleCalendarUrl({
      date: formData.date,
      time: formData.time,
      type: formData.type,
      topic: formData.topic,
      notes: formData.notes,
      userName: profile?.name || "",
    });

    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center px-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: easing }} className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-semibold mb-3">Appointment Booked!</h1>
            <p className="text-muted-foreground mb-2">
              <strong>{new Date(formData.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</strong> at <strong>{formData.time}</strong>
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              {formData.type === "video" ? "You'll receive a Google Meet link via email" :
               formData.type === "phone" ? "Our CA will call you at the scheduled time" :
               "Please visit our office in Gurgaon"}
            </p>

            {/* Google Calendar Integration */}
            <div className="bg-secondary/60 rounded-xl p-5 mb-6 border border-border/40">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Add to Calendar</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild variant="outline" className="rounded-xl gap-2 h-10">
                  <a href={gcalUrl} target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                      <path d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3h-3C3.675 3 3 3.675 3 4.5v15c0 .825.675 1.5 1.5 1.5h15c.825 0 1.5-.675 1.5-1.5v-15c0-.825-.675-1.5-1.5-1.5zm0 16.5h-15V8h15v11.5zM7 10h2.5v2.5H7V10zm4.25 0h2.5v2.5h-2.5V10zM15.5 10H18v2.5h-2.5V10z"/>
                    </svg>
                    Google Calendar
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
                <Button variant="outline" className="rounded-xl gap-2 h-10"
                  onClick={() => {
                    downloadIcsFile({
                      date: formData.date,
                      time: formData.time,
                      type: formData.type,
                      topic: formData.topic,
                      notes: formData.notes,
                      userName: profile?.name || "",
                    });
                    toast.success("Calendar file downloaded!");
                  }}>
                  <Download className="w-4 h-4" />
                  Download .ics
                </Button>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="rounded-xl">
                Go to Dashboard
              </Button>
              <Button onClick={() => { setBooked(false); setFormData({ date: "", time: "", type: "video", topic: "", notes: "" }); }}
                className="rounded-xl">
                Book Another
              </Button>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="relative overflow-hidden bg-foreground text-background">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 lg:px-12 py-14">
            <Button variant="ghost" onClick={() => navigate(-1)}
              className="text-background/80 hover:text-background hover:bg-background/10 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />Back
            </Button>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-2">
                <CalendarDays className="w-6 h-6" />
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Book Consultation</h1>
              </div>
              <p className="text-background/70">Schedule a one-on-one session with our expert CAs</p>
            </motion.div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-10">
          <form onSubmit={handleSubmit}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: easing }} className="space-y-8">

              {/* Consultation Type */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Consultation Type</CardTitle>
                  <CardDescription>How would you like to meet?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {CONSULTATION_TYPES.map(type => {
                      const Icon = type.icon;
                      const isActive = formData.type === type.value;
                      return (
                        <button key={type.value} type="button" onClick={() => handleChange("type", type.value)}
                          className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                            isActive ? "border-foreground bg-foreground/5" : "border-border/60 hover:border-foreground/30"
                          }`}>
                          <Icon className={`w-6 h-6 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                          <span className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Date & Time */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Date & Time</CardTitle>
                  <CardDescription>Pick a date and available time slot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {availableDates.map(date => {
                        const d = new Date(date);
                        const isActive = formData.date === date;
                        return (
                          <button key={date} type="button" onClick={() => handleChange("date", date)}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              isActive ? "border-foreground bg-foreground text-background" : "border-border/50 hover:border-foreground/30"
                            }`}>
                            <div className="text-[10px] text-inherit opacity-70">{d.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                            <div className="text-sm font-medium">{d.getDate()}</div>
                            <div className="text-[10px] text-inherit opacity-70">{d.toLocaleDateString("en-IN", { month: "short" })}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {formData.date && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                      <Label>Select Time</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {TIME_SLOTS.map(time => {
                          const isActive = formData.time === time;
                          return (
                            <button key={time} type="button" onClick={() => handleChange("time", time)}
                              className={`py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                                isActive ? "border-foreground bg-foreground text-background" : "border-border/50 hover:border-foreground/30"
                              }`}>
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Details */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Consultation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Topic *</Label>
                    <Select value={formData.topic} onValueChange={v => handleChange("topic", v)}>
                      <SelectTrigger className="premium-input"><SelectValue placeholder="What do you need help with?" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income-tax">Income Tax Filing</SelectItem>
                        <SelectItem value="gst">GST Registration/Filing</SelectItem>
                        <SelectItem value="company">Company Incorporation</SelectItem>
                        <SelectItem value="audit">Audit & Compliance</SelectItem>
                        <SelectItem value="advisory">Tax Advisory</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea placeholder="Describe your requirements..." value={formData.notes}
                      onChange={e => handleChange("notes", e.target.value)} rows={3} />
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl gap-2 text-sm font-medium">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Booking...</> : <><CalendarDays className="w-4 h-4" />Confirm Booking</>}
              </Button>
            </motion.div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
