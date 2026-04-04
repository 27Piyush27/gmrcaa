import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  Bell, Mail, Calendar, FileText, CreditCard, Shield, Clock,
  ArrowRight, CheckCircle, MessageSquare, AlertTriangle, Smartphone
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const easing = [0.22, 1, 0.36, 1];

const NOTIFICATION_GROUPS = [
  {
    id: "tax",
    title: "Tax Deadlines",
    description: "Get reminded before ITR, TDS, and advance tax due dates",
    icon: Calendar,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    settings: [
      { key: "itr_deadline", label: "ITR Filing Deadline", description: "30 days, 7 days, and 1 day before due date", default: true },
      { key: "tds_deadline", label: "TDS Payment & Filing", description: "7th & 15th of every month reminders", default: true },
      { key: "advance_tax", label: "Advance Tax Due Dates", description: "15th Jun, Sep, Dec, Mar reminders", default: true },
    ]
  },
  {
    id: "gst",
    title: "GST Compliance",
    description: "Monthly and quarterly GST return filing reminders",
    icon: FileText,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    settings: [
      { key: "gstr1_reminder", label: "GSTR-1 Filing", description: "5 days before 11th of every month", default: true },
      { key: "gstr3b_reminder", label: "GSTR-3B Filing", description: "5 days before 20th of every month", default: true },
      { key: "gstr9_reminder", label: "Annual Return (GSTR-9)", description: "30 days before 31st December", default: false },
    ]
  },
  {
    id: "service",
    title: "Service Updates",
    description: "Track progress on your active service requests",
    icon: Shield,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    settings: [
      { key: "status_change", label: "Service Status Changes", description: "When your service moves to next stage", default: true },
      { key: "document_ready", label: "Documents Ready", description: "When your CA uploads completed documents", default: true },
      { key: "payment_due", label: "Payment Reminders", description: "When service is completed and payment is due", default: true },
    ]
  },
  {
    id: "appointment",
    title: "Appointments",
    description: "Consultation booking confirmations and reminders",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    settings: [
      { key: "appointment_confirm", label: "Booking Confirmation", description: "When your appointment is confirmed", default: true },
      { key: "appointment_reminder", label: "24-Hour Reminder", description: "One day before your scheduled appointment", default: true },
      { key: "appointment_cancel", label: "Cancellation Notice", description: "If your appointment is rescheduled or cancelled", default: true },
    ]
  },
  {
    id: "payment",
    title: "Payments & Invoices",
    description: "Payment receipts and invoice notifications",
    icon: CreditCard,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-950/30",
    settings: [
      { key: "payment_receipt", label: "Payment Receipt", description: "Email receipt after successful payment", default: true },
      { key: "invoice_generated", label: "Invoice Generated", description: "When a new invoice is available", default: true },
    ]
  },
];

export default function NotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("notification-preferences");
    if (saved) return JSON.parse(saved);
    const defaults = {};
    NOTIFICATION_GROUPS.forEach(group =>
      group.settings.forEach(s => { defaults[s.key] = s.default; })
    );
    return defaults;
  });
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("notification-preferences", JSON.stringify(preferences));
    setSaved(true);
    toast({ title: "Preferences saved", description: "Your notification preferences have been updated." });
  };

  const enabledCount = Object.values(preferences).filter(Boolean).length;
  const totalCount = Object.keys(preferences).length;

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="border-border/50 text-center max-w-md mx-auto p-10">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">Sign in Required</h2>
            <p className="text-sm text-muted-foreground mb-6">Please sign in to manage your notification preferences.</p>
            <Button asChild className="rounded-xl gap-2">
              <Link to="/auth">Sign In <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-pink-400/[0.06] blur-3xl pointer-events-none animate-breathe" />
          <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Bell className="w-3.5 h-3.5" /> Notifications
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.12 }}>
              Notification <span className="italic gradient-text-premium">Preferences</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.28 }}>
              Choose which reminders and updates you'd like to receive. Never miss a deadline.
            </motion.p>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-3xl mx-auto px-6 lg:px-12 space-y-6">
            {/* Delivery Channels */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Delivery Channels</CardTitle>
                <CardDescription>How would you like to receive notifications?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive alerts at {user?.email}</p>
                    </div>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Push Notifications</Label>
                      <p className="text-xs text-muted-foreground">Browser push alerts (requires permission)</p>
                    </div>
                  </div>
                  <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                </div>
              </CardContent>
            </Card>

            {/* Notification Groups */}
            {NOTIFICATION_GROUPS.map((group, i) => {
              const Icon = group.icon;
              return (
                <motion.div key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}>
                  <Card className="border-border/50">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${group.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${group.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{group.title}</CardTitle>
                          <CardDescription className="text-xs">{group.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {group.settings.map(setting => (
                        <div key={setting.key}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                          <div className="flex-1 mr-4">
                            <Label className="font-medium text-sm">{setting.label}</Label>
                            <p className="text-xs text-muted-foreground">{setting.description}</p>
                          </div>
                          <Switch
                            checked={preferences[setting.key] || false}
                            onCheckedChange={() => togglePreference(setting.key)}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card">
              <div className="flex items-center gap-2">
                {saved && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                <span className="text-sm text-muted-foreground">
                  {saved ? "All changes saved" : `${enabledCount}/${totalCount} notifications enabled`}
                </span>
              </div>
              <Button onClick={handleSave} className="rounded-xl gap-2">
                <Bell className="w-4 h-4" />{saved ? "Saved ✓" : "Save Preferences"}
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
