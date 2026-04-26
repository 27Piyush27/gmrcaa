import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Shield, Users, Plus, Pencil, Trash2, Eye, EyeOff, GripVertical,
  ArrowUp, ArrowDown, Loader2, Award, Save, X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/PageTransition";

const STORAGE_KEY = "gmr_team_v1";
const easing = [0.22, 1, 0.36, 1];

// Default team data — used as fallback if localStorage is empty
const DEFAULT_TEAM = [
  {
    id: "1", name: "CA Gaurav Mittal", role: "Founding Partner", emoji: "👨‍💼",
    specialization: "Direct Tax, International Taxation, Transfer Pricing",
    experience: "15+ years", qualifications: "FCA, DISA, B.Com (H)",
    bio: "A seasoned tax professional specializing in complex direct tax matters and cross-border transactions.",
    visible: true,
  },
  {
    id: "2", name: "CA Ritu Sharma", role: "Senior Partner", emoji: "👩‍💼",
    specialization: "GST, Indirect Tax, Business Advisory",
    experience: "12+ years", qualifications: "ACA, M.Com",
    bio: "Expert in GST compliance and indirect tax planning, helping businesses streamline their tax obligations.",
    visible: true,
  },
  {
    id: "3", name: "CA Priyanka Verma", role: "Partner - Corporate", emoji: "👩‍💼",
    specialization: "Company Law, Startup Advisory, Compliance",
    experience: "10+ years", qualifications: "ACA, CS, LLB",
    bio: "Specialist in corporate law and startup ecosystem, guiding companies from incorporation to IPO readiness.",
    visible: true,
  },
  {
    id: "4", name: "CA Arun Kapoor", role: "Partner - Audit", emoji: "👨‍💼",
    specialization: "Statutory Audit, Internal Audit, Risk Advisory",
    experience: "14+ years", qualifications: "FCA, CIA, CISA",
    bio: "Leading our audit practice with expertise in both statutory and internal audit across diverse industries.",
    visible: true,
  },
  {
    id: "5", name: "Neha Singh", role: "Manager - Tax", emoji: "👩‍💻",
    specialization: "ITR Filing, Tax Planning, TDS",
    experience: "6+ years", qualifications: "CA Inter, MBA Finance",
    bio: "Manages day-to-day tax filing operations ensuring timely and accurate returns for all our clients.",
    visible: true,
  },
  {
    id: "6", name: "Rohit Mehra", role: "Manager - GST", emoji: "👨‍💻",
    specialization: "GST Returns, E-way Bills, GST Audit",
    experience: "5+ years", qualifications: "CA Inter, B.Com",
    bio: "Handles GST compliance for 200+ clients, ensuring error-free filing and timely updates on regulatory changes.",
    visible: true,
  },
];

// Get team from localStorage (or default)
export function getTeamData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_TEAM;
}

const EMOJI_OPTIONS = ["👨‍💼", "👩‍💼", "👨‍💻", "👩‍💻", "👨‍🏫", "👩‍🏫", "🧑‍💼", "🧑‍💻"];

const EMPTY_MEMBER = {
  name: "", role: "", emoji: "👨‍💼", specialization: "",
  experience: "", qualifications: "", bio: "", visible: true,
};

