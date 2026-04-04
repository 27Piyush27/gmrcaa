import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Star, MessageSquare, ThumbsUp, ArrowRight, Send, CheckCircle, Heart, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const easing = [0.22, 1, 0.36, 1];

const NPS_LABELS = {
  0: "Not at all likely", 1: "Very unlikely", 2: "Unlikely", 3: "Somewhat unlikely",
  4: "Neutral", 5: "Neutral", 6: "Somewhat likely", 7: "Likely",
  8: "Very likely", 9: "Extremely likely", 10: "Definitely!"
};

const NPS_CATEGORIES = {
  detractor: { range: "0-6", label: "Detractor", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
  passive: { range: "7-8", label: "Passive", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  promoter: { range: "9-10", label: "Promoter", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
};

const SAMPLE_FEEDBACK = [
  { id: 1, name: "Rahul K.", rating: 5, nps: 10, comment: "Excellent service! My ITR was filed perfectly and on time.", date: "2 days ago", service: "ITR Filing" },
  { id: 2, name: "Priya S.", rating: 4, nps: 8, comment: "Good experience overall. The communication could be more frequent.", date: "5 days ago", service: "GST Registration" },
  { id: 3, name: "Amit M.", rating: 5, nps: 9, comment: "Very professional team. Handled my company audit seamlessly.", date: "1 week ago", service: "Statutory Audit" },
  { id: 4, name: "Neha T.", rating: 5, nps: 10, comment: "Best CA firm I've worked with. Highly recommended!", date: "2 weeks ago", service: "Tax Planning" },
  { id: 5, name: "Vikram R.", rating: 4, nps: 8, comment: "Responsive and knowledgeable. Helped me save significantly on taxes.", date: "3 weeks ago", service: "Tax Advisory" },
];

export default function Feedback() {
  const { user, profile } = useAuth();
  const [step, setStep] = useState("rating"); // rating → nps → comment → done
  const [starRating, setStarRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [npsScore, setNpsScore] = useState(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setStep("done");
  };

  // NPS Calculation from sample data
  const promoters = SAMPLE_FEEDBACK.filter(f => f.nps >= 9).length;
  const passives = SAMPLE_FEEDBACK.filter(f => f.nps >= 7 && f.nps <= 8).length;
  const detractors = SAMPLE_FEEDBACK.filter(f => f.nps <= 6).length;
  const totalResponses = SAMPLE_FEEDBACK.length;
  const npsValue = Math.round(((promoters - detractors) / totalResponses) * 100);
  const avgRating = (SAMPLE_FEEDBACK.reduce((sum, f) => sum + f.rating, 0) / totalResponses).toFixed(1);

  const stats = [
    { icon: Star, label: "Avg Rating", value: avgRating, suffix: "/5", color: "from-amber-500 to-orange-600", lightBg: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400" },
    { icon: TrendingUp, label: "NPS Score", value: npsValue, color: "from-emerald-500 to-green-600", lightBg: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: Users, label: "Responses", value: totalResponses, color: "from-blue-500 to-cyan-600", lightBg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
    { icon: Heart, label: "Promoters", value: `${Math.round((promoters / totalResponses) * 100)}%`, color: "from-violet-500 to-purple-600", lightBg: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full bg-amber-400/[0.06] blur-3xl pointer-events-none animate-breathe" />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <MessageSquare className="w-3.5 h-3.5" /> Your Voice Matters
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.12 }}>
              Client <span className="italic gradient-text-premium">Feedback</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.28 }}>
              Help us improve by sharing your experience. Your feedback drives our commitment to excellence.
            </motion.p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-6">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div key={stat.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: easing, delay: 0.1 * i }}
                  className="relative group rounded-2xl border border-border/60 bg-card overflow-hidden shadow-soft hover:shadow-md hover:-translate-y-1 transition-all duration-500">
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color}`} />
                  <div className="p-5 md:p-6">
                    <div className={`w-10 h-10 rounded-xl ${stat.lightBg} flex items-center justify-center mb-4`}>
                      <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold tracking-tight">{stat.value}{stat.suffix || ""}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-5xl mx-auto px-6 lg:px-12 space-y-10">

            {/* Feedback Form */}
            {user && (
              <Card className="border-border/50 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-amber-500" />Share Your Feedback</CardTitle>
                  <CardDescription>Rate your experience with GMR & Associates</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {step === "rating" && (
                      <motion.div key="rating" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="text-center py-6">
                        <p className="text-sm text-muted-foreground mb-4">How would you rate our service?</p>
                        <div className="flex justify-center gap-2 mb-4">
                          {[1, 2, 3, 4, 5].map(star => (
                            <motion.button key={star}
                              whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                              onMouseEnter={() => setHoveredStar(star)}
                              onMouseLeave={() => setHoveredStar(0)}
                              onClick={() => { setStarRating(star); setTimeout(() => setStep("nps"), 300); }}
                              className="transition-colors">
                              <Star className={`w-10 h-10 ${star <= (hoveredStar || starRating) ? "text-amber-400 fill-amber-400" : "text-border"}`} />
                            </motion.button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground h-4">
                          {hoveredStar > 0 ? ["", "Poor", "Below Average", "Average", "Good", "Excellent"][hoveredStar] : starRating > 0 ? ["", "Poor", "Below Average", "Average", "Good", "Excellent"][starRating] : ""}
                        </p>
                      </motion.div>
                    )}

                    {step === "nps" && (
                      <motion.div key="nps" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="text-center py-6">
                        <p className="text-sm text-muted-foreground mb-2">How likely are you to recommend us to a friend?</p>
                        <p className="text-xs text-muted-foreground mb-6">0 = Not at all · 10 = Definitely</p>
                        <div className="flex justify-center gap-1.5 mb-4 flex-wrap">
                          {Array.from({ length: 11 }, (_, i) => i).map(score => (
                            <motion.button key={score}
                              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                              onClick={() => { setNpsScore(score); setTimeout(() => setStep("comment"), 300); }}
                              className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-all ${
                                npsScore === score ? "bg-foreground text-background border-foreground" :
                                score <= 6 ? "border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30" :
                                score <= 8 ? "border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/30" :
                                "border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                              }`}>
                              {score}
                            </motion.button>
                          ))}
                        </div>
                        {npsScore !== null && <p className="text-xs text-muted-foreground">{NPS_LABELS[npsScore]}</p>}
                      </motion.div>
                    )}

                    {step === "comment" && (
                      <motion.div key="comment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="py-4">
                        <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-secondary/40">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= starRating ? "text-amber-400 fill-amber-400" : "text-border"}`} />)}
                          </div>
                          <span className="text-xs text-muted-foreground">NPS: {npsScore}/10</span>
                        </div>
                        <Textarea
                          placeholder="Tell us more about your experience... (optional)"
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          className="mb-4 min-h-[100px] rounded-xl"
                        />
                        <Button onClick={handleSubmit} className="w-full rounded-xl gap-2 h-12">
                          <Send className="w-4 h-4" />Submit Feedback
                        </Button>
                      </motion.div>
                    )}

                    {step === "done" && (
                      <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-10">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </motion.div>
                        <h3 className="font-semibold text-lg mb-2">Thank you for your feedback!</h3>
                        <p className="text-sm text-muted-foreground">Your input helps us improve our services.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}

            {!user && (
              <Card className="border-border/50 text-center py-10">
                <CardContent>
                  <p className="text-muted-foreground mb-4">Please sign in to submit feedback</p>
                  <Button asChild variant="outline" className="rounded-xl gap-2">
                    <Link to="/auth">Sign In <ArrowRight className="w-4 h-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent Feedback */}
            <div>
              <h2 className="text-xl font-semibold tracking-tight mb-6">Recent Feedback</h2>
              <div className="space-y-4">
                {SAMPLE_FEEDBACK.map((feedback, i) => (
                  <motion.div key={feedback.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}>
                    <Card className="border-border/50 hover:shadow-soft transition-all">
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold">
                              {feedback.name.split(" ").map(w => w[0]).join("")}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{feedback.name}</p>
                              <p className="text-xs text-muted-foreground">{feedback.service} · {feedback.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= feedback.rating ? "text-amber-400 fill-amber-400" : "text-border"}`} />)}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              feedback.nps >= 9 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" :
                              feedback.nps >= 7 ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" :
                              "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                            }`}>NPS: {feedback.nps}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feedback.comment}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <ScrollReveal>
              <div className="mt-8 text-center">
                <p className="text-muted-foreground mb-4">Want to share a detailed review?</p>
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <Link to="/testimonials">Write a Testimonial <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
