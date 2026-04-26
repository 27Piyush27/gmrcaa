import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Settings, Eye, Pencil, IndianRupee, Clock, Star, StarOff,
  Loader2, Save, X, Search, EyeOff, ArrowRight, Package
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { servicesData as DEFAULT_SERVICES } from "@/lib/servicesData";
import { PageTransition } from "@/components/PageTransition";

const STORAGE_KEY = "gmr_services_v1";
const easing = [0.22, 1, 0.36, 1];

const CATEGORIES = [
  "Tax Services", "GST Services", "Company Law",
  "Audit Services", "Compliance", "HR & Payroll", "Advisory",
];

// Get services from localStorage (or default)
export function getServicesData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  // Add visible=true to defaults
  return DEFAULT_SERVICES.map((s) => ({ ...s, visible: true }));
}

export default function ServicesManagement() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [services, setServices] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!authLoading && role !== "admin" && role !== "ca") {
      toast.error("Access denied. Admin or CA role required.");
      navigate("/dashboard");
    }
  }, [user, role, authLoading, navigate]);

  // Load services
  useEffect(() => {
    setServices(getServicesData());
  }, []);

  // Persist to localStorage
  const persist = useCallback((updated) => {
    setServices(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  // Open edit dialog
  const handleEdit = (service) => {
    setEditingService(service);
    setForm({ ...service, featuresText: (service.features || []).join("\n") });
    setDialogOpen(true);
  };

  // Save
  const handleSave = () => {
    if (!form.title?.trim()) {
      toast.error("Service title is required");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const features = form.featuresText
        ? form.featuresText.split("\n").map((f) => f.trim()).filter(Boolean)
        : editingService.features;

      const updated = services.map((s) =>
        s.id === editingService.id
          ? {
            ...s,
            title: form.title,
            shortDesc: form.shortDesc,
            description: form.description,
            price: parseFloat(form.price) || s.price,
            originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
            duration: form.duration,
            category: form.category,
            features,
            popular: form.popular,
            visible: form.visible !== false,
          }
          : s
      );
      persist(updated);
      toast.success(`${form.title} updated`);
      setSaving(false);
      setDialogOpen(false);
    }, 300);
  };

  // Toggle visibility
  const toggleVisibility = (id) => {
    const updated = services.map((s) =>
      s.id === id ? { ...s, visible: s.visible === false ? true : false } : s
    );
    persist(updated);
  };

  // Toggle popular
  const togglePopular = (id) => {
    const updated = services.map((s) =>
      s.id === id ? { ...s, popular: !s.popular } : s
    );
    persist(updated);
  };

  // Reset to defaults
  const handleReset = () => {
    if (!window.confirm("Reset all services to defaults? All custom changes will be lost.")) return;
    const defaults = DEFAULT_SERVICES.map((s) => ({ ...s, visible: true }));
    persist(defaults);
    toast.success("Services reset to defaults");
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // Filter services
  const filtered = services.filter((s) => {
    const matchesCat = filterCategory === "All" || s.category === filterCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || s.title.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const visibleCount = services.filter((s) => s.visible !== false).length;
  const popularCount = services.filter((s) => s.popular).length;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border/50 bg-foreground text-background py-10">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing }}>
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-6 w-6" />
                <h1 className="text-3xl font-semibold tracking-tight">Services Management</h1>
              </div>
              <p className="text-background/70">
                Edit pricing, descriptions, toggle visibility, and mark services as popular.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={() => navigate("/services")} variant="outline" size="sm"
                  className="gap-2 rounded-xl bg-white/10 hover:bg-white/20 border-white/10 text-background">
                  <Eye className="w-4 h-4" /> View Public Page
                </Button>
                <Button onClick={handleReset} variant="outline" size="sm"
                  className="gap-2 rounded-xl bg-white/10 hover:bg-white/20 border-white/10 text-background">
                  Reset to Defaults
                </Button>
                <Button onClick={() => navigate("/admin")} variant="outline" size="sm"
                  className="gap-2 rounded-xl bg-white/10 hover:bg-white/20 border-white/10 text-background">
                  ← Back to Admin
                </Button>
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="text-2xl font-bold">{services.length}</p>
                  <p className="text-xs text-background/50">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{visibleCount}</p>
                  <p className="text-xs text-background/50">Visible</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{popularCount}</p>
                  <p className="text-xs text-background/50">Popular</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Filters */}
        <div className="container mx-auto px-6 pt-6 pb-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..." className="pl-9 rounded-xl" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Services List */}
        <div className="container mx-auto px-6 py-4">
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((service, index) => (
                <motion.div key={service.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}>
                  <Card className={`overflow-hidden transition-all ${service.visible === false ? "opacity-50" : ""}`}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Service info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">{service.title}</h3>
                            {service.popular && (
                              <Badge className="text-[10px] px-1.5 py-0 bg-foreground text-background">
                                <Star className="w-2.5 h-2.5 mr-0.5 fill-current" /> Popular
                              </Badge>
                            )}
                            {service.visible === false && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                <EyeOff className="w-2.5 h-2.5 mr-0.5" /> Hidden
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{service.shortDesc}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <IndianRupee className="w-3 h-3" />
                              ₹{service.price?.toLocaleString("en-IN")}
                              {service.originalPrice && (
                                <span className="line-through text-muted-foreground/50 ml-1">
                                  ₹{service.originalPrice.toLocaleString("en-IN")}
                                </span>
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {service.duration}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {service.category}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(service)}
                            className="gap-1.5 text-xs h-8 rounded-lg">
                            <Pencil className="w-3 h-3" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => togglePopular(service.id)}
                            className="gap-1.5 text-xs h-8 rounded-lg" title="Toggle popular">
                            {service.popular
                              ? <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              : <StarOff className="w-3.5 h-3.5 text-muted-foreground" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleVisibility(service.id)}
                            className="gap-1.5 text-xs h-8 rounded-lg" title="Toggle visibility">
                            {service.visible !== false
                              ? <Eye className="w-3.5 h-3.5" />
                              : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false); }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>
                Update pricing, description, and other details for {editingService?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Service Title</Label>
                <Input value={form.title || ""} onChange={(e) => updateField("title", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input value={form.shortDesc || ""} onChange={(e) => updateField("shortDesc", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea value={form.description || ""} onChange={(e) => updateField("description", e.target.value)}
                  rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input type="number" min="0" value={form.price || ""} onChange={(e) => updateField("price", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Original Price (₹)</Label>
                  <Input type="number" min="0" value={form.originalPrice || ""}
                    onChange={(e) => updateField("originalPrice", e.target.value)}
                    placeholder="For strikethrough" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input value={form.duration || ""} onChange={(e) => updateField("duration", e.target.value)}
                    placeholder="3-5 business days" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category || ""} onValueChange={(v) => updateField("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea value={form.featuresText || ""} onChange={(e) => updateField("featuresText", e.target.value)}
                  rows={4} placeholder={"Complete ITR preparation & filing\nTax-saving recommendations\nDocument verification"} />
              </div>

              <div className="flex items-center justify-between pt-2 pb-1">
                <div className="flex items-center gap-3">
                  <Label htmlFor="popular-switch" className="text-sm cursor-pointer">Mark as Popular</Label>
                  <Switch id="popular-switch" checked={!!form.popular}
                    onCheckedChange={(checked) => updateField("popular", checked)} />
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="visible-switch" className="text-sm cursor-pointer">Visible</Label>
                  <Switch id="visible-switch" checked={form.visible !== false}
                    onCheckedChange={(checked) => updateField("visible", checked)} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
