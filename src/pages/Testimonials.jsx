import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Star, Quote, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const easing = [0.22, 1, 0.36, 1];

// ── Static fallback (shown when DB has no approved testimonials) ───────────
const STATIC_TESTIMONIALS = [
  { id: "s1", name: "Rajesh Kumar", role_title: "Director, IT Services", rating: 5,
    text: "GMR & Associates handled our company's entire audit process flawlessly. Their attention to detail and proactive approach saved us from potential compliance issues." },
  { id: "s2", name: "Priya Sharma", role_title: "Freelancer, Content Creator", rating: 5,
    text: "As a freelancer, I was always confused about tax filing. The team made it so simple and even helped me save ₹45,000 in taxes with smart planning." },
  { id: "s3", name: "Amit Gupta", role_title: "CEO, Manufacturing Sector", rating: 5,
    text: "From GST registration to monthly returns, everything is handled seamlessly. The most reliable CA firm we've worked with in 10 years." },
  { id: "s4", name: "Sunita Verma", role_title: "Partner, Retail Business", rating: 4,
    text: "Their company incorporation service was exceptional. Got our Pvt Ltd registered in just 12 days with all compliance paperwork sorted." },
  { id: "s5", name: "Vikram Singh", role_title: "NRI, Software Engineer", rating: 5,
    text: "Being an NRI, filing taxes in India was a nightmare. GMR Associates made it effortless — everything done remotely with excellent communication." },
  { id: "s6", name: "Meera Joshi", role_title: "Owner, Textile Business", rating: 5,
    text: "Switched from our previous CA firm 2 years ago and haven't looked back. The digital platform makes document sharing and tracking so convenient." },
  { id: "s7", name: "Ankit Patel", role_title: "Startup Founder", rating: 4,
    text: "They helped us get DPIIT recognition and guided us through all the startup-related tax benefits. Great support for new entrepreneurs." },
  { id: "s8", name: "Kavitha Nair", role_title: "Medical Professional", rating: 5,
    text: "Professional, punctual, and thorough. They manage my personal and clinic finances with equal expertise. Highly recommend for medical professionals." },
];

export default function Testimonials() {
  const { user, profile } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit form state
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState("");
  const [reviewRole, setReviewRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Fetch approved testimonials from DB ───────────────────────────────────
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("id, name, role_title, rating, text")
          .eq("approved", true)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setTestimonials(data);
        } else {
          setTestimonials(STATIC_TESTIMONIALS);
        }
      } catch {
        setTestimonials(STATIC_TESTIMONIALS);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  // Pre-fill name from profile — only if the user hasn't typed anything yet
  useEffect(() => {
    if (profile?.name && !reviewName) setReviewName(profile.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // ── Submit review ─────────────────────────────────────────────────────────
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error("Please login to submit a review"); return; }
    if (!reviewText.trim() || reviewText.trim().length < 20) {
      toast.error("Please write at least 20 characters");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("testimonials").insert({
        client_id: user.id,
        name: reviewName.trim() || profile?.name || user.email.split("@")[0],
        role_title: reviewRole.trim() || null,
        rating: reviewRating,
        text: reviewText.trim(),
        approved: false, // pending admin review
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Review submitted! It will appear after admin approval.");
    } catch (err) {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Reviews
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.12 }}>
              What Our{" "}<span className="italic gradient-text-premium">Clients Say</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.28 }}>
              Trusted by 500+ businesses and individuals across India for their financial and compliance needs.
            </motion.p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "500+", label: "Happy Clients" },
              { value: "4.9", label: "Average Rating" },
              { value: "8+", label: "Years Experience" },
              { value: "99%", label: "Satisfaction Rate" },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.1}>
                <div className="text-center p-4 rounded-2xl border border-border/40 bg-card">
                  <p className="text-3xl md:text-4xl font-bold gradient-text-premium">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Testimonial Grid */}
        <section className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                {testimonials.map((t, i) => (
                  <ScrollReveal key={t.id} delay={i * 0.05}>
                    <div className="break-inside-avoid premium-card p-6 relative">
                      <Quote className="w-8 h-8 text-accent/10 absolute top-4 right-4" />
                      <div className="flex items-center gap-0.5 mb-3">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className={`w-3.5 h-3.5 ${j < t.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/80 mb-4">{t.text}</p>
                      <div className="border-t border-border/40 pt-3">
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role_title}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── Submit a Review (logged-in clients only) ─────────────────────── */}
        <section className="py-16 border-t border-border/40">
          <div className="max-w-xl mx-auto px-6 lg:px-12">
            <ScrollReveal>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold mb-2">Share Your Experience</h2>
                <p className="text-muted-foreground text-sm">Your review will appear after admin approval.</p>
              </div>

              {!user ? (
                <div className="text-center p-8 rounded-2xl border border-border/50 bg-secondary/30">
                  <Star className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Login to leave a review</p>
                  <Button asChild variant="outline" size="sm" className="rounded-xl">
                    <a href="/auth">Sign In</a>
                  </Button>
                </div>
              ) : submitted ? (
                <div className="text-center p-8 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Thank you!</h3>
                  <p className="text-sm text-emerald-600 dark:text-emerald-500">Your review is under review and will be published shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="premium-card p-6 space-y-4">
                  {/* Star rating picker */}
                  <div className="space-y-1">
                    <Label className="text-sm">Your Rating</Label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setReviewRating(star)}>
                          <Star className={`w-7 h-7 transition-colors ${star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30 hover:text-amber-300"}`} />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">{reviewRating}/5</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="rname" className="text-sm">Your Name</Label>
                      <Input id="rname" value={reviewName} onChange={e => setReviewName(e.target.value)}
                        placeholder="John Doe" required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rrole" className="text-sm">Role / Industry (optional)</Label>
                      <Input id="rrole" value={reviewRole} onChange={e => setReviewRole(e.target.value)}
                        placeholder="CEO, Technology Sector" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="rtext" className="text-sm">Your Review *</Label>
                    <Textarea id="rtext" rows={4} placeholder="Share your experience with GMR & Associates…"
                      value={reviewText} onChange={e => setReviewText(e.target.value)} required />
                    <p className="text-xs text-muted-foreground text-right">{reviewText.length} chars (min 20)</p>
                  </div>

                  <Button type="submit" className="w-full gap-2 rounded-xl" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitting ? "Submitting…" : "Submit Review"}
                  </Button>
                </form>
              )}
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
