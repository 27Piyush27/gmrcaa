import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  Eye } from
"lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ServiceStatusStepper } from "@/components/ServiceStatusStepper";
import { CADocumentReview } from "@/components/CADocumentReview";

















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

      // Update service request with document URL
      const { data: urlData } = supabase.storage.
      from("service-documents").
      getPublicUrl(filePath);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-foreground text-background py-10">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 mb-2">
            {role === "admin" ?
            <Shield className="h-6 w-6" /> :

            <Briefcase className="h-6 w-6" />
            }
            <h1 className="text-3xl font-semibold tracking-tight">
              {role === "admin" ? "Admin" : "CA"} Dashboard
            </h1>
          </div>
          <p className="text-background/70">
            Manage service requests, update statuses, and handle client deliverables.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
          { label: "All", count: requests.length, filter: "all" },
          { label: "Pending", count: requests.filter((r) => r.status === "pending").length, filter: "pending" },
          { label: "In Progress", count: requests.filter((r) => r.status === "in_progress" || r.status === "in_progress").length, filter: "in_progress" },
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
        </div>

        {/* Requests List */}
        {loadingRequests ?
        <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
          </div> :
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
                          {request.services?.name || request.service_id}
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
                Manage: {selectedRequest?.services?.name || selectedRequest?.service_id}
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
      </div>
    </div>);

}