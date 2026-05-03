import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { resolveServiceName } from "@/lib/resolveServiceName";
import {
  Shield,
  Briefcase,
  Clock,
  CheckCircle,
  FileText,
  Loader2,
  Users,
  IndianRupee,
  Send,
  Eye,
  UserCheck,
  CalendarDays } from
"lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ServiceStatusStepper } from "@/components/ServiceStatusStepper";
import { CADocumentReview } from "@/components/CADocumentReview";
import { CASendNote } from "@/components/CASendNote";
import { KanbanBoard } from "@/components/KanbanBoard";

import { ExportButton } from "@/components/ExportButton";
import { SkeletonDashboard } from "@/components/SkeletonLoaders";
import { LayoutGrid, List, BarChart3, Brain, AlertTriangle, Layers,
  Package, Settings2, UserPlus, CalendarDays as CalDays } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

const easing = [0.22, 1, 0.36, 1];

// ─── Admin quick-access grid categories ─────────────────────────────────────
const ADMIN_SECTIONS = [
  {
    category: "Operations",
    color: "from-blue-500 to-cyan-500",
    items: [
      { label: "Manage Clients", path: "/clients", icon: UserCheck, desc: "View & manage client accounts" },
      { label: "User Roles", path: "/admin/roles", icon: Shield, desc: "Promote users to CA or Admin" },
      { label: "Appointments", path: "/admin/appointments", icon: CalDays, desc: "Schedule & manage bookings" },
    ],
  },
  {
    category: "Content",
    color: "from-violet-500 to-purple-500",
    items: [
      { label: "Blog Manager", path: "/admin/blog", icon: FileText, desc: "Write & publish blog posts" },
      { label: "Reviews", path: "/admin/testimonials", icon: Users, desc: "Approve client testimonials" },
      { label: "Team / CAs", path: "/admin/team", icon: UserCheck, desc: "Add & edit team members" },
      { label: "Careers", path: "/admin/careers", icon: Briefcase, desc: "Manage job openings" },
    ],
  },
  {
    category: "Finance",
    color: "from-emerald-500 to-green-500",
    items: [

      { label: "Task Board", path: "/admin/tasks", icon: CheckCircle, desc: "Kanban task management" },
    ],
  },
  {
    category: "Services",
    color: "from-amber-500 to-orange-500",
    items: [
      { label: "Manage Services", path: "/admin/services", icon: Package, desc: "Edit pricing & visibility" },
    ],
  },
  {
    category: "AI & ML Tools",
    color: "from-pink-500 to-rose-500",
    items: [
      { label: "Client Insights", path: "/admin/ai-insights", icon: Brain, desc: "AI-powered client analysis" },
      { label: "Workload Optimizer", path: "/admin/workload", icon: Layers, desc: "Smart task distribution" },
      { label: "Anomaly Console", path: "/admin/anomalies", icon: AlertTriangle, desc: "Detect unusual patterns" },
    ],
  },
];

















const STATUS_OPTIONS = [
{ value: "pending", label: "Pending" },
{ value: "in_progress", label: "In Progress" },
{ value: "completed", label: "Completed" }];


