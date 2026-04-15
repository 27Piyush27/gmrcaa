import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, IndianRupee, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/paymentApi";
import { useNavigate } from "react-router-dom";
















function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    // Check if script already exists in DOM
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) {
      const interval = setInterval(() => {
        if (window.Razorpay) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export function ServicePaymentButton({
  serviceRequestId,
  serviceName,
  amount,
  status,
  onPaymentSuccess
}) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(!!window.Razorpay);

  // Ensure Razorpay is loaded
  useEffect(() => {
    if (!window.Razorpay) {
      loadRazorpayScript().then(setRazorpayReady);
    }
  }, []);

  const handlePayment = useCallback(async () => {
    if (!user) {
      toast.error("Please log in to make a payment");
      navigate("/auth");
      return;
    }

    setIsLoading(true);

    try {
      // Ensure Razorpay is loaded before proceeding
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Payment gateway failed to load. Please refresh and try again.");
        setIsLoading(false);
        return;
      }
      setRazorpayReady(true);

      // Create order via payment API (local dev or Supabase edge function)
      const { data, error } = await createRazorpayOrder({
        service_request_id: serviceRequestId,
        description: serviceName,
        amount: amount || undefined
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      if (!data?.order_id || !data?.key_id) {
        toast.error("Invalid response from payment server. Please try again.");
        setIsLoading(false);
        return;
      }

      const options = {
        key: data.key_id,
        amount: data.amount, // in paise (from Razorpay)
        currency: data.currency,
        name: "GMR & Associates",
        description: serviceName,
        order_id: data.order_id,
        
        handler: async function (response) {
          // Verify payment on success
          try {
            const { data: verifyData, error: verifyError } = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_id: data.payment_id,
              service_request_id: serviceRequestId
            });

            if (verifyError) {
              toast.error(verifyError.message);
              return;
            }

            if (!verifyData?.success) {
              toast.error(verifyData?.error || "Payment verification failed. Contact support.");
              return;
            }

            toast.success("Payment successful! Your receipt is ready.");
            onPaymentSuccess?.();
          } catch (err) {
            console.error("Verification error:", err);
            toast.error("Payment verification failed. Please contact support.");
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: profile?.name || "",
          email: user?.email || "",
          contact: profile?.phone || ""
        },
        theme: {
          color: "#000000"
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            toast.info("Payment cancelled.");
          },
          confirm_close: true
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error?.description || "Unknown error"}`);
        setIsLoading(false);
      });
      rzp.open();
      // ⚠️ Do NOT call setIsLoading(false) here — Razorpay modal is now open.
      // Loading state is cleared in handler / ondismiss / payment.failed callbacks.
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initialize payment. Please try again.");
      setIsLoading(false);
    }
  }, [user, profile, navigate, serviceRequestId, serviceName, amount, onPaymentSuccess]);

  // ── Status guards ──────────────────────────────────────────────────────
  if (status === "paid") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
        <Lock className="w-4 h-4" />
        Payment Completed
      </div>);

  }

  if (status !== "completed") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        Payment will be enabled after service completion
      </div>);

  }

  if (!amount || amount <= 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="w-3.5 h-3.5" />
        Amount not yet set by your CA
      </div>);

  }

  const gst = Math.round(amount * 0.18);
  const total = amount + gst;

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        Service: ₹{amount.toLocaleString()} + GST (18%): ₹{gst.toLocaleString()} ={" "}
        <span className="font-semibold text-foreground">₹{total.toLocaleString()}</span>
      </div>
      <Button
        onClick={handlePayment}
        disabled={isLoading || !razorpayReady}
        size="sm"
        className="gap-2">
        
        {isLoading ?
        <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </> :

        <>
            <IndianRupee className="w-4 h-4" />
            {razorpayReady ? `Pay ₹${total.toLocaleString()}` : "Loading..."}
          </>
        }
      </Button>
    </div>);

}