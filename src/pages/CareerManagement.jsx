import { useState, useEffect } from "react";
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
  Briefcase, ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff,
  Search, X, MapPin, Clock, GraduationCap, Star, Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const easing = [0.22, 1, 0.36, 1];

const STORAGE_KEY = "gmr_career_positions";

const DEPARTMENTS = [
  "Audit & Assurance",
  "Tax Advisory",
  "GST & Indirect Tax",
  "Articleship Program",
  "Corporate Advisory",
  "Accounting & Bookkeeping",
  "Other",
];

const POSITION_TYPES = ["Full-Time", "Part-Time", "Internship (3 Years)", "Internship (6 Months)", "Contract"];

const COLORS = [
  { value: "blue", label: "Blue", gradient: "from-blue-500 to-cyan-400" },
  { value: "emerald", label: "Emerald", gradient: "from-emerald-500 to-teal-400" },
  { value: "purple", label: "Purple", gradient: "from-purple-500 to-indigo-400" },
  { value: "orange", label: "Orange", gradient: "from-orange-500 to-amber-400" },
  { value: "rose", label: "Rose", gradient: "from-rose-500 to-pink-400" },
  { value: "sky", label: "Sky", gradient: "from-sky-500 to-blue-400" },
];

// Default positions (same as in Careers.jsx) used as seed data
const DEFAULT_POSITIONS = [
  {
    id: "audit-senior",
    title: "Senior Associate – Audit & Assurance",
    department: "Audit & Assurance",
    type: "Full-Time",
    location: "Gurgaon / Delhi",
    experience: "3–5 years",
    color: "blue",
    description:
      "Join our audit practice and lead engagement teams for statutory and internal audits across diverse industries including manufacturing, NBFC, and IT.",
    responsibilities: [
      "Lead and execute statutory audits under Companies Act, 2013",
      "Conduct internal audits and prepare risk assessment reports",
      "Coordinate with senior management and audit committees",
      "Review financial statements and ensure compliance with Ind AS",
      "Mentor and supervise junior team members",
    ],
    requirements: [
      "Qualified CA (ACA / FCA)",
      "3–5 years of post-qualification experience in audit",
      "Strong knowledge of Ind AS, SA standards, and Companies Act",
      "Excellent analytical and communication skills",
      "Proficiency in audit tools and MS Excel",
    ],
    published: true,
    highlight: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "tax-associate",
    title: "Associate – Direct Tax Advisory",
    department: "Tax Advisory",
    type: "Full-Time",
    location: "Gurgaon / Delhi",
    experience: "1–3 years",
    color: "emerald",
    description:
      "Work on complex direct tax matters including income tax return filings, assessments, appeals, and tax planning for individuals and corporates.",
    responsibilities: [
      "Prepare and file Income Tax Returns for individuals, firms, and companies",
      "Handle income tax assessments, notices, and appellate proceedings",
      "Tax planning and advisory for HNI clients and corporates",
      "Research and draft opinions on complex tax matters",
      "Assist in transfer pricing documentation",
    ],
    requirements: [
      "Qualified CA (ACA) or CA-Inter with relevant experience",
      "1–3 years of experience in direct taxation",
      "Knowledge of Income Tax Act, 1961 and recent amendments",
      "Familiarity with income tax e-filing portal and procedures",
      "Strong research and drafting skills",
    ],
    published: true,
    highlight: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "gst-executive",
    title: "Executive – GST & Indirect Tax",
    department: "GST & Indirect Tax",
    type: "Full-Time",
    location: "Gurgaon",
    experience: "2–4 years",
    color: "purple",
    description:
      "Manage GST compliance for a portfolio of 200+ clients, ensure timely filing, and handle audits, refunds, and department assessments.",
    responsibilities: [
      "Prepare and file GSTR-1, GSTR-3B, GSTR-9 & GSTR-9C",
      "Handle GST audits, assessments, and departmental queries",
      "Advise clients on GST implications of business transactions",
      "Assist in GST refund applications and follow-ups",
      "Keep abreast of GST amendments and circulars",
    ],
    requirements: [
      "CA-Inter / B.Com with GST certification preferred",
      "2–4 years of hands-on GST compliance experience",
      "Thorough knowledge of CGST/SGST/IGST Acts and Rules",
      "Experience with GST portal and e-invoicing",
      "Attention to detail and ability to manage deadlines",
    ],
    published: true,
    highlight: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "ca-articleship",
    title: "CA Articleship – Internship for CA Students",
    department: "Articleship Program",
    type: "Internship (3 Years)",
    location: "Gurgaon / Delhi",
    experience: "CA Students (IPCC / Inter cleared)",
    color: "orange",
    description:
      "Begin your CA journey with hands-on experience at one of Delhi-NCR's most trusted firms. Get exposure to audit, taxation, GST, and corporate advisory under the mentorship of experienced partners.",
    responsibilities: [
      "Assist in statutory and internal audits of various entities",
      "Prepare income tax computations and file returns",
      "Support GST compliance and reconciliation work",
      "Participate in company incorporation and ROC filings",
      "Exposure to real client interactions and firm-wide projects",
    ],
    requirements: [
      "Cleared CA IPCC / CA Intermediate examination",
      "Registered with ICAI for articleship",
      "Strong academic record and commitment to learning",
      "Good communication skills in English and Hindi",
      "Willingness to work in a fast-paced professional environment",
    ],
    published: true,
    highlight: true,
    created_at: new Date().toISOString(),
  },
];

