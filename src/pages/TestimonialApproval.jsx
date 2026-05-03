import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Star, ArrowLeft, Loader2, CheckCircle, XCircle,
  MessageSquare, Clock, Trash2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const easing = [0.22, 1, 0.36, 1];
const FILTERS = ["all", "pending", "approved", "rejected"];

export default function TestimonialApproval() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!authLoading && user && role !== "admin" && role !== "ca") {
      toast.error("Access denied"); navigate("/dashboard");
    }
  }, [user, role, authLoading, navigate]);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTestimonials(data || []);
    } catch {
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && (role === "admin" || role === "ca")) fetchTestimonials();
  }, [user, role, fetchTestimonials]);

  const handleApprove = async (id) => {
    setUpdating(id);
    try {
      const { error } = await supabase.from("testimonials").update({ approved: true }).eq("id", id);
      if (error) throw error;
      setTestimonials(prev => prev.map(t => t.id === id ? { ...t, approved: true } : t));
      toast.success("Testimonial approved and published!");
    } catch { toast.error("Failed to approve"); } finally { setUpdating(null); }
  };

  const handleReject = async (id) => {
    setUpdating(id);
    try {
      const { error } = await supabase.from("testimonials").update({ approved: false }).eq("id", id);
      if (error) throw error;
      setTestimonials(prev => prev.map(t => t.id === id ? { ...t, approved: false } : t));
      toast.success("Testimonial rejected");
    } catch { toast.error("Failed to reject"); } finally { setUpdating(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this testimonial permanently?")) return;
    setUpdating(id);
    try {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
      setTestimonials(prev => prev.filter(t => t.id !== id));
      toast.success("Testimonial deleted");
    } catch { toast.error("Failed to delete"); } finally { setUpdating(null); }
  };

  const filtered = testimonials.filter(t => {
    if (filter === "pending") return !t.approved;
    if (filter === "approved") return t.approved;
    if (filter === "rejected") return !t.approved && t.id; // same as pending for now
    return true;
  });

  const pendingCount = testimonials.filter(t => !t.approved).length;
  const approvedCount = testimonials.filter(t => t.approved).length;

  const counts = {
    all: testimonials.length,
    pending: pendingCount,
    approved: approvedCount,
    rejected: 0,
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>;
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
              <MessageSquare className="h-6 w-6" />
              <h1 className="text-3xl font-semibold tracking-tight">Testimonial Approval</h1>
            </div>
            <p className="text-background/70">Approve or reject client reviews before they appear publicly.</p>

            <div className="grid grid-cols-3 gap-4 mt-6 max-w-lg">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
                <p className="text-2xl font-bold">{testimonials.length}</p>
                <p className="text-xs text-background/50">Total</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
                <p className="text-2xl font-bold text-amber-300">{pendingCount}</p>
                <p className="text-xs text-background/50">Pending</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
                <p className="text-2xl font-bold text-emerald-300">{approvedCount}</p>
                <p className="text-xs text-background/50">Approved</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.filter(f => f !== "rejected").map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium capitalize transition-colors ${
                  filter === f ? "bg-foreground text-background border-foreground" : "border-border/50 text-muted-foreground hover:border-foreground/30"
                }`}>
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${filter === f ? "bg-background/20" : "bg-secondary"}`}>
                  {counts[f] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-16 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No {filter !== "all" ? filter : ""} testimonials found.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((t, i) => {
                const isUpdating = updating === t.id;
                return (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3, ease: easing }}>
                    <Card className="border-border/50 hover:border-border transition-colors">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            {/* Status + stars */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                t.approved
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300"
                              }`}>
                                {t.approved ? "Approved" : "Pending"}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, j) => (
                                  <Star key={j} className={`w-3.5 h-3.5 ${j < t.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                                ))}
                              </div>
                            </div>

                            {/* Content */}
                            <p className="text-sm leading-relaxed text-foreground/80">"{t.text}"</p>

                            {/* Author */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">{t.name}</span>
                              {t.role_title && <span>{t.role_title}</span>}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(t.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!t.approved && (
                              <Button size="sm" className="gap-1.5" disabled={isUpdating}
                                onClick={() => handleApprove(t.id)}>
                                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                Approve
                              </Button>
                            )}
                            {t.approved && (
                              <Button size="sm" variant="outline" className="gap-1.5 text-amber-600 border-amber-200" disabled={isUpdating}
                                onClick={() => handleReject(t.id)}>
                                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                Unpublish
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700" disabled={isUpdating}
                              onClick={() => handleDelete(t.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