export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateProgress, setUpdateProgress] = useState("");
  const [updateAmount, setUpdateAmount] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // list | kanban | analytics
  const [payments, setPayments] = useState([]);

  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase.
      from("service_requests").
      select(`
          id, user_id, service_id, status, progress, notes,
          amount, document_url, assigned_ca, created_at, updated_at,
          services (name)
        `).
      order("created_at", { ascending: false }).limit(1000);

      if (error) throw error;

      // Fetch profiles for each unique user_id
      
      const userIds = [...new Set((data || []).map((r) => r.user_id))];
      const { data: profiles } = await supabase.
      from("profiles").
      select("user_id, name, email, phone").
      in("user_id", userIds);

      const profileMap = new Map(
        
        (profiles || []).map((p) => [p.user_id, p])
      );

      
      const enriched = (data || []).map((r) => ({
        ...r,
        profiles: profileMap.get(r.user_id) || null
      }));

      setRequests(enriched);

      // Also fetch payments for revenue charts
      const { data: payData } = await supabase.from("payments").select("*").order("created_at", { ascending: true }).limit(1000);
      setPayments(payData || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load service requests");
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (!authLoading && role !== "admin" && role !== "ca") {
      toast.error("Access denied. Admin or CA role required.");
      navigate("/dashboard");
      return;
    }
    if (user) {
      fetchRequests();
    }
  }, [user, role, authLoading, navigate, fetchRequests]);

  const openManageDialog = (request) => {
    setSelectedRequest(request);
    setUpdateStatus(request.status);
    setUpdateProgress(String(request.progress));
    setUpdateAmount(request.amount ? String(request.amount) : "");
    setUpdateNotes(request.notes || "");
    setDialogOpen(true);
  };

  const handleSaveUpdate = async () => {
    if (!selectedRequest) return;
    setSaving(true);

    try {
      
      const updates = {
        status: updateStatus,
        progress: parseInt(updateProgress) || 0,
        notes: updateNotes || null
      };

      if (updateAmount) {
        updates.amount = parseFloat(updateAmount);
      }

      // If marking as completed, ensure amount is set
      if (updateStatus === "completed" && !updateAmount) {
        toast.error("Please set the final amount before marking as completed");
        setSaving(false);
        return;
      }

      // If marking as completed, set progress to 100
      if (updateStatus === "completed") {
        updates.progress = 100;
      }

      const { error } = await supabase.
      from("service_requests").
      update(updates).
      eq("id", selectedRequest.id);

      if (error) throw error;

      toast.success(
        updateStatus === "completed" ?
        "Service marked as completed. Client has been notified and can now make payment." :
        "Service request updated successfully"
      );

      // ── Send email notification to client ─────────────────────────────────
      try {
        const clientEmail = selectedRequest.profiles?.email;
        const clientName = selectedRequest.profiles?.name || "Client";
        if (clientEmail) {
          await supabase.functions.invoke("send-status-email", {
            body: {
              clientEmail,
              clientName,
              serviceName: resolveServiceName(selectedRequest),
              newStatus: updateStatus,
              notes: updateNotes || undefined,
              amount: updateAmount ? parseFloat(updateAmount) : undefined,
            },
          });
        }
      } catch (emailErr) {
        // Non-critical: log but don't block the success flow
        console.warn("Email notification failed (non-critical):", emailErr);
      }

      setDialogOpen(false);
      fetchRequests();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update service request");
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (event) => {
    if (!selectedRequest || !event.target.files?.[0]) return;
    setUploading(true);

    try {
      const file = event.target.files[0];
      const filePath = `${selectedRequest.user_id}/${selectedRequest.id}/${file.name}`;

      const { error: uploadError } = await supabase.storage.
      from("service-documents").
      upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase.
      from("service_requests").
      update({ document_url: filePath }).
      eq("id", selectedRequest.id);

      if (updateError) throw updateError;

      toast.success("Document uploaded successfully");
      setSelectedRequest({ ...selectedRequest, document_url: filePath });
      fetchRequests();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleAssignToMe = async (requestId) => {
    try {
      const { error } = await supabase.
      from("service_requests").
      update({ assigned_ca: user.id }).
      eq("id", requestId);

      if (error) throw error;
      toast.success("Request assigned to you");
      fetchRequests();
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error("Failed to assign request");
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { variant: "outline", label: "Pending" },
      in_progress: { variant: "secondary", label: "In Progress" },
      completed: { variant: "default", label: "Completed" },
      paid: { variant: "default", label: "Paid" },
      cancelled: { variant: "destructive", label: "Cancelled" }
    };
    const c = config[status] || { variant: "outline", label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>);

  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background/50 selection:bg-primary/20">
        {/* Dynamic Dark Header */}
        <div className="relative overflow-hidden border-b border-border/5 bg-slate-950 text-white pt-16 pb-12">
          {/* Abstract background effects */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950 pointer-events-none" />

          <div className="container relative z-10 mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easing }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl shadow-blue-500/20">
                  {role === "admin" ? <Shield className="h-7 w-7 text-blue-400" /> : <Briefcase className="h-7 w-7 text-blue-400" />}
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
                    {role === "admin" ? "Admin" : "CA"} Control Center
                  </h1>
                  <p className="text-slate-400 text-sm mt-1 font-medium">
                    Manage all platform features — service requests, content, finances, and AI tools.
                  </p>
                </div>
              </div>

              {/* ── Organized Admin Grid ───────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mt-10">
                {ADMIN_SECTIONS.map((section, idx) => (
                  <motion.div 
                    key={section.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + idx * 0.05, ease: easing }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${section.color}`} />
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                        {section.category}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => navigate(item.path)}
                          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.15] text-left transition-all duration-300 group shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${section.color} bg-opacity-10 group-hover:bg-opacity-20 flex items-center justify-center flex-shrink-0 border border-white/5 transition-all duration-300`}>
                            <item.icon className="w-4 h-4 text-white drop-shadow-md" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors truncate">{item.label}</p>
                            <p className="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors truncate mt-0.5">{item.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-10">
          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: easing }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {[
              { label: "All", count: requests.length, filter: "all", color: "from-slate-500 to-slate-400" },
              { label: "Pending", count: requests.filter((r) => r.status === "pending").length, filter: "pending", color: "from-amber-500 to-orange-400" },
              { label: "In Progress", count: requests.filter((r) => r.status === "in_progress").length, filter: "in_progress", color: "from-blue-500 to-cyan-400" },
              { label: "Completed", count: requests.filter((r) => r.status === "completed").length, filter: "completed", color: "from-emerald-500 to-green-400" },
              { label: "Paid", count: requests.filter((r) => r.status === "paid").length, filter: "paid", color: "from-purple-500 to-pink-400" }
            ].map((stat, i) => (
              <motion.button
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                key={stat.filter}
                onClick={() => setFilter(stat.filter)}
                className={`relative overflow-hidden p-6 rounded-2xl border text-left transition-all duration-300 group ${
                  filter === stat.filter 
                    ? "border-primary/30 bg-primary/5 shadow-[0_8px_30px_-12px_rgba(var(--primary),0.3)]" 
                    : "border-border/50 bg-background/50 hover:bg-card hover:border-primary/30 hover:shadow-xl"
                }`}
              >
                <div className="relative z-10">
                  <p className={`text-4xl font-bold tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-br ${stat.color}`}>
                    {stat.count}
                  </p>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${filter === stat.filter ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                    {stat.label}
                  </p>
                </div>
                {filter === stat.filter && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                )}
              </motion.button>
            ))}
          </motion.div>

          {/* View Toggle + Export */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: easing }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-1 bg-secondary/40 backdrop-blur-md rounded-xl p-1.5 border border-border/50">
              <button onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${viewMode === "list" ? "bg-background shadow-md text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-background/50"}`}>
                <List className="w-4 h-4" /> List View
              </button>
              <button onClick={() => setViewMode("kanban")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${viewMode === "kanban" ? "bg-background shadow-md text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-background/50"}`}>
                <LayoutGrid className="w-4 h-4" /> Kanban Board
              </button>
            </div>
            <ExportButton
              data={requests.map(r => ({ Service: resolveServiceName(r), Client: r.profiles?.name || "", Status: r.status, Progress: `${r.progress}%`, Amount: r.amount || "", Date: new Date(r.created_at).toLocaleDateString("en-IN") }))}
              filename="gmr_service_requests"
              columns={[{ key: "Service", label: "Service" }, { key: "Client", label: "Client" }, { key: "Status", label: "Status" }, { key: "Progress", label: "Progress" }, { key: "Amount", label: "Amount" }, { key: "Date", label: "Date" }]}
              label="Export CSV" 
              className="bg-secondary/50 hover:bg-secondary border border-border/50 shadow-sm"
            />
          </motion.div>

          {/* Kanban view */}
          {viewMode === "kanban" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
              <KanbanBoard requests={filteredRequests} onSelectRequest={openManageDialog} />
            </motion.div>
          )}

          {viewMode === "list" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Requests List */}
              {loadingRequests ? (
                <SkeletonDashboard />
              ) : filteredRequests.length === 0 ? (
                <Card className="border-dashed border-2 bg-background/50">
                  <CardContent className="py-20 text-center flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                      <FileText className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No service requests found</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      There are no service requests matching your current filter criteria.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request, idx) => (
                    <motion.div 
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="overflow-hidden border-border/40 hover:border-primary/20 transition-all duration-300 hover:shadow-xl bg-card/80 backdrop-blur-sm group">
                        <CardContent className="p-0">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 gap-6 relative">
                            {/* Decorative side accent */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                              request.status === 'completed' || request.status === 'paid' ? 'bg-emerald-500' :
                              request.status === 'in_progress' ? 'bg-blue-500' :
                              request.status === 'pending' ? 'bg-amber-500' : 'bg-slate-500'
                            }`} />
                            
                            <div className="flex-1 space-y-3 pl-2">
                              <div className="flex items-center gap-4">
                                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                  {resolveServiceName(request)}
                                </h3>
                                {getStatusBadge(request.status)}
                                {request.status === "paid" && (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium px-2.5 py-0.5">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                    Payment Received
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md">
                                  <Users className="w-4 h-4 text-primary/70" />
                                  <span className="text-foreground/90">{request.profiles?.name || "Unknown Client"}</span>
                                  <span className="opacity-70 font-normal">({request.profiles?.email || ""})</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-primary/70" />
                                  {new Date(request.created_at).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                  })}
                                </span>
                                {request.amount && (
                                  <span className="flex items-center gap-1.5">
                                    <IndianRupee className="w-4 h-4 text-emerald-500/80" />
                                    <span className="text-foreground font-semibold">₹{request.amount.toLocaleString()}</span>
                                  </span>
                                )}
                              </div>

                              <div className="pt-3">
                                <ServiceStatusStepper status={request.status} />
                              </div>

                              {request.progress > 0 && request.status !== "paid" && (
                                <div className="flex items-center gap-4 max-w-md pt-2">
                                  <Progress value={request.progress} className="h-2 flex-1 bg-secondary" indicatorClassName="bg-primary" />
                                  <span className="text-sm font-bold text-primary">{request.progress}%</span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3">
                              {!request.assigned_ca && role === "ca" && (
                                <Button
                                  variant="outline"
                                  className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground border-primary/20 shadow-sm"
                                  onClick={() => handleAssignToMe(request.id)}
                                >
                                  Assign to Me
                                </Button>
                              )}
                              {request.status !== "paid" && (
                                <Button 
                                  className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all" 
                                  onClick={() => openManageDialog(request)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Manage Details
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Single Manage Dialog outside the list */}
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            if (!open) setDialogOpen(false);
          }}>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-0 gap-0 rounded-2xl">
              <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    Manage: <span className="text-primary">{selectedRequest ? resolveServiceName(selectedRequest) : ""}</span>
                  </DialogTitle>
                  <DialogDescription className="text-sm font-medium mt-1">
                    Client: {selectedRequest?.profiles?.name} <span className="opacity-70 font-normal">({selectedRequest?.profiles?.email})</span>
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Status</Label>
                    <Select value={updateStatus} onValueChange={setUpdateStatus}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Progress (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="h-11 rounded-xl"
                      value={updateProgress}
                      onChange={(e) => setUpdateProgress(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-2.5 bg-secondary/30 p-4 rounded-xl border border-border/50">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" /> Final Amount (₹)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    className="h-11 rounded-xl bg-background border-border shadow-inner"
                    placeholder="Set the final billable amount"
                    value={updateAmount}
                    onChange={(e) => setUpdateAmount(e.target.value)} 
                  />
                  <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Required before marking as completed. Client will be charged this amount + 18% GST.</span>
                  </p>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Notes for Client</Label>
                  <Textarea
                    placeholder="Add notes visible to the client..."
                    className="rounded-xl resize-none shadow-inner bg-secondary/10"
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    rows={4} 
                  />
                </div>

                <Separator className="bg-border/50" />

                <div className="bg-secondary/20 p-4 rounded-xl border border-border/50">
                  {selectedRequest && (
                    <CADocumentReview
                      serviceRequestId={selectedRequest.id}
                      clientName={selectedRequest.profiles?.name} 
                    />
                  )}
                </div>

                <Separator className="bg-border/50" />

                <div className="bg-secondary/20 p-4 rounded-xl border border-border/50">
                  {selectedRequest && (
                    <CASendNote
                      targetUserId={selectedRequest.user_id}
                      clientName={selectedRequest.profiles?.name}
                      serviceRequestId={selectedRequest.id} 
                    />
                  )}
                </div>

                <Separator className="bg-border/50" />

                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Upload Final Documents</Label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Input
                          type="file"
                          onChange={handleDocumentUpload}
                          disabled={uploading}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer h-12 pt-2.5 rounded-xl border-dashed border-2"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" 
                        />
                      </div>
                      {uploading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                    </div>
                    {selectedRequest?.document_url && (
                      <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-2 rounded-lg border border-emerald-500/20 w-fit">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Document uploaded successfully</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 z-10 bg-background/80 backdrop-blur-xl border-t border-border/50 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 rounded-b-2xl">
                <Button variant="ghost" className="rounded-xl hover:bg-secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className={`rounded-xl shadow-lg hover:shadow-xl transition-all ${updateStatus === 'completed' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                  onClick={handleSaveUpdate} 
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {updateStatus === "completed" ? "Complete & Notify Client" : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PageTransition>
  );
}