export default function TeamManagement() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [team, setTeam] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null); // null = new
  const [form, setForm] = useState({ ...EMPTY_MEMBER });
  const [saving, setSaving] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!authLoading && role !== "admin" && role !== "ca") {
      toast.error("Access denied. Admin or CA role required.");
      navigate("/dashboard");
    }
  }, [user, role, authLoading, navigate]);

  // Load team
  useEffect(() => {
    setTeam(getTeamData());
  }, []);

  // Persist to localStorage
  const persist = useCallback((updated) => {
    setTeam(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  // Open add dialog
  const handleAdd = () => {
    setEditingMember(null);
    setForm({ ...EMPTY_MEMBER });
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (member) => {
    setEditingMember(member);
    setForm({ ...member });
    setDialogOpen(true);
  };

  // Save (create or update)
  const handleSave = () => {
    if (!form.name.trim() || !form.role.trim()) {
      toast.error("Name and role are required");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      if (editingMember) {
        // Update
        const updated = team.map((m) => m.id === editingMember.id ? { ...form, id: m.id } : m);
        persist(updated);
        toast.success(`${form.name} updated`);
      } else {
        // Create
        const newMember = { ...form, id: String(Date.now()) };
        persist([...team, newMember]);
        toast.success(`${form.name} added to team`);
      }
      setSaving(false);
      setDialogOpen(false);
    }, 300);
  };

  // Delete
  const handleDelete = (member) => {
    if (!window.confirm(`Remove ${member.name} from the team?`)) return;
    persist(team.filter((m) => m.id !== member.id));
    toast.success(`${member.name} removed`);
  };

  // Toggle visibility
  const toggleVisibility = (id) => {
    const updated = team.map((m) =>
      m.id === id ? { ...m, visible: !m.visible } : m
    );
    persist(updated);
  };

  // Move up/down
  const moveUp = (index) => {
    if (index === 0) return;
    const arr = [...team];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    persist(arr);
  };
  const moveDown = (index) => {
    if (index === team.length - 1) return;
    const arr = [...team];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    persist(arr);
  };

  // Reset to defaults
  const handleReset = () => {
    if (!window.confirm("Reset team to defaults? All custom changes will be lost.")) return;
    persist(DEFAULT_TEAM);
    toast.success("Team reset to defaults");
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

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
                <Users className="h-6 w-6" />
                <h1 className="text-3xl font-semibold tracking-tight">Team Management</h1>
              </div>
              <p className="text-background/70">
                Add, edit, or remove team members. Changes appear on the public Team page instantly.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={handleAdd} variant="secondary" size="sm" className="gap-2 rounded-xl">
                  <Plus className="w-4 h-4" /> Add Team Member
                </Button>
                <Button onClick={() => navigate("/team")} variant="outline" size="sm"
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
            </motion.div>
          </div>
        </div>

        {/* Team List */}
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {team.map((member, index) => (
                <motion.div key={member.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}>
                  <Card className={`relative overflow-hidden transition-all ${!member.visible ? "opacity-60" : ""}`}>
                    <CardContent className="p-5">
                      {/* Order badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        <button onClick={() => moveUp(index)} className="p-1 rounded hover:bg-secondary transition-colors"
                          disabled={index === 0}>
                          <ArrowUp className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => moveDown(index)} className="p-1 rounded hover:bg-secondary transition-colors"
                          disabled={index === team.length - 1}>
                          <ArrowDown className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Member info */}
                      <div className="flex items-start gap-4">
                        <span className="text-4xl flex-shrink-0">{member.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{member.name}</h3>
                          <p className="text-xs text-accent font-medium">{member.role}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{member.bio}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              <Award className="w-2.5 h-2.5 mr-1" />
                              {member.qualifications}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border/40">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(member)}
                          className="flex-1 gap-1.5 text-xs h-8 rounded-lg">
                          <Pencil className="w-3 h-3" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleVisibility(member.id)}
                          className="gap-1.5 text-xs h-8 rounded-lg">
                          {member.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(member)}
                          className="gap-1.5 text-xs h-8 rounded-lg text-red-500 hover:text-red-600 hover:border-red-200">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add card */}
            <motion.button
              onClick={handleAdd}
              className="border-2 border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all group min-h-[200px]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Add Team Member</span>
            </motion.button>
          </div>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false); }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMember ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
              <DialogDescription>
                {editingMember ? `Editing ${editingMember.name}` : "Fill in the details for the new team member"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Preview */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/40 flex items-center gap-4">
                <span className="text-4xl">{form.emoji}</span>
                <div>
                  <p className="font-semibold text-sm">{form.name || "Member Name"}</p>
                  <p className="text-xs text-accent">{form.role || "Role"}</p>
                </div>
              </div>

              {/* Emoji picker */}
              <div className="space-y-2">
                <Label>Avatar Emoji</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button key={e} onClick={() => updateField("emoji", e)}
                      className={`text-2xl p-2 rounded-xl border transition-all ${form.emoji === e ? "border-foreground bg-secondary" : "border-border/40 hover:border-border"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={form.name} onChange={(e) => updateField("name", e.target.value)}
                    placeholder="CA John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Role / Title *</Label>
                  <Input value={form.role} onChange={(e) => updateField("role", e.target.value)}
                    placeholder="Senior Partner" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Experience</Label>
                  <Input value={form.experience} onChange={(e) => updateField("experience", e.target.value)}
                    placeholder="10+ years" />
                </div>
                <div className="space-y-2">
                  <Label>Qualifications</Label>
                  <Input value={form.qualifications} onChange={(e) => updateField("qualifications", e.target.value)}
                    placeholder="FCA, DISA, B.Com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Specialization</Label>
                <Input value={form.specialization} onChange={(e) => updateField("specialization", e.target.value)}
                  placeholder="Direct Tax, GST, Audit" />
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={form.bio} onChange={(e) => updateField("bio", e.target.value)}
                  placeholder="Brief description about this team member..."
                  rows={3} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingMember ? "Save Changes" : "Add Member"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
