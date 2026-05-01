import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Search, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";

export default function UserRolesManagement() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!authLoading && role !== "admin" && role !== "ca") {
      toast.error("Access denied");
      navigate("/dashboard");
      return;
    }
    fetchUsers();
  }, [user, role, authLoading, navigate]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profErr } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (profErr) throw profErr;

      const { data: roles, error: roleErr } = await supabase.from("user_roles").select("*");
      if (roleErr) throw roleErr;

      // Group roles by user_id. A user might technically have multiple, but get_user_role prioritizes admin > ca > client
      const roleMap = new Map();
      for (const r of roles) {
        if (!roleMap.has(r.user_id) || r.role === 'admin' || (r.role === 'ca' && roleMap.get(r.user_id) === 'client')) {
          roleMap.set(r.user_id, r.role);
        }
      }
      
      const enriched = profiles.map(p => ({
        ...p,
        role: roleMap.get(p.user_id) || "client"
      }));

      setUsers(enriched);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (userId === user.id) {
      toast.error("You cannot change your own role");
      return;
    }
    
    setUpdatingId(userId);
    try {
      // Safest way to avoid duplicate key errors: delete existing roles for user, then insert new one
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;

      const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      if (insErr) throw insErr;

      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border/50 bg-foreground text-background py-10">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-6 w-6" />
                <h1 className="text-3xl font-semibold tracking-tight">Role Management</h1>
              </div>
              <p className="text-background/70 mt-2">
                Promote clients to CA or Admin to grant them access to the administrative dashboard.
              </p>
              <Button onClick={() => navigate("/admin")} variant="outline" size="sm"
                className="mt-6 gap-2 rounded-xl bg-white/10 hover:bg-white/20 border-white/10 text-background">
                ← Back to Admin
              </Button>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(u => (
              <motion.div key={u.user_id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="overflow-hidden border-border/40 hover:border-primary/20 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <h3 className="font-semibold truncate">{u.name || "Unknown"}</h3>
                    <p className="text-xs text-muted-foreground mb-4 truncate">{u.email}</p>
                    
                    <div className="flex items-center gap-3">
                      <Select 
                        value={u.role} 
                        onValueChange={(val) => handleRoleChange(u.user_id, val)}
                        disabled={updatingId === u.user_id || u.user_id === user.id}
                      >
                        <SelectTrigger className="h-9 w-full rounded-lg bg-secondary/50">
                          {updatingId === u.user_id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <SelectValue />}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="ca">CA</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {u.user_id === user.id && <span className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">(You)</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No users found matching your search.
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
