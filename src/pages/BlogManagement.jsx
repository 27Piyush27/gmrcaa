import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BookOpen, ArrowLeft, Loader2, Plus, Edit, Trash2,
  Eye, EyeOff, Calendar, Search, X, Tag
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const easing = [0.22, 1, 0.36, 1];
const CATEGORIES = ["Income Tax", "GST", "Tax Planning", "Company Law", "TDS", "Startups", "Audit", "General"];
const EMOJIS = ["📊", "📋", "💰", "🏢", "📑", "🚀", "🧾", "📆", "📄", "💡"];

const emptyForm = {
  title: "", slug: "", excerpt: "", content: "", category: "General",
  emoji: "📄", read_time: "5 min", published: false,
};

export default function BlogManagement() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | published | draft

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!authLoading && user && role !== "admin" && role !== "ca") {
      toast.error("Access denied"); navigate("/dashboard");
    }
  }, [user, role, authLoading, navigate]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && (role === "admin" || role === "ca")) fetchPosts();
  }, [user, role, fetchPosts]);

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const openCreateDialog = () => {
    setEditing(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (post) => {
    setEditing(post.id);
    setFormData({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      category: post.category || "General",
      emoji: post.emoji || "📄",
      read_time: post.read_time || "5 min",
      published: post.published || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const slug = formData.slug.trim() || generateSlug(formData.title);
      const payload = {
        title: formData.title.trim(),
        slug,
        excerpt: formData.excerpt.trim() || null,
        content: formData.content.trim() || null,
        category: formData.category,
        emoji: formData.emoji,
        read_time: formData.read_time,
        published: formData.published,
        published_at: formData.published ? new Date().toISOString() : null,
      };

      if (editing) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing);
        if (error) throw error;
        toast.success("Post updated");
      } else {
        payload.author_id = user.id;
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
        toast.success("Post created");
      }
      setDialogOpen(false);
      fetchPosts();
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.message?.includes("duplicate") ? "Slug already exists. Choose a different title or slug." : "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (post) => {
    try {
      const { error } = await supabase.from("blog_posts").update({
        published: !post.published,
        published_at: !post.published ? new Date().toISOString() : null,
      }).eq("id", post.id);
      if (error) throw error;
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, published: !p.published } : p));
      toast.success(post.published ? "Post unpublished" : "Post published!");
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success("Post deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const filtered = posts.filter(p => {
    if (filter === "published" && !p.published) return false;
    if (filter === "draft" && p.published) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q);
    }
    return true;
  });

  const publishedCount = posts.filter(p => p.published).length;

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
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-6 w-6" />
                  <h1 className="text-3xl font-semibold tracking-tight">Blog Management</h1>
                </div>
                <p className="text-background/70">Create, edit, and publish blog articles.</p>
              </div>
              <Button onClick={openCreateDialog}
                className="gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-background">
                <Plus className="w-4 h-4" /> New Post
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 max-w-lg">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
                <p className="text-2xl font-bold">{posts.length}</p>
                <p className="text-xs text-background/50">Total</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
                <p className="text-2xl font-bold">{publishedCount}</p>
                <p className="text-xs text-background/50">Published</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
                <p className="text-2xl font-bold">{posts.length - publishedCount}</p>
                <p className="text-xs text-background/50">Drafts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search posts…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-border/50 bg-secondary/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
            </div>
            <div className="flex gap-2">
              {["all", "published", "draft"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium capitalize transition-colors ${
                    filter === f ? "bg-foreground text-background border-foreground" : "border-border/50 text-muted-foreground hover:border-foreground/30"
                  }`}>{f}</button>
              ))}
            </div>
          </div>

          {/* Posts list */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-16 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">{search ? "No posts match your search" : "No blog posts yet."}</p>
              <Button onClick={openCreateDialog} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Create First Post</Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3, ease: easing }}>
                  <Card className="border-border/50 hover:border-border transition-colors">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg">{post.emoji}</span>
                            <h3 className="font-semibold text-sm">{post.title}</h3>
                            <Badge variant={post.published ? "default" : "outline"} className="text-[10px]">
                              {post.published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{post.category}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                            <span>{post.read_time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => togglePublish(post)}>
                            {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEditDialog(post)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700" onClick={() => handleDelete(post.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Create / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Post" : "New Blog Post"}</DialogTitle>
              <DialogDescription>Fill in the details below and save.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={formData.title} onChange={e => {
                  const title = e.target.value;
                  setFormData(prev => ({ ...prev, title, slug: prev.slug || generateSlug(title) }));
                }} placeholder="Your article title" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={formData.slug} onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="auto-generated-from-title" className="font-mono text-xs" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={v => setFormData(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Emoji</Label>
                  <Select value={formData.emoji} onValueChange={v => setFormData(prev => ({ ...prev, emoji: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMOJIS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Read Time</Label>
                  <Input value={formData.read_time} onChange={e => setFormData(prev => ({ ...prev, read_time: e.target.value }))}
                    placeholder="5 min" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea value={formData.excerpt} onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Short description for the blog listing" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={formData.content} onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Full article content…" rows={8} />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.published}
                    onChange={e => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                    className="rounded border-border" />
                  <span className="text-sm font-medium">Publish immediately</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? "Save Changes" : "Create Post"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