function loadPositions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  // Seed with defaults on first load
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_POSITIONS));
  return DEFAULT_POSITIONS;
}

function savePositions(positions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

const emptyForm = {
  title: "",
  department: "Audit & Assurance",
  type: "Full-Time",
  location: "Gurgaon / Delhi",
  experience: "",
  color: "blue",
  description: "",
  responsibilities: "",
  requirements: "",
  published: true,
  highlight: false,
};

export default function CareerManagement() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!authLoading && user && role !== null && role !== "admin" && role !== "ca") {
      toast.error("Access denied"); navigate("/dashboard");
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (user && (role === "admin" || role === "ca")) {
      setPositions(loadPositions());
      setLoading(false);
    }
  }, [user, role]);

  const generateId = (title) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

  const openCreateDialog = () => {
    setEditing(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (pos) => {
    setEditing(pos.id);
    setFormData({
      title: pos.title || "",
      department: pos.department || "Audit & Assurance",
      type: pos.type || "Full-Time",
      location: pos.location || "",
      experience: pos.experience || "",
      color: pos.color || "blue",
      description: pos.description || "",
      responsibilities: Array.isArray(pos.responsibilities) ? pos.responsibilities.join("\n") : "",
      requirements: Array.isArray(pos.requirements) ? pos.requirements.join("\n") : "",
      published: pos.published !== false,
      highlight: pos.highlight || false,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) { toast.error("Title is required"); return; }
    if (!formData.description.trim()) { toast.error("Description is required"); return; }

    const responsibilities = formData.responsibilities
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const requirements = formData.requirements
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (responsibilities.length === 0) {
      toast.error("Add at least one responsibility (one per line)"); return;
    }
    if (requirements.length === 0) {
      toast.error("Add at least one requirement (one per line)"); return;
    }

    const payload = {
      title: formData.title.trim(),
      department: formData.department,
      type: formData.type,
      location: formData.location.trim() || "Gurgaon / Delhi",
      experience: formData.experience.trim(),
      color: formData.color,
      description: formData.description.trim(),
      responsibilities,
      requirements,
      published: formData.published,
      highlight: formData.highlight,
    };

    let updated;
    if (editing) {
      updated = positions.map((p) =>
        p.id === editing ? { ...p, ...payload, updated_at: new Date().toISOString() } : p
      );
      toast.success("Position updated");
    } else {
      const newPos = {
        ...payload,
        id: generateId(formData.title),
        created_at: new Date().toISOString(),
      };
      updated = [newPos, ...positions];
      toast.success("Position created");
    }
    setPositions(updated);
    savePositions(updated);
    setDialogOpen(false);
  };

  const togglePublish = (pos) => {
    const updated = positions.map((p) =>
      p.id === pos.id ? { ...p, published: !p.published } : p
    );
    setPositions(updated);
    savePositions(updated);
    toast.success(pos.published ? "Position hidden from public page" : "Position published!");
  };

  const toggleHighlight = (pos) => {
    const updated = positions.map((p) =>
      p.id === pos.id ? { ...p, highlight: !p.highlight } : p
    );
    setPositions(updated);
    savePositions(updated);
    toast.success(pos.highlight ? "Highlight removed" : "Position highlighted as featured!");
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this position permanently?")) return;
    const updated = positions.filter((p) => p.id !== id);
    setPositions(updated);
    savePositions(updated);
    toast.success("Position deleted");
  };

  const filtered = positions.filter((p) => {
    if (filter === "published" && !p.published) return false;
    if (filter === "draft" && p.published) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.department || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const publishedCount = positions.filter((p) => p.published).length;
  const colorObj = (c) => COLORS.find((cl) => cl.value === c) || COLORS[0];

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
        <div className="bg-foreground text-background py-10">
          <div className="container mx-auto px-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin")}
              className="text-background/80 hover:text-background hover:bg-background/10 mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="h-6 w-6" />
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Career Management
                  </h1>
                </div>
                <p className="text-background/70">
                  Create, edit, and manage career openings for GMR & Associates.
                </p>
              </div>
              <Button
                onClick={openCreateDialog}
                className="gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-background"
              >
                <Plus className="w-4 h-4" /> New Position
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 max-w-lg">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
                <p className="text-2xl font-bold">{positions.length}</p>
                <p className="text-xs text-background/50">Total</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
                <p className="text-2xl font-bold">{publishedCount}</p>
                <p className="text-xs text-background/50">Published</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
                <p className="text-2xl font-bold">
                  {positions.length - publishedCount}
                </p>
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
              <input
                type="text"
                placeholder="Search positions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-border/50 bg-secondary/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {["all", "published", "draft"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium capitalize transition-colors ${
                    filter === f
                      ? "bg-foreground text-background border-foreground"
                      : "border-border/50 text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Positions list */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {search
                    ? "No positions match your search"
                    : "No career positions yet."}
                </p>
                <Button onClick={openCreateDialog} className="gap-2 rounded-xl">
                  <Plus className="w-4 h-4" /> Create First Position
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((pos, i) => (
                <motion.div
                  key={pos.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3, ease: easing }}
                >
                  <Card
                    className={`border-border/50 hover:border-border transition-colors ${
                      pos.highlight
                        ? "ring-1 ring-orange-300 dark:ring-orange-700"
                        : ""
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div
                              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                                colorObj(pos.color).gradient
                              } flex items-center justify-center flex-shrink-0`}
                            >
                              <Briefcase className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="font-semibold text-sm">
                              {pos.title}
                            </h3>
                            <Badge
                              variant={pos.published ? "default" : "outline"}
                              className="text-[10px]"
                            >
                              {pos.published ? "Published" : "Draft"}
                            </Badge>
                            {pos.highlight && (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-orange-300 text-orange-600"
                              >
                                <Star className="w-2.5 h-2.5 mr-0.5" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pl-10">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {pos.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {pos.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {pos.type}
                            </span>
                            {pos.experience && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                {pos.experience}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title={
                              pos.published ? "Unpublish" : "Publish"
                            }
                            onClick={() => togglePublish(pos)}
                          >
                            {pos.published ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title={
                              pos.highlight
                                ? "Remove highlight"
                                : "Feature this position"
                            }
                            onClick={() => toggleHighlight(pos)}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                pos.highlight
                                  ? "text-orange-500 fill-orange-500"
                                  : ""
                              }`}
                            />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditDialog(pos)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(pos.id)}
                          >
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
              <DialogTitle>
                {editing ? "Edit Position" : "New Career Position"}
              </DialogTitle>
              <DialogDescription>
                Fill in the details below. Responsibilities and requirements go
                one per line.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Position Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Senior Associate – Audit & Assurance"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, department: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Position Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, type: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Gurgaon / Delhi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Experience Required</Label>
                  <Input
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        experience: e.target.value,
                      }))
                    }
                    placeholder="e.g. 3–5 years"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, color: c.value }))
                      }
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                        c.gradient
                      } transition-all ${
                        formData.color === c.value
                          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of the role…"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Key Responsibilities * (one per line)</Label>
                <Textarea
                  value={formData.responsibilities}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      responsibilities: e.target.value,
                    }))
                  }
                  placeholder={"Lead statutory audits\nConduct risk assessments\nMentor junior staff"}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Requirements * (one per line)</Label>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requirements: e.target.value,
                    }))
                  }
                  placeholder={"Qualified CA (ACA/FCA)\n3+ years experience\nStrong communication skills"}
                  rows={5}
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        published: e.target.checked,
                      }))
                    }
                    className="rounded border-border"
                  />
                  <span className="text-sm font-medium">Published</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.highlight}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        highlight: e.target.checked,
                      }))
                    }
                    className="rounded border-border"
                  />
                  <span className="text-sm font-medium">
                    ⭐ Featured Position
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  {editing ? "Save Changes" : "Create Position"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
