import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  CreditCard,
  IndianRupee,
  CheckCircle,
  Clock,
  FileText,
  ArrowLeft,
  Shield,
  Zap,
  Loader2,
  AlertCircle } from
"lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/paymentApi";
import { InvoiceButton } from "@/components/InvoiceButton";























const paymentPlans = [
{
  id: "basic",
  name: "Basic Consultation",
  price: 2999,
  description: "One-time consultation for individuals",
  features: [
  "1 Hour Consultation",
  "Tax Planning Advice",
  "Document Review",
  "Email Support"]

},
{
  id: "standard",
  name: "Standard Package",
  price: 9999,
  description: "Comprehensive tax filing services",
  features: [
  "Complete ITR Filing",
  "Tax Optimization",
  "Quarterly Reviews",
  "Priority Support",
  "Compliance Check"],

  popular: true
},
{
  id: "premium",
  name: "Premium Package",
  price: 24999,
  description: "Full-service accounting & tax",
  features: [
  "Everything in Standard",
  "GST Filing",
  "Bookkeeping",
  "Audit Support",
  "Dedicated CA",
  "24/7 Support"]

}];









export default function Payments() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [customAmount, setCustomAmount] = useState("");
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // Load Razorpay script (only once)
    if (window.Razorpay) {
      setRazorpayLoaded(true);
    } else if (!document.querySelector('script[src*="checkout.razorpay.com"]')) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => console.error("Failed to load Razorpay script");
      document.body.appendChild(script);
    } else {
      // Script tag exists but may not have loaded yet — poll
      const interval = setInterval(() => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }

    if (user) {
      fetchPayments();
    }
  }, [user, authLoading, navigate]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase.
      from("payments").
      select("*").
      order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handlePayment = async (amount, description) => {
    if (!razorpayLoaded) {
      toast.error("Payment gateway is loading. Please try again in a moment.");
      return;
    }

    if (!user) {
      toast.error("Please log in to make a payment");
      navigate("/auth");
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid payment amount greater than ₹0");
      return;
    }

    setIsLoading(true);

    try {
      // Create order via payment API (local dev or Supabase edge function)
      const { data, error } = await createRazorpayOrder({ amount, description });

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

      // Initialize Razorpay checkout
      const options = {
        key: data.key_id,
        amount: data.amount, // in paise from Razorpay
        currency: data.currency,
        name: "GMR & Associates",
        description: description,
        order_id: data.order_id,
        
        handler: async function (response) {
          // Verify payment server-side
          try {
            const { data: verifyData, error: verifyError } = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_id: data.payment_id
            });

            if (verifyError) {
              toast.error(verifyError.message);
            } else if (!verifyData?.success) {
              toast.error(verifyData?.error || "Payment verification failed. Contact support.");
            } else {
              toast.success("Payment successful! Thank you for your purchase.");
              fetchPayments();
            }
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

      const razorpayInstance = new window.Razorpay(options);
      
      razorpayInstance.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error?.description || "Unknown error"}`);
        setIsLoading(false);
      });
      razorpayInstance.open();
      // ⚠️ Do NOT call setIsLoading(false) here — modal is open.
      // It will be cleared in handler / ondismiss / payment.failed.
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initialize payment. Please try again.");
      setIsLoading(false);
    }
  };

  const handleCustomPayment = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error("Please enter a valid amount");
      return;
    }
    handlePayment(amount, "Custom Payment");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
      case "processing":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const stagger = {
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground text-background py-16">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-background/80 hover:text-background hover:bg-background/10 mb-6">
            
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}>
            
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              Payments
            </h1>
            <p className="text-background/70 text-lg max-w-2xl">
              Choose a service package or make a custom payment securely through Razorpay.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Trust Badges */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex flex-wrap justify-center gap-6 mb-12">
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5 text-green-500" />
            <span className="text-sm">Secure Payments</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-sm">Instant Confirmation</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-5 h-5 text-blue-500" />
            <span className="text-sm">All Cards Accepted</span>
          </div>
        </motion.div>

        {/* Pricing Plans */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {paymentPlans.map((plan) =>
          <motion.div key={plan.id} variants={fadeIn}>
              <Card
              className={`relative h-full transition-all duration-300 hover:shadow-xl ${plan.popular ? "border-primary shadow-lg scale-105" : "border-border"}`
              }>
              
                {plan.popular &&
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
              }
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">₹{plan.price.toLocaleString()}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) =>
                  <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                  )}
                  </ul>
                  <Button
                  onClick={() => handlePayment(plan.price, plan.name)}
                  disabled={isLoading || !razorpayLoaded}
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}>
                  
                    {isLoading ?
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> :

                  <IndianRupee className="w-4 h-4 mr-1" />
                  }
                    Pay ₹{plan.price.toLocaleString()}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Custom Payment */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.3 }}>
          
          <Card className="max-w-md mx-auto mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Custom Payment
              </CardTitle>
              <CardDescription>
                Enter a custom amount for specific services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-9"
                      min="1" />
                    
                  </div>
                  <Button onClick={handleCustomPayment} disabled={isLoading || !razorpayLoaded}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay Now"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment History */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.4 }}>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Payment History
              </CardTitle>
              <CardDescription>Your recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayments ?
              <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div> :
              payments.length === 0 ?
              <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No payment history yet</p>
                </div> :

              <div className="space-y-4">
                  {payments.map((payment, index) =>
                <div key={payment.id}>
                      <div className="flex items-start justify-between py-3 gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getStatusIcon(payment.status)}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{payment.description || "Payment"}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(payment.created_at).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                            </p>
                            {payment.razorpay_payment_id &&
                        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                                {payment.razorpay_payment_id}
                              </p>
                        }
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold">
                            ₹{(payment.total_amount ?? payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </p>
                          <Badge
                        variant={
                        payment.status === "completed" ?
                        "default" :
                        payment.status === "failed" ?
                        "destructive" :
                        "secondary"
                        }
                        className="text-xs mt-1">
                        
                            {payment.status.toUpperCase()}
                          </Badge>
                          {/* Invoice download for completed payments */}
                          {payment.status === "completed" && payment.razorpay_payment_id &&
                      <div className="mt-2">
                              <InvoiceButton
                          paymentId={payment.razorpay_payment_id}
                          orderId={payment.razorpay_order_id ?? undefined}
                          serviceTitle={payment.description || "Service"}
                          baseAmount={payment.amount}
                          gstAmount={payment.gst_amount ?? Math.round(payment.amount * 0.18)}
                          totalAmount={payment.total_amount ?? payment.amount + Math.round(payment.amount * 0.18)}
                          date={new Date(payment.created_at).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                          variant="outline"
                          size="sm"
                          label="Invoice" />
                        
                            </div>
                      }
                        </div>
                      </div>
                      {index < payments.length - 1 && <Separator />}
                    </div>
                )}
                </div>
              }
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>);

}