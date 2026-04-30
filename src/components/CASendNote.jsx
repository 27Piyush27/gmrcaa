import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * CASendNote — lets a CA/Admin send a notification message to a specific client.
 * Inserts a row into the `notifications` table for the target user.
 */
export function CASendNote({ targetUserId, clientName, serviceRequestId }) {
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!note.trim()) { toast.error("Please enter a message."); return; }
    if (!targetUserId) { toast.error("Client not identified."); return; }
    setSending(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: targetUserId,
        title: "Message from your CA",
        message: note.trim(),
        type: "ca_note",
        link: serviceRequestId ? "/dashboard" : null,
      });
      if (error) throw error;
      toast.success(`Note sent to ${clientName || "client"} successfully.`);
      setNote("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error("Send note error:", err);
      toast.error("Failed to send note. Check notifications table exists.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2 mt-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" />
        Send Note to {clientName || "Client"}
      </p>
      <Textarea
        placeholder={`Type a message for ${clientName || "the client"}…`}
        value={note}
        onChange={e => setNote(e.target.value)}
        className="min-h-[80px] text-sm resize-none"
        maxLength={500}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{note.length}/500</span>
        <Button
          size="sm"
          className="gap-1.5 h-8 text-xs rounded-lg"
          onClick={handleSend}
          disabled={sending || !note.trim()}
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {sent ? "Sent!" : "Send Note"}
        </Button>
      </div>
    </div>
  );
}
