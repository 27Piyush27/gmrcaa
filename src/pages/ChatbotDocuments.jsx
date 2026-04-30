import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Download, Loader2, Image as ImageIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ChatbotDocuments() {
  const { user, profile, role } = useAuth();
  const isStaff = role === "admin" || role === "ca";
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user && isStaff) {
      fetchDocuments();
    }
  }, [user, isStaff]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // 1. Fetch all clients
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, email");

      if (profilesError) throw profilesError;

      const allDocs = [];

      // 2. For each client, list files in their chatbot folder
      // We do this concurrently for speed
      const listPromises = profilesData.map(async (p) => {
        const folderPath = `${p.user_id}/chatbot`;
        const { data: filesData, error: filesError } = await supabase.storage
          .from("client-uploads")
          .list(folderPath, {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
          });
        
        if (filesError || !filesData) return [];

        // Map files to include client info
        return filesData
          .filter(f => f.name !== ".emptyFolderPlaceholder")
          .map(f => ({
            ...f,
            clientName: p.name,
            clientEmail: p.email,
            folderPath
          }));
      });

      const results = await Promise.all(listPromises);
      const flattened = results.flat().filter(d => d && d.name).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      
      setDocuments(flattened);
    } catch (error) {
      console.error("Error fetching chatbot documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (doc) => {
    try {
      const filePath = `${doc.folderPath}/${doc.name}`;
      const { data, error } = await supabase.storage
        .from("client-uploads")
        .createSignedUrl(filePath, 60 * 60); // 1 hour valid

      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download document");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    return <FileText className="w-8 h-8 text-rose-500" />;
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isStaff) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Chatbot Documents</h1>
          <p className="text-muted-foreground mt-1">Review documents shared by clients directly through the AI Assistant.</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by client or filename..." 
            className="pl-9 bg-background/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Scanning client folders...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card className="min-h-[400px] flex flex-col items-center justify-center border-dashed">
          <CardContent className="flex flex-col items-center text-center space-y-3 pt-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xl font-medium">No documents found</p>
            <p className="text-muted-foreground">Clients haven't shared any files via the chatbot yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc, idx) => (
            <motion.div
              key={`${doc.folderPath}-${doc.name}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="hover:shadow-md transition-all duration-200 border-border/50 bg-background/50 backdrop-blur-sm group cursor-pointer" onClick={() => downloadFile(doc)}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-secondary/50 group-hover:bg-secondary transition-colors">
                    {getFileIcon(doc.metadata?.mimetype)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" title={doc.name}>
                      {doc.name.replace(/^\d+_/, '')} {/* Remove timestamp prefix */}
                    </p>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <span className="font-medium text-foreground">{doc.clientName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.created_at && !isNaN(new Date(doc.created_at).getTime()) 
                          ? format(new Date(doc.created_at), "MMM d, yyyy • h:mm a") 
                          : "Unknown date"} • {formatFileSize(doc.metadata?.size)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 p-2 rounded-full bg-primary/5 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
