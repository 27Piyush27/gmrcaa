import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Plus, Mail, Shield, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InvitationsManagement() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("ca");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (role !== "admin" && role !== "ca") {
      navigate("/");
      return;
    }
    fetchInvitations();
  }, [role, navigate]);

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is required");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase
        .from("invitations")
        .insert([{ email, role: selectedRole }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Invitation generated successfully");
      setEmail("");
      fetchInvitations();

      const inviteLink = `${window.location.origin}/auth?signup=true&invite_token=${data.token}`;
      navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard!");
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (token) => {
    const inviteLink = `${window.location.origin}/auth?signup=true&invite_token=${token}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link copied!");
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Invitations</h1>
          <p className="text-muted-foreground mt-1">Generate highly secure invite links for new staff.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin")}>Back to Dashboard</Button>
      </div>

      <div className="grid md:grid-cols-[350px_1fr] gap-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5 text-primary" />
              New Invite
            </CardTitle>
            <CardDescription>Create a role-specific secure invite link.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateInvite} className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="ca@firm.com" 
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Assign Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ca">Chartered Accountant (CA)</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={generating}>
                {generating ? "Generating..." : "Generate Invite Link"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Active Invitations</CardTitle>
            <CardDescription>Manage pending and accepted invitations.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-lg bg-secondary/20">
                <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No invitations generated yet.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-secondary/30">
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            inv.role === 'admin' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {inv.role.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {inv.used_at ? (
                            <span className="flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Accepted
                            </span>
                          ) : new Date(inv.expires_at) < new Date() ? (
                            <span className="flex items-center text-xs text-red-500">
                              <Clock className="h-3 w-3 mr-1" /> Expired
                            </span>
                          ) : (
                            <span className="flex items-center text-xs text-amber-600 dark:text-amber-400">
                              <Clock className="h-3 w-3 mr-1" /> Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!inv.used_at && (
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(inv.token)}>
                              <Copy className="h-4 w-4 mr-2" /> Copy Link
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
