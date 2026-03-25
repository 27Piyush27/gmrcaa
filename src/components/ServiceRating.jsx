import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function ServiceRating({ serviceRequestId, serviceName, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    
    // In production, this would save to Supabase
    if (onSubmit) onSubmit({ serviceRequestId, rating, review });
    setSubmitted(true);
    toast.success("Thank you for your feedback!");
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
          ))}
        </div>
        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Rated</span>
      </motion.div>
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}
        className="text-xs gap-1.5 h-7 rounded-lg text-muted-foreground hover:text-foreground">
        <MessageSquare className="w-3 h-3" /> Rate Service
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="mt-3 p-4 rounded-xl border border-border/50 bg-card space-y-3">
              <p className="text-xs text-muted-foreground">How was your experience with {serviceName || "this service"}?</p>
              {/* Stars */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const starValue = i + 1;
                  return (
                    <motion.button key={i} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoveredRating(starValue)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-0.5">
                      <Star className={`w-6 h-6 transition-colors ${
                        starValue <= (hoveredRating || rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                      }`} />
                    </motion.button>
                  );
                })}
                {rating > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                  </span>
                )}
              </div>
              {/* Review text */}
              <Textarea value={review} onChange={e => setReview(e.target.value)}
                placeholder="Write a brief review (optional)..."
                rows={2} className="text-sm resize-none" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 text-xs rounded-lg">Cancel</Button>
                <Button size="sm" onClick={handleSubmit} className="h-8 text-xs rounded-lg gap-1.5">
                  <Send className="w-3 h-3" /> Submit
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
