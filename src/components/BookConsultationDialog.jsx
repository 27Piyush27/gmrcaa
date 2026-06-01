import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Calendar, Clock, Loader2, CalendarDays, User, Mail, Phone,
  Briefcase, MessageSquare, CheckCircle, Sparkles, ShieldCheck, Video, MapPin
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { notifyStaff } from "@/lib/notifications";

const easing = [0.22, 1, 0.36, 1];

/** Shared constants — import these from other components */
export const TIME_SLOTS = [
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
];

export const SERVICE_TYPES = [
  "ITR Filing",
  "GST Registration",
  "GST Return Filing",
  "Tax Consultation",
  "Company Registration",
  "Audit Services",
  "Loan File Preparation",
];

const MEETING_TYPES = [
  { value: "video", label: "Video Call", icon: Video, desc: "Google Meet / Zoom" },
  { value: "phone", label: "Phone Call", icon: Phone, desc: "We'll call you" },
  { value: "in-person", label: "In Person", icon: MapPin, desc: "Visit our office" },
];

export function BookConsultationDialog({ open, onOpenChange }) {
  const { user, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    serviceType: "",
    date: "",
    time: "",
    meetingType: "video",
    message: "",
  });

  // Pre-fill from profile
  useEffect(() => {
    if (open && profile) {
      setForm(prev => ({
        ...prev,
        fullName: prev.fullName || profile.name || "",
        email: prev.email || profile.email || "",
        phone: prev.phone || profile.phone || "",
      }));
    }
    if (open) { setSuccess(false); setErrors({}); }
  }, [open, profile]);

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

  // Generate next 14 available dates (skip Sundays)
  const availableDates = [];
  const today = new Date();
  for (let i = 1; i <= 30 && availableDates.length < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0) availableDates.push(d.toISOString().split("T")[0]);
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Required";
    else if (!/^[0-9]{10}$/.test(form.phone.replace(/[\s-]/g, ""))) e.phone = "Enter 10-digit number";
    if (!form.serviceType) e.serviceType = "Required";
    if (!form.date) e.date = "Required";
    if (!form.time) e.time = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { toast.error("Please fill all required fields"); return; }
    setSubmitting(true);
    try {
      const appointmentDate = new Date(`${form.date}T${form.time}`).toISOString();
      const { error } = await supabase.from("appointments").insert({
        user_id: user?.id || null,
        appointment_date: appointmentDate,
        date: form.date, // for old schema constraint
        time_slot: form.time,
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        service_type: form.serviceType,
        topic: form.serviceType || "Consultation", // for old schema constraint
        meeting_type: form.meetingType,
        type: form.meetingType === "in-person" ? "in_person" : form.meetingType, // map to old enum
        duration_minutes: 30,
        status: "pending",
        notes: form.message || null,
      });
      if (error) {
        if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
          toast.error("This slot is already booked. Please choose another.");
          setBookedSlots(prev => [...prev, form.time]);
          handleChange("time", "");
        } else throw error;
      } else {
        setSuccess(true);
        toast.success("Your appointment has been booked successfully.");
        notifyStaff(
          "New Consultation Booked",
          `${form.fullName || "A client"} booked a free consultation for ${form.date} at ${form.time}.`,
          "appointment"
        );
      }
    } catch (err) {
      console.error("Booking error:", err);
      toast.error(err?.message || "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ fullName: profile?.name || "", email: profile?.email || "", phone: profile?.phone || "", serviceType: "", date: "", time: "", meetingType: "video", message: "" });
    setSuccess(false); setErrors({}); setBookedSlots([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-t-lg" />

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }} className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Appointment Booked!</h2>
              <p className="text-muted-foreground text-sm mb-6">Your appointment has been booked successfully.</p>

              {/* Summary */}
              <div className="bg-secondary/50 rounded-2xl p-5 text-left space-y-2.5 mb-6 border border-border/30">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Booking Summary</p>
                {[
                  { l: "Name", v: form.fullName },
                  { l: "Service", v: form.serviceType },
                  { l: "Date", v: new Date(form.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" }) },
                  { l: "Time", v: TIME_SLOTS.find(s => s.value === form.time)?.label || form.time },
                ].map(r => (
                  <div key={r.l} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{r.l}</span>
                    <span className="font-medium">{r.v}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200">Pending</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl">Close</Button>
                <Button onClick={resetForm} className="flex-1 rounded-xl">Book Another</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 md:p-8">
              <DialogHeader className="mb-6">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <CalendarDays className="w-5 h-5 text-emerald-500" /> Book Free Consultation
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Schedule a one-on-one session with our expert CAs</p>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" />Free Consultation</span>
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />Instant Confirmation</span>
                </div>
              </DialogHeader>

              <div className="space-y-5">
                {/* Personal Details */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Personal Details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Full Name <span className="text-red-500">*</span></Label>
                      <Input placeholder="Your full name" value={form.fullName} onChange={e => handleChange("fullName", e.target.value)}
                        className={`h-9 text-sm rounded-xl ${errors.fullName ? "border-red-400" : ""}`} />
                      {errors.fullName && <p className="text-[10px] text-red-500">{errors.fullName}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email <span className="text-red-500">*</span></Label>
                      <Input type="email" placeholder="your@email.com" value={form.email} onChange={e => handleChange("email", e.target.value)}
                        className={`h-9 text-sm rounded-xl ${errors.email ? "border-red-400" : ""}`} />
                      {errors.email && <p className="text-[10px] text-red-500">{errors.email}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone <span className="text-red-500">*</span></Label>
                      <Input type="tel" placeholder="10-digit number" value={form.phone} onChange={e => handleChange("phone", e.target.value)}
                        className={`h-9 text-sm rounded-xl ${errors.phone ? "border-red-400" : ""}`} />
                      {errors.phone && <p className="text-[10px] text-red-500">{errors.phone}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Service Type <span className="text-red-500">*</span></Label>
                      <Select value={form.serviceType} onValueChange={v => handleChange("serviceType", v)}>
                        <SelectTrigger className={`h-9 text-sm rounded-xl ${errors.serviceType ? "border-red-400" : ""}`}>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.serviceType && <p className="text-[10px] text-red-500">{errors.serviceType}</p>}
                    </div>
                  </div>
                </div>

                {/* Meeting Type */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Consultation Type</p>
                  <div className="grid grid-cols-3 gap-2">
                    {MEETING_TYPES.map(mt => {
                      const Icon = mt.icon;
                      const active = form.meetingType === mt.value;
                      return (
                        <button key={mt.value} type="button" onClick={() => handleChange("meetingType", mt.value)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-xs ${
                            active ? "border-foreground bg-foreground/5" : "border-border/50 hover:border-foreground/30"
                          }`}>
                          <Icon className={`w-4 h-4 ${active ? "text-foreground" : "text-muted-foreground"}`} />
                          <span className={`font-medium ${active ? "" : "text-muted-foreground"}`}>{mt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Preferred Date & Time
                  </p>
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 mb-3">
                    {availableDates.map(date => {
                      const d = new Date(date + "T00:00:00");
                      const active = form.date === date;
                      return (
                        <button key={date} type="button" onClick={() => { handleChange("date", date); handleChange("time", ""); }}
                          className={`p-1.5 rounded-xl border text-center transition-all duration-200 ${
                            active ? "border-foreground bg-foreground text-background shadow-md" : "border-border/40 hover:border-foreground/30"
                          }`}>
                          <div className="text-[9px] opacity-70">{d.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                          <div className="text-sm font-semibold">{d.getDate()}</div>
                          <div className="text-[9px] opacity-70">{d.toLocaleDateString("en-IN", { month: "short" })}</div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.date && <p className="text-[10px] text-red-500 mb-2">{errors.date}</p>}

                  {/* Time slots */}
                  {form.date && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                        {TIME_SLOTS.map(slot => {
                          const taken = bookedSlots.includes(slot.value);
                          const active = form.time === slot.value;
                          return (
                            <button key={slot.value} type="button" disabled={taken}
                              onClick={() => handleChange("time", slot.value)}
                              className={`py-2 px-1 rounded-xl border text-[11px] font-medium transition-all ${
                                taken ? "border-border/20 bg-secondary/40 text-muted-foreground/40 cursor-not-allowed line-through"
                                : active ? "border-foreground bg-foreground text-background shadow-md"
                                : "border-border/40 hover:border-foreground/30"
                              }`}>
                              {taken ? "Booked" : slot.label}
                            </button>
                          );
                        })}
                      </div>
                      {errors.time && <p className="text-[10px] text-red-500 mt-1">{errors.time}</p>}
                    </motion.div>
                  )}
                </div>

                {/* Message */}
                <div className="space-y-1">
                  <Label className="text-xs">Additional Message (optional)</Label>
                  <Textarea placeholder="Any specific questions or details..." value={form.message}
                    onChange={e => handleChange("message", e.target.value)} rows={2} className="text-sm rounded-xl resize-none" />
                </div>

                {/* Submit */}
                <Button onClick={handleSubmit} disabled={submitting}
                  className="w-full h-11 rounded-xl gap-2 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 shadow-lg">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Booking...</> : <><CalendarDays className="w-4 h-4" />Book Free Consultation</>}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
