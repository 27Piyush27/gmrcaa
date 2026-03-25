/**
 * InvoiceButton — reusable download-invoice button.
 * Generates a PDF locally AND saves the invoice record to Supabase.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePDF, generateInvoiceNumber } from "@/lib/generateInvoice";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function InvoiceButton({
  paymentId,
  orderId = "—",
  serviceTitle,
  serviceDescription,
  baseAmount,
  gstAmount,
  totalAmount,
  date,
  variant = "outline",
  size = "default",
  className = "",
  label = "Download Invoice"
}) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const invoiceNumber = generateInvoiceNumber();
      const invoiceDate =
      date ||
      new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      const invoiceData = {
        invoiceNumber,
        date: invoiceDate,
        paymentId,
        orderId,
        clientName: profile?.name || user?.email?.split("@")[0] || "Client",
        clientEmail: user?.email || "client@example.com",
        clientPhone: profile?.phone || undefined,
        serviceTitle,
        serviceDescription,
        baseAmount,
        gstAmount,
        totalAmount
      };

      // Small timeout so loading spinner renders before PDF generation blocks the thread
      await new Promise((r) => setTimeout(r, 50));
      generateInvoicePDF(invoiceData);
      toast.success(`Invoice ${invoiceNumber} downloaded!`);

      // ── Save invoice record to DB (non-blocking — failure won't break PDF) ──
      if (user) {
        try {
          await supabase.from("invoices").insert({
            user_id: user.id,
            invoice_number: invoiceNumber,
            service_title: serviceTitle || "Service",
            base_amount: baseAmount || 0,
            gst_amount: gstAmount || 0,
            total_amount: totalAmount || 0,
          });
        } catch (dbErr) {
          // Silently log — user still has the PDF
          console.warn("Invoice DB save failed (PDF still downloaded):", dbErr);
        }
      }
    } catch (err) {
      console.error("Invoice generation failed:", err);
      toast.error("Failed to generate invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
      onClick={handleDownload}
      disabled={loading}>
      
            {loading ?
      <Loader2 className="w-4 h-4 animate-spin" /> :

      <FileDown className="w-4 h-4" />
      }
            {loading ? "Generating..." : label}
        </Button>);

}