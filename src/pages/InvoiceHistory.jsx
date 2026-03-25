import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  FileText, ArrowLeft, Loader2, IndianRupee, Calendar,
  Download, Receipt, Search, X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceButton } from "@/components/InvoiceButton";

const easing = [0.22, 1, 0.36, 1];

export default function InvoiceHistory() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, navigate]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, service_title, base_amount, gst_amount, total_amount, generated_at, payment_id")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false });
      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const filtered = invoices.filter(inv => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (inv.invoice_number || "").toLowerCase().includes(q) ||
           (inv.service_title || "").toLowerCase().includes(q);
  });

  const totalAmount = invoices.reduce((s, inv) => s + Number(inv.total_amount || 0), 0);

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
              <Receipt className="h-6 w-6" />
              <h1 className="text-3xl font-semibold tracking-tight">Invoice History</h1>
            </div>
            <p className="text-background/70">View and download all your invoices.</p>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4 mt-6 max-w-md">
              <div className="p-4 rounded-xl bg-white/10 border border-white/10">
                <p className="text-xs text-background/50 mb-1">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 border border-white/10">
                <p className="text-xs text-background/50 mb-1">Total Amount</p>
                <p className="text-2xl font-bold">₹{totalAmount.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search by invoice number or service…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border/50 bg-secondary/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {search ? "No invoices match your search" : "No invoices yet. Complete a paid service to see invoices here."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {filtered.map((inv, i) => (
                <motion.div key={inv.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.35, ease: easing }}>
                  <Card className="border-border/50 hover:border-border transition-colors">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded">
                              {inv.invoice_number}
                            </span>
                          </div>
                          <p className="text-sm font-semibold">{inv.service_title || "Service"}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(inv.generated_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            <span className="flex items-center gap-1">
                              <IndianRupee className="w-3.5 h-3.5" />
                              Base: ₹{Number(inv.base_amount).toLocaleString("en-IN")}
                            </span>
                            <span className="text-emerald-600 font-medium">
                              Total: ₹{Number(inv.total_amount).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <InvoiceButton
                            paymentId={inv.payment_id || inv.id}
                            serviceTitle={inv.service_title || "Service"}
                            baseAmount={Number(inv.base_amount)}
                            gstAmount={Number(inv.gst_amount)}
                            totalAmount={Number(inv.total_amount)}
                            date={new Date(inv.generated_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs rounded-full gap-1.5"
                            label="Download"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
