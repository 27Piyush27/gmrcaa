import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users, Search, FileText, CheckCircle, Clock,
  CreditCard, ArrowRight, Mail, Phone,
  Briefcase, TrendingUp, AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";
import { SkeletonCard } from "@/components/SkeletonLoaders";
import { toast } from "sonner";

const easing = [0.22, 1, 0.36, 1];

function StatPill({ label, value, color }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {value} {label}
    </span>
  );
}

export default function ClientManagement() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchClients = useCallback(async () => {
    try {
      // Step 1: Get all service requests (no profile join — FK goes through auth.users, not directly to profiles)
      const { data: requests, error } = await supabase
        .from("service_requests")
        .select(`id, user_id, status, amount, created_at, services(name)`)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Step 2: Fetch profiles for all unique user_ids
      const userIds = [...new Set((requests || []).map(r => r.user_id))];
      let profileMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, email, phone")
          .in("user_id", userIds);
        profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      }

      // Step 3: Group by client
      const clientMap = new Map();
      for (const req of requests || []) {
        const uid = req.user_id;
        const profile = profileMap.get(uid);
        if (!clientMap.has(uid)) {
          clientMap.set(uid, {
            user_id: uid,
            name: profile?.name || "Unknown",
            email: profile?.email || "",
            phone: profile?.phone || "",
            requests: [],
            totalPaid: 0,
          });
        }
        const client = clientMap.get(uid);
        client.requests.push(req);
        if (req.status === "paid") client.totalPaid += req.amount || 0;
      }

      setClients(Array.from(clientMap.values()));
    } catch (err) {
      console.error("Error fetching clients:", err);
      toast.error("Failed to load client data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!authLoading && role !== "admin" && role !== "ca") {
      toast.error("Access denied");
      navigate("/dashboard");
      return;
    }
    if (user) fetchClients();
  }, [user, role, authLoading, navigate, fetchClients]);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = clients.reduce((s, c) => s + c.totalPaid, 0);
  const totalRequests = clients.reduce((s, c) => s + c.requests.length, 0);
  const activeClients = clients.filter(c => c.requests.some(r => r.status === "in_progress")).length;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-foreground text-background py-12">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easing }}>
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6" />
                <h1 className="text-3xl font-semibold tracking-tight">Client Management</h1>
              </div>
              <p className="text-background/60 text-sm">All clients and their service history in one place.</p>
            </motion.div>

            {/* Summary Stats */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { label: "Total Clients", value: clients.length, icon: Users },
                { label: "Active Cases", value: activeClients, icon: Clock },
                { label: "Service Requests", value: totalRequests, icon: FileText },
                { label: "Revenue Collected", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-4 rounded-xl bg-white/10 border border-white/10">
                  <Icon className="w-4 h-4 text-background/50 mb-2" />
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-background/50 mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 premium-input"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">{search ? "No clients match your search." : "No clients yet."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((client, i) => {
                const pending = client.requests.filter(r => r.status === "pending").length;
                const inProgress = client.requests.filter(r => r.status === "in_progress").length;
                const completed = client.requests.filter(r => r.status === "completed").length;
                const paid = client.requests.filter(r => r.status === "paid").length;
                const initials = client.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

                return (
                  <motion.div key={client.user_id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: easing }}
                    whileHover={{ y: -3 }}
                    className="premium-card p-6 cursor-pointer group"
                    onClick={() => navigate(`/admin/client/${client.user_id}`)}>

                    {/* Avatar + name */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{client.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Mail className="w-3 h-3" /><span className="truncate">{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Phone className="w-3 h-3" />{client.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Request status pills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {pending > 0 && <StatPill label="Pending" value={pending} color="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" />}
                      {inProgress > 0 && <StatPill label="Active" value={inProgress} color="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" />}
                      {completed > 0 && <StatPill label="Ready to Pay" value={completed} color="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" />}
                      {paid > 0 && <StatPill label="Paid" value={paid} color="bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400" />}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                        <p className="text-sm font-semibold">₹{client.totalPaid.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-foreground group-hover:gap-2 transition-all">
                        View Cases <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
