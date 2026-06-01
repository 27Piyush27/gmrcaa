import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Edit2, CheckCircle2, ShieldAlert, Sparkles, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AITraining() {
  const { role } = useAuth();
  const isStaff = role === "admin" || role === "ca";
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "", type: "general_context", is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isStaff) fetchKnowledge();
  }, [isStaff]);

  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_knowledge_base")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setKnowledge(data || []);
    } catch (err) {
      console.error("Error fetching AI knowledge:", err);
      toast.error("Failed to load training data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && currentId) {
        const { error } = await supabase
          .from("ai_knowledge_base")
          .update(formData)
          .eq("id", currentId);
        if (error) throw error;
        toast.success("Training data updated!");
      } else {
        const { error } = await supabase
          .from("ai_knowledge_base")
          .insert([formData]);
        if (error) throw error;
        toast.success("New training rule added!");
      }
      
      setIsEditing(false);
      setFormData({ title: "", content: "", type: "general_context", is_active: true });
      fetchKnowledge();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save data.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setCurrentId(item.id);
    setFormData({ title: item.title, content: item.content, type: item.type, is_active: item.is_active });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this rule? The AI will forget it immediately.")) return;
    try {
      const { error } = await supabase.from("ai_knowledge_base").delete().eq("id", id);
      if (error) throw error;
      toast.success("Training data deleted.");
      fetchKnowledge();
    } catch (err) {
      toast.error("Failed to delete.");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase.from("ai_knowledge_base").update({ is_active: !currentStatus }).eq("id", id);
      if (error) throw error;
      toast.success(currentStatus ? "Rule disabled." : "Rule enabled.");
      fetchKnowledge();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'strict_rule': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'faq': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'strict_rule': return <ShieldAlert className="w-4 h-4" />;
      case 'faq': return <BookOpen className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  if (!isStaff) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Training System</h1>
        <p className="text-muted-foreground mt-1">
          Teach the chatbot new rules, FAQs, and company policies. Changes take effect instantly across all client chats.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            {isEditing ? <Edit2 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
            {isEditing ? "Edit Training Rule" : "Add New Training Rule"}
          </CardTitle>
          <CardDescription>
            Enter clear, concise instructions. The AI will read these before answering client queries.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title (Internal reference)</label>
                <Input 
                  placeholder="e.g., Office Hours, FY26 Tax Change" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rule Type</label>
                <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_context">General Context (Firm info, policies)</SelectItem>
                    <SelectItem value="strict_rule">Strict Rule (Must obey always)</SelectItem>
                    <SelectItem value="faq">FAQ (Specific question & answer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Training Content / Rule</label>
              <Textarea 
                placeholder="Type the exact information or rule you want the AI to memorize..." 
                className="min-h-[120px] resize-none"
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})} 
                required 
              />
              <p className="text-xs text-muted-foreground">
                Tip: For Strict Rules, use phrases like "Always...", "Never...", or "You must...".
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {isEditing && (
                <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setFormData({ title: "", content: "", type: "general_context", is_active: true }); }}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? "Update Knowledge" : "Train AI"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-semibold">Active Knowledge Base</h2>
        
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : knowledge.length === 0 ? (
          <div className="text-center p-12 bg-muted/20 rounded-xl border border-dashed">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
            <p className="text-lg font-medium">Knowledge Base is Empty</p>
            <p className="text-muted-foreground">Add some training rules above to make your AI smarter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {knowledge.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={\`relative flex flex-col p-5 rounded-xl border transition-all \${item.is_active ? 'bg-card border-border shadow-sm' : 'bg-muted/30 border-dashed opacity-70'}\`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold pr-8 truncate" title={item.title}>{item.title}</h3>
                    <span className={\`absolute top-5 right-5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border \${getTypeColor(item.type)}\`}>
                      {getTypeIcon(item.type)} {item.type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap flex-1 mb-4">
                    {item.content}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                    <button
                      onClick={() => toggleStatus(item.id, item.is_active)}
                      className={\`text-xs font-medium flex items-center gap-1.5 \${item.is_active ? 'text-emerald-600' : 'text-muted-foreground'}\`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {item.is_active ? "Active" : "Disabled"}
                    </button>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-100 hover:text-rose-600" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
