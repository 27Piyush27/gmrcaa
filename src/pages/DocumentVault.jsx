import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  FolderOpen, ArrowLeft, Loader2, FileText, Download,
  CheckCircle, Clock, Search, X, File, FileSpreadsheet, FileArchive
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const easing = [0.22, 1, 0.36, 1];

function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType) {
  if (!mimeType) return File;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("csv")) return FileSpreadsheet;
  if (mimeType.includes("zip") || mimeType.includes("archive")) return FileArchive;
  return File;
}

export default function DocumentVault() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, navigate]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_documents")
        .select(`
          id, file_name, file_path, file_size, mime_type, notes,
          reviewed, reviewed_at, created_at,
          service_request_id,
          service_requests!inner(service_id, services(name))
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filePath, fileName) => {
    try {
      const { data, error } = await supabase.storage.from("service-documents").download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download file");
    }
  };

  const filtered = documents.filter(doc => {
    if (!search) return true;
    const q = search.toLowerCase();
    return doc.file_name.toLowerCase().includes(q) ||
           (doc.service_requests?.services?.name || "").toLowerCase().includes(q);
  });

  // Group by service
  const grouped = filtered.reduce((acc, doc) => {
    const svcName = doc.service_requests?.services?.name || "Unknown Service";
    if (!acc[svcName]) acc[svcName] = [];
    acc[svcName].push(doc);
    return acc;
  }, {});

  const totalReviewed = documents.filter(d => d.reviewed).length;

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
            <Button variant="ghost" onClick={() => navigate("/dashboard")}
              className="text-background/80 hover:text-background hover:bg-background/10 mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="h-6 w-6" />
              <h1 className="text-3xl font-semibold tracking-tight">Document Vault</h1>
            </div>
            <p className="text-background/70">All your uploaded documents across services.</p>

            <div className="grid grid-cols-3 gap-4 mt-6 max-w-lg">
              <div className="p-4 rounded-xl bg-white/10 border border-white/10">
                <p className="text-xs text-background/50 mb-1">Total Files</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 border border-white/10">
                <p className="text-xs text-background/50 mb-1">Reviewed</p>
                <p className="text-2xl font-bold">{totalReviewed}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 border border-white/10">
                <p className="text-xs text-background/50 mb-1">Pending</p>
                <p className="text-2xl font-bold">{documents.length - totalReviewed}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search files or services…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border/50 bg-secondary/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Document list */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {search ? "No documents match your search" : "No documents uploaded yet. Upload documents from your service dashboard."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([serviceName, docs], gi) => (
                <motion.div key={serviceName}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.08, duration: 0.4, ease: easing }}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> {serviceName}
                    <span className="text-xs font-normal bg-secondary px-2 py-0.5 rounded-full">{docs.length} files</span>
                  </h3>
                  <div className="space-y-2">
                    {docs.map((doc, i) => {
                      const IconComp = getFileIcon(doc.mime_type);
                      return (
                        <motion.div key={doc.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: gi * 0.08 + i * 0.03, duration: 0.3 }}>
                          <Card className="border-border/50 hover:border-border transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center flex-shrink-0">
                                  <IconComp className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                    <span>{formatFileSize(doc.file_size)}</span>
                                    <span>{new Date(doc.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                                    <span className={`inline-flex items-center gap-1 ${doc.reviewed ? "text-emerald-600" : "text-amber-600"}`}>
                                      {doc.reviewed ? <><CheckCircle className="w-3 h-3" /> Reviewed</> : <><Clock className="w-3 h-3" /> Pending</>}
                                    </span>
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost"
                                  className="h-8 w-8 p-0 rounded-full"
                                  onClick={() => handleDownload(doc.file_path, doc.file_name)}>
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
