import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Mail, Phone, Briefcase, Calendar, CheckCircle, Clock, Archive } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function JobApplications() {
  const { user, role } = useAuth();
  const isStaff = role === "admin" || role === "ca";
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && isStaff) {
      fetchApplications();
    }
  }, [user, isStaff]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_inquiries")
        .select("*")
        .like("subject", "[Job Application]%")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, currentStatus, newStatus) => {
    try {
      const { error } = await supabase
        .from("contact_inquiries")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) throw error;
      
      setApplications(prev => 
        prev.map(app => app.id === id ? { ...app, status: newStatus } : app)
      );
      toast.success(`Application marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"><Clock className="w-3 h-3"/> New</span>;
      case 'read': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"><CheckCircle className="w-3 h-3"/> Under Review</span>;
      case 'replied': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"><Mail className="w-3 h-3"/> Contacted</span>;
      case 'archived': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-300"><Archive className="w-3 h-3"/> Archived</span>;
      default: return null;
    }
  };

  const extractPhone = (message) => {
    const phoneMatch = message.match(/Phone:\s*([^\n]+)/);
    return phoneMatch ? phoneMatch[1].trim() : "Not provided";
  };

  const extractCoverNote = (message) => {
    const noteMatch = message.split(/Cover Note:\s*/);
    return noteMatch.length > 1 ? noteMatch[1].trim() : message;
  };

  if (!isStaff) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Applications</h1>
        <p className="text-muted-foreground mt-1">Review candidates who have applied through the Careers portal.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 border-dashed bg-background/50">
          <CardContent className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xl font-medium">No applications yet</p>
            <p className="text-muted-foreground max-w-sm">When candidates apply for roles on the Careers page, their profiles will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {applications.map((app, idx) => {
              const roleName = app.subject.replace("[Job Application] ", "");
              const phone = extractPhone(app.message);
              const coverNote = extractCoverNote(app.message);

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="h-full"
                >
                  <Card className="h-full flex flex-col hover:shadow-md transition-shadow border-border/50 bg-background/50 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b border-border/30">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{app.name}</CardTitle>
                          <p className="text-sm font-medium text-accent">{roleName}</p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                      <div className="pt-2 text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> 
                        {app.created_at ? format(new Date(app.created_at), "MMM d, yyyy • h:mm a") : "Unknown Date"}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col pt-5 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <a href={`mailto:${app.email}`} className="hover:text-accent hover:underline truncate">{app.email}</a>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <a href={`tel:${phone}`} className="hover:text-accent hover:underline truncate">{phone}</a>
                        </div>
                      </div>

                      <div className="mt-2 flex-1">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Cover Note</h4>
                        <div className="text-sm bg-secondary/30 p-3 rounded-lg border border-border/40 text-foreground/80 line-clamp-4 hover:line-clamp-none transition-all">
                          {coverNote}
                        </div>
                      </div>

                      <div className="pt-4 mt-auto border-t border-border/30 grid grid-cols-2 gap-2">
                        {app.status === 'new' && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={() => updateStatus(app.id, app.status, 'read')}
                          >
                            Mark Reviewing
                          </Button>
                        )}
                        {(app.status === 'new' || app.status === 'read') && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={() => updateStatus(app.id, app.status, 'replied')}
                          >
                            Mark Contacted
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs col-span-full mt-1"
                          onClick={() => updateStatus(app.id, app.status, app.status === 'archived' ? 'read' : 'archived')}
                        >
                          {app.status === 'archived' ? 'Restore Application' : 'Archive Application'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
