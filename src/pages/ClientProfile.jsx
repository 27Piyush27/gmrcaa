import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, User, Mail, Phone, Building2, FileText,
  IndianRupee, Calendar, CheckCircle, Clock, AlertCircle, CreditCard,
  FolderOpen, Download
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const easing = [0.22, 1, 0.36, 1];

const STATUS_STYLES = {
  pending:     { badge: "outline",      label: "Pending" },
  in_progress: { badge: "secondary",    label: "In Progress" },
  completed:   { badge: "default",      label: "Completed" },
  paid:        { badge: "default",      label: "Paid" },
  cancelled:   { badge: "destructive",  label: "Cancelled" },
};

export default function ClientProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user, role, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!authLoading && user && role !== null && role !== "admin" && role !== "ca") {
      toast.error("Access denied"); navigate("/dashboard");
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (user && userId && (role === "admin" || role === "ca")) fetchClientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userId, role]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      setProfile(profileData);

      // Fetch service requests
      const { data: reqData } = await supabase
        .from("service_requests")
        .select("id, service_id, status, progress, amount, notes, created_at, updated_at, services(name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setRequests(reqData || []);

      // Fetch payments
      const { data: payData } = await supabase
        .from("payments")
        .select("id, amount, gst_amount, total_amount, status, payment_method, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setPayments(payData || []);

      // Fetch documents
      const { data: docData } = await supabase
        .from("client_documents")
        .select("id, file_name, file_size, mime_type, reviewed, created_at, service_request_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setDocuments(docData || []);
    } catch (err) {
      console.error("Error loading client:", err);
      toast.error("Failed to load client data");
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = payments.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.total_amount || 0), 0);
  const activeServices = requests.filter(r => r.status === "in_progress").length;

  if (authLoading || !user || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>;
  }

  if (!profile) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Client not found.</p>
            <Button variant="outline" onClick={() => navigate("/clients")} className="mt-4">Back to Clients</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const initials = (profile.name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-foreground text-background py-10">
          <div className="container mx-auto px-6">
            <Button variant="ghost" onClick={() => navigate("/clients")}
              className="text-background/80 hover:text-background hover:bg-background/10 mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clients
            </Button>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing }} className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{profile.name}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-background/60">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{profile.email}</span>
                  {profile.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{profile.phone}</span>}
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { label: "Services", value: requests.length, icon: FileText },
                { label: "Active", value: activeServices, icon: Clock },
                { label: "Documents", value: documents.length, icon: FolderOpen },
                { label: "Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: IndianRupee },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-4 rounded-xl bg-white/10 border border-white/10">
                  <Icon className="w-4 h-4 text-background/50 mb-2" />
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-background/50 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Service Requests */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: easing }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Service Requests</h2>
            {requests.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No service requests</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {requests.map(req => {
                  const cfg = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
                  return (
                    <Card key={req.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{req.services?.name || req.service_id}</span>
                              <Badge variant={cfg.badge} className="text-[10px]">{cfg.label}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(req.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                              {req.amount && <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />₹{Number(req.amount).toLocaleString("en-IN")}</span>}
                              <span>Progress: {req.progress}%</span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs"
                            onClick={() => navigate("/admin")}>
                            Manage
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Payments */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: easing }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Payment History</h2>
            {payments.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No payments</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {payments.map(pay => (
                  <Card key={pay.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-medium">₹{Number(pay.total_amount).toLocaleString("en-IN")}</span>
                          <Badge variant={pay.status === "completed" ? "default" : "outline"} className="text-[10px]">{pay.status}</Badge>
                          {pay.payment_method && <span className="text-xs text-muted-foreground">{pay.payment_method}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(pay.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>

          {/* Documents */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: easing }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FolderOpen className="w-5 h-5" /> Documents</h2>
            {documents.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No documents uploaded</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <Card key={doc.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.file_name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{new Date(doc.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                            <span className={doc.reviewed ? "text-emerald-600" : "text-amber-600"}>
                              {doc.reviewed ? "✓ Reviewed" : "⏳ Pending review"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
