import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  ChevronLeft, ChevronRight, Calendar, FileText, IndianRupee, Shield,
  AlertTriangle, CheckCircle, Clock
} from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_TYPES = {
  itr: { label: "ITR", color: "bg-blue-500", lightColor: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400", icon: FileText },
  gst: { label: "GST", color: "bg-emerald-500", lightColor: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400", icon: IndianRupee },
  tds: { label: "TDS", color: "bg-violet-500", lightColor: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400", icon: Shield },
  advance: { label: "Advance Tax", color: "bg-amber-500", lightColor: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400", icon: IndianRupee },
  audit: { label: "Audit", color: "bg-pink-500", lightColor: "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400", icon: Shield },
  other: { label: "Other", color: "bg-gray-500", lightColor: "bg-gray-50 dark:bg-gray-950/40 text-gray-700 dark:text-gray-400", icon: Calendar },
};

// Recurring tax deadlines for every month
const generateDeadlines = (year, month) => {
  const deadlines = [];
  const m = month + 1; // 1-indexed

  // GST - GSTR-1 (11th), GSTR-3B (20th)
  deadlines.push({ day: 11, type: "gst", title: `GSTR-1 Filing (${MONTHS[month].slice(0,3)} ${year})`, desc: "Outward supplies return" });
  deadlines.push({ day: 20, type: "gst", title: `GSTR-3B Filing (${MONTHS[month].slice(0,3)} ${year})`, desc: "Summary return" });

  // TDS - 7th of every month
  deadlines.push({ day: 7, type: "tds", title: "TDS Payment Due", desc: "Tax deducted at source deposit" });

  // Quarterly TDS return - Jan, Apr, Jul, Oct
  if ([1, 4, 7, 10].includes(m)) {
    deadlines.push({ day: 31, type: "tds", title: "TDS Quarterly Return (24Q/26Q)", desc: "Quarterly TDS statement" });
  }

  // Advance Tax (15 Jun, 15 Sep, 15 Dec, 15 Mar)
  if (m === 6) deadlines.push({ day: 15, type: "advance", title: "Advance Tax - 1st Installment (15%)", desc: "First installment due" });
  if (m === 9) deadlines.push({ day: 15, type: "advance", title: "Advance Tax - 2nd Installment (45%)", desc: "Second installment due" });
  if (m === 12) deadlines.push({ day: 15, type: "advance", title: "Advance Tax - 3rd Installment (75%)", desc: "Third installment due" });
  if (m === 3) deadlines.push({ day: 15, type: "advance", title: "Advance Tax - 4th Installment (100%)", desc: "Final installment due" });

  // ITR - July 31
  if (m === 7) deadlines.push({ day: 31, type: "itr", title: "ITR Filing Deadline (Non-Audit)", desc: "Individual/HUF/Partnership without audit" });
  // ITR - Oct 31
  if (m === 10) deadlines.push({ day: 31, type: "itr", title: "ITR Filing Deadline (Audit Cases)", desc: "Companies and audit cases" });

  // Annual Returns
  if (m === 12) {
    deadlines.push({ day: 31, type: "gst", title: "GSTR-9 Annual Return Due", desc: "Annual GST return" });
    deadlines.push({ day: 31, type: "audit", title: "Tax Audit Report Due", desc: "Section 44AB" });
  }

  // Other notable dates
  if (m === 3) {
    deadlines.push({ day: 31, type: "other", title: "Financial Year Ends", desc: "FY 2025-26 closing" });
    deadlines.push({ day: 15, type: "other", title: "Last Date for Tax-Saving Investments", desc: "80C/80D deductions" });
  }
  if (m === 4) {
    deadlines.push({ day: 30, type: "gst", title: "GSTR-4 (Composition) Due", desc: "Annual return for composition taxpayers" });
  }

  return deadlines;
};

export default function TaxCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  const deadlines = useMemo(() => generateDeadlines(currentYear, currentMonth), [currentYear, currentMonth]);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDate(null);
  };

  const getDeadlinesForDay = (day) => deadlines.filter(d => d.day === day);
  const isToday = (day) => day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const selectedDeadlines = selectedDate ? getDeadlinesForDay(selectedDate) : [];

  // Upcoming deadlines from today
  const upcomingDeadlines = deadlines
    .filter(d => d.day >= today.getDate() || currentMonth > today.getMonth() || currentYear > today.getFullYear())
    .sort((a, b) => a.day - b.day)
    .slice(0, 5);

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-10 md:pt-40 md:pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-blue-400/[0.06] blur-3xl pointer-events-none animate-breathe" />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Calendar className="w-3.5 h-3.5" /> Deadlines
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              Tax <span className="italic gradient-text-premium">Calendar</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              Never miss a tax deadline. All ITR, GST, TDS, and advance tax dates in one view.
            </motion.p>
          </div>
        </section>

        {/* Calendar */}
        <section className="py-8 md:py-12">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Grid */}
              <div className="lg:col-span-2">
                <Card className="border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl">
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <CardTitle className="text-lg">{MONTHS[currentMonth]} {currentYear}</CardTitle>
                      <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {WEEKDAYS.map(day => (
                        <div key={day} className="text-center text-[11px] font-medium text-muted-foreground py-1">{day}</div>
                      ))}
                    </div>
                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for first week offset */}
                      {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                      {days.map(day => {
                        const dayDeadlines = getDeadlinesForDay(day);
                        const hasDeadlines = dayDeadlines.length > 0;
                        const todayClass = isToday(day);
                        const selectedClass = selectedDate === day;
                        return (
                          <motion.button
                            key={day}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedDate(selectedDate === day ? null : day)}
                            className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all duration-200 ${
                              selectedClass ? "bg-foreground text-background ring-2 ring-foreground" :
                              todayClass ? "bg-accent text-accent-foreground font-bold" :
                              hasDeadlines ? "bg-secondary/60 hover:bg-secondary font-medium" :
                              "hover:bg-secondary/40"
                            }`}
                          >
                            {day}
                            {hasDeadlines && (
                              <div className="flex gap-0.5 mt-0.5">
                                {dayDeadlines.slice(0, 3).map((dl, i) => (
                                  <span key={i} className={`w-1.5 h-1.5 rounded-full ${EVENT_TYPES[dl.type].color} ${selectedClass ? "opacity-80" : ""}`} />
                                ))}
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-border/30">
                      {Object.entries(EVENT_TYPES).map(([key, type]) => (
                        <span key={key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className={`w-2 h-2 rounded-full ${type.color}`} />{type.label}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Selected Date Events */}
                {selectedDate && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    <Card className="border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{selectedDate} {MONTHS[currentMonth]}</CardTitle>
                        <CardDescription>{selectedDeadlines.length} deadline{selectedDeadlines.length !== 1 ? "s" : ""}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedDeadlines.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">No deadlines on this date</p>
                        ) : (
                          selectedDeadlines.map((dl, i) => {
                            const type = EVENT_TYPES[dl.type];
                            const Icon = type.icon;
                            return (
                              <div key={i} className={`p-3 rounded-xl ${type.lightColor}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Icon className="w-3.5 h-3.5" />
                                  <span className="text-xs font-semibold">{type.label}</span>
                                </div>
                                <p className="text-sm font-medium">{dl.title}</p>
                                <p className="text-xs opacity-80 mt-0.5">{dl.desc}</p>
                              </div>
                            );
                          })
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Upcoming */}
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />Upcoming Deadlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {upcomingDeadlines.map((dl, i) => {
                      const type = EVENT_TYPES[dl.type];
                      return (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors">
                          <div className={`w-2 h-2 rounded-full ${type.color} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{dl.title}</p>
                            <p className="text-[11px] text-muted-foreground">{dl.day} {MONTHS[currentMonth].slice(0,3)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* CTA */}
                <ScrollReveal>
                  <Card className="border-border/50 bg-gradient-to-br from-violet-500/5 to-blue-500/5">
                    <CardContent className="pt-6 text-center">
                      <Calendar className="w-8 h-8 mx-auto text-violet-500 mb-3" />
                      <p className="text-sm font-medium mb-2">Need filing help?</p>
                      <Button asChild size="sm" className="rounded-xl">
                        <Link to="/services">Get Expert Help</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
