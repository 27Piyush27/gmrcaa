import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText,
  Download,
  CheckCircle,

  Loader2,
  Eye } from
"lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";



















export function CADocumentReview({ serviceRequestId, clientName }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase.
      from("client_documents").
      select("id, file_name, file_path, file_size, mime_type, notes, reviewed, reviewed_at, created_at, user_id").
      eq("service_request_id", serviceRequestId).
      order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching client documents:", error);
    } finally {
      setLoading(false);
    }
  }, [serviceRequestId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDownload = async (doc) => {
    try {
      const { data, error } = await supabase.storage.
      from("client-uploads").
      download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  const handleMarkReviewed = async (docId) => {
    if (!user) return;
    setReviewingId(docId);
    try {
      const { error } = await supabase.
      from("client_documents").
      update({
        reviewed: true,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      }).
      eq("id", docId);

      if (error) throw error;
      toast.success("Document marked as reviewed");
      fetchDocuments();
    } catch (error) {
      console.error("Review error:", error);
      toast.error("Failed to update review status");
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading client documents...
      </div>);

  }

  if (documents.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        No documents uploaded by {clientName || "the client"} yet.
      </p>);

  }

  const reviewed = documents.filter((d) => d.reviewed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <Eye className="w-4 h-4" />
          Client Documents ({documents.length})
        </p>
        <Badge variant="outline" className="text-xs">
          {reviewed}/{documents.length} reviewed
        </Badge>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {documents.map((doc) =>
        <div
          key={doc.id}
          className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-secondary/30">
          
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{doc.file_name}</p>
                {doc.notes &&
              <p className="text-xs text-muted-foreground truncate">{doc.notes}</p>
              }
                <p className="text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric"
                })}
                  {doc.file_size && ` · ${(doc.file_size / 1024).toFixed(0)} KB`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {doc.reviewed ?
            <Badge variant="default" className="gap-1 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  Reviewed
                </Badge> :

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleMarkReviewed(doc.id)}
              disabled={reviewingId === doc.id}>
              
                  {reviewingId === doc.id ?
              <Loader2 className="w-3 h-3 animate-spin" /> :

              <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Mark Reviewed
                    </>
              }
                </Button>
            }
              <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleDownload(doc)}>
              
                <Download className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>);

}