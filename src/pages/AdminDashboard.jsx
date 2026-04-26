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
import { RevenueCharts } from "@/components/RevenueCharts";
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
      { label: "Revenue Dashboard", path: "/admin/revenue", icon: IndianRupee, desc: "Revenue & payment analytics" },
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
      order("created_at", { ascending: false });

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
      const { data: payData } = await supabase.from("payments").select("*").order("created_at", { ascending: true });
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-foreground text-background py-10">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easing }}>
          <div className="flex items-center gap-3 mb-2">
            {role === "admin" ?
            <Shield className="h-6 w-6" /> :
            <Briefcase className="h-6 w-6" />
            }
            <h1 className="text-3xl font-semibold tracking-tight">
              {role === "admin" ? "Admin" : "CA"} Control Center
            </h1>
          </div>
          <p className="text-background/70 mb-6">
            Manage all platform features — service requests, content, finances, and AI tools.
          </p>

          {/* ── Organized Admin Grid ───────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {ADMIN_SECTIONS.map((section) => (
              <div key={section.category}>
                <p className="text-[10px] text-background/40 uppercase tracking-widest mb-2 font-medium">
                  {section.category}
                </p>
                <div className="space-y-1.5">
                  {section.items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/[0.06] hover:border-white/[0.15] text-left transition-all group"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${section.color} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-background truncate">{item.label}</p>
                        <p className="text-[10px] text-background/40 truncate">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: easing }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
          { label: "All", count: requests.length, filter: "all" },
          { label: "Pending", count: requests.filter((r) => r.status === "pending").length, filter: "pending" },
          { label: "In Progress", count: requests.filter((r) => r.status === "in_progress").length, filter: "in_progress" },
          { label: "Completed", count: requests.filter((r) => r.status === "completed").length, filter: "completed" },
          { label: "Paid", count: requests.filter((r) => r.status === "paid").length, filter: "paid" }].
          map((stat) =>
          <button
            key={stat.filter}
            onClick={() => setFilter(stat.filter)}
            className={`p-4 rounded-xl border text-left transition-colors ${filter === stat.filter ?
            "border-foreground bg-foreground text-background" :
            "border-border/50 hover:border-border"}`
            }>
            
              <p className="text-2xl font-semibold">{stat.count}</p>
              <p className={`text-xs ${filter === stat.filter ? "text-background/70" : "text-muted-foreground"}`}>
                {stat.label}
              </p>
            </button>
          )}
        </motion.div>

        {/* View Toggle + Export */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: easing }}
          className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1">
            <button onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${viewMode === "kanban" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
            <button onClick={() => setViewMode("analytics")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${viewMode === "analytics" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </button>
          </div>
          <ExportButton
            data={requests.map(r => ({ Service: resolveServiceName(r), Client: r.profiles?.name || "", Status: r.status, Progress: `${r.progress}%`, Amount: r.amount || "", Date: new Date(r.created_at).toLocaleDateString("en-IN") }))}
            filename="gmr_service_requests"
            columns={[{ key: "Service", label: "Service" }, { key: "Client", label: "Client" }, { key: "Status", label: "Status" }, { key: "Progress", label: "Progress" }, { key: "Amount", label: "Amount" }, { key: "Date", label: "Date" }]}
            label="Export CSV" />
        </motion.div>

        {/* Analytics view */}
        {viewMode === "analytics" && (
          <div className="space-y-6 mb-8">
            <RevenueCharts payments={payments} />
          </div>
        )}

        {/* Kanban view */}
        {viewMode === "kanban" && (
          <div className="mb-8">
            <KanbanBoard requests={filteredRequests} onSelectRequest={openManageDialog} />
          </div>
        )}

        {viewMode === "list" && (
        <>
        {/* Requests List */}
        {loadingRequests ?
        <SkeletonDashboard /> :
        filteredRequests.length === 0 ?
        <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No service requests found</p>
            </CardContent>
          </Card> :

        <div className="space-y-4">
            {filteredRequests.map((request) =>
          <Card key={request.id} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          {resolveServiceName(request)}
                        </h3>
                        {getStatusBadge(request.status)}
                        {request.status === "paid" &&
                    <Badge variant="outline" className="text-green-600 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Payment Received
                          </Badge>
                    }
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {request.profiles?.name || "Unknown Client"} ({request.profiles?.email || ""})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(request.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                        </span>
                        {request.amount &&
                    <span className="flex items-center gap-1">
                            <IndianRupee className="w-3.5 h-3.5" />
                            ₹{request.amount.toLocaleString()}
                          </span>
                    }
                      </div>

                      <ServiceStatusStepper status={request.status} />

                      {request.progress > 0 && request.status !== "paid" &&
                  <div className="flex items-center gap-3 max-w-sm">
                          <Progress value={request.progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground">{request.progress}%</span>
                        </div>
                  }
                    </div>

                    <div className="flex items-center gap-2">
                      {!request.assigned_ca && role === "ca" &&
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAssignToMe(request.id)}>
                    
                          Assign to Me
                        </Button>
                  }
                      {request.status !== "paid" &&
                  <Button size="sm" onClick={() => openManageDialog(request)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                  }
                    </div>
                  </div>
                </CardContent>
              </Card>
          )}
          </div>
        }

        {/* Single Manage Dialog outside the list */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open) setDialogOpen(false);
        }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Manage: {selectedRequest ? resolveServiceName(selectedRequest) : ""}
              </DialogTitle>
              <DialogDescription>
                Client: {selectedRequest?.profiles?.name} ({selectedRequest?.profiles?.email})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={updateStatus} onValueChange={setUpdateStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) =>
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Progress (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={updateProgress}
                  onChange={(e) => setUpdateProgress(e.target.value)} />
                
              </div>

              <div className="space-y-2">
                <Label>Final Amount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Set the final billable amount"
                  value={updateAmount}
                  onChange={(e) => setUpdateAmount(e.target.value)} />
                
                <p className="text-xs text-muted-foreground">
                  Required before marking as completed. Client will be charged this amount + 18% GST.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Notes for Client</Label>
                <Textarea
                  placeholder="Add notes visible to the client..."
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  rows={3} />
                
              </div>

              <Separator />

              {selectedRequest &&
              <CADocumentReview
                serviceRequestId={selectedRequest.id}
                clientName={selectedRequest.profiles?.name} />
              }

              <Separator />

              {selectedRequest &&
              <CASendNote
                targetUserId={selectedRequest.user_id}
                clientName={selectedRequest.profiles?.name}
                serviceRequestId={selectedRequest.id} />
              }

              <Separator />

              <div className="space-y-2">
                <Label>Upload Final Documents</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={handleDocumentUpload}
                    disabled={uploading}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" />
                  
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {selectedRequest?.document_url &&
                <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Document uploaded
                  </p>
                }
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUpdate} disabled={saving}>
                  {saving ?
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> :

                  <Send className="w-4 h-4 mr-2" />
                  }
                  {updateStatus === "completed" ? "Complete & Notify Client" : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
      )}
      </div>
    </div>
    </PageTransition>);

}