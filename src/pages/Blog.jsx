import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Calendar, Clock, ArrowRight, BookOpen, Tag, User, Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const easing = [0.22, 1, 0.36, 1];

// ── Static fallback posts (shown when DB is empty) ─────────────────────────
const STATIC_POSTS = [
  {
    id: "s1", title: "New Income Tax Regime 2025-26: Complete Guide",
    excerpt: "Everything you need to know about the new tax regime including updated slabs, rebates, and which regime to choose for maximum savings.",
    category: "Income Tax", published_at: "2026-03-15", read_time: "8 min", author: "CA Gaurav Mittal", emoji: "📊"
  },
  {
    id: "s2", title: "GST Return Filing: Common Mistakes to Avoid",
    excerpt: "Filing GST returns can be tricky. Here are the most common errors businesses make and how to avoid penalties.",
    category: "GST", published_at: "2026-03-10", read_time: "6 min", author: "CA Ritu Sharma", emoji: "📋"
  },
  {
    id: "s3", title: "How to Save Tax with Section 80C Investments",
    excerpt: "Maximize your tax savings with smart 80C investments. Compare ELSS, PPF, NPS, and other popular options.",
    category: "Tax Planning", published_at: "2026-03-05", read_time: "10 min", author: "CA Gaurav Mittal", emoji: "💰"
  },
  {
    id: "s4", title: "Company Incorporation in India: Step-by-Step Guide",
    excerpt: "A comprehensive guide to registering your company in India — from name approval to certificate of incorporation.",
    category: "Company Law", published_at: "2026-02-28", read_time: "12 min", author: "CA Priyanka Verma", emoji: "🏢"
  },
  {
    id: "s5", title: "TDS Rate Chart for FY 2025-26",
    excerpt: "Updated TDS rate chart covering all sections. Know how much TDS is deducted on salary, rent, professional fees, and more.",
    category: "TDS", published_at: "2026-02-20", read_time: "5 min", author: "CA Ritu Sharma", emoji: "📑"
  },
  {
    id: "s6", title: "Advance Tax: Due Dates and How to Calculate",
    excerpt: "Learn when advance tax is due, how to calculate it, and avoid interest under sections 234B and 234C.",
    category: "Income Tax", published_at: "2026-02-15", read_time: "7 min", author: "CA Gaurav Mittal", emoji: "📆"
  },
  {
    id: "s7", title: "GST E-Invoice: Who Needs It and How to Generate",
    excerpt: "E-invoicing is now mandatory for businesses with turnover above ₹5 crore. Here's everything you need to know.",
    category: "GST", published_at: "2026-02-10", read_time: "6 min", author: "CA Priyanka Verma", emoji: "🧾"
  },
  {
    id: "s8", title: "Startup India Registration: Benefits and Process",
    excerpt: "Discover the benefits of DPIIT recognition and how to register your startup under the Startup India scheme.",
    category: "Startups", published_at: "2026-02-05", read_time: "9 min", author: "CA Gaurav Mittal", emoji: "🚀"
  },
];

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [dbPosts, setDbPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // ── Fetch published posts from Supabase ───────────────────────────────────
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("id, title, excerpt, category, emoji, read_time, published_at, author_id")
          .eq("published", true)
          .order("published_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setDbPosts(data.map(p => ({
            ...p,
            author: "GMR & Associates CA Team", // author_id could be resolved separately
          })));
        }
      } catch (err) {
        console.warn("Blog DB fetch failed, using static fallback:", err);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchPosts();
  }, []);

  // Merge: DB posts first, then static fallback
  const allPosts = dbPosts.length > 0 ? dbPosts : STATIC_POSTS;

  const categories = ["All", ...new Set(allPosts.map(p => p.category))];

  const filtered = allPosts.filter(post => {
    const matchesCat = activeCategory === "All" || post.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || post.title.toLowerCase().includes(q) || (post.excerpt || "").toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <BookOpen className="w-3.5 h-3.5" /> Knowledge
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.12 }}>
              Tax Tips &{" "}<span className="italic gradient-text-premium">Insights</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.28 }}>
              Stay updated with the latest tax updates, financial tips, and expert advice from our CA team.
            </motion.p>
          </div>
        </section>

        {/* Filter bar */}
        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-shrink-0 sm:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" placeholder="Search articles…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-8 rounded-xl border border-border/50 bg-secondary/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1.5 min-w-max">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                      activeCategory === cat ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Blog grid */}
        <section className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            {loadingPosts ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                <p className="text-muted-foreground text-sm">Try a different search term</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((post, index) => (
                  <motion.article key={post.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: easing, delay: index * 0.06 }}
                    className="group premium-card flex flex-col">
                    <div className="p-6 flex flex-col flex-1">
                      <div className="text-4xl mb-4">{post.emoji || "📄"}</div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-border/40 bg-secondary/40 text-[11px] text-muted-foreground font-medium">
                          <Tag className="w-3 h-3" />{post.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold leading-snug mb-2 group-hover:text-accent transition-colors">{post.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-3">{post.excerpt}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-border/40">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.published_at + "T00:00:00").toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time}</span>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-32 bg-foreground text-background relative overflow-hidden">
          <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
            <ScrollReveal>
              <h2 className="text-3xl sm:text-4xl font-semibold mb-6">Need personalized advice?</h2>
              <p className="text-background/60 mb-10 max-w-xl mx-auto">Our expert CAs are ready to help with your specific tax situation.</p>
              <Button asChild size="lg" variant="secondary" className="rounded-xl gap-2">
                <Link to="/services">Book a Consultation <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
