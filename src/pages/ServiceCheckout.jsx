import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle,
  CreditCard,
  Smartphone,
  Building2,
  Loader2,
  IndianRupee,
  Lock,
  FileText } from
"lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/paymentApi";
import { getServiceById } from "@/lib/servicesData";
import { resolveServiceIdForDb } from "@/lib/serviceIdResolver";








export default function ServiceCheckout() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    // Load Razorpay script (only once per page)
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
      const interval = setInterval(() => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }

    // Get service details
    const foundService = getServiceById(serviceId || "");
    if (foundService) {
      setService(foundService);
    }
  }, [serviceId]);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please login to continue");
      navigate("/auth", { state: { redirectTo: `/checkout/${serviceId}` } });
    }
  }, [user, authLoading, navigate, serviceId]);

  const handlePayment = async () => {
    if (!service) return;

    if (!razorpayLoaded) {
      toast.error("Payment gateway is loading. Please try again in a moment.");
      return;
    }

    if (!user) {
      toast.error("Please log in to make a payment");
      navigate("/auth");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create Razorpay order via payment API
      const { data, error } = await createRazorpayOrder({
        amount: service.price,
        description: service.title
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

      // Step 2: Open Razorpay checkout
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "GMR & Associates",
        description: service.title,
        order_id: data.order_id,
        
        handler: async function (response) {
          try {
            // Step 3: Verify payment signature
            const { data: verifyData, error: verifyError } = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_id: data.payment_id
            });

            if (verifyError) {
              toast.error(verifyError.message);
              setIsLoading(false);
              return;
            }

            if (!verifyData?.success) {
              toast.error(verifyData?.error || "Payment verification failed. Contact support.");
              setIsLoading(false);
              return;
            }

            // Step 4: Create service request AFTER successful payment
            const serviceIdForDb = await resolveServiceIdForDb(service.backendServiceId, service.title);
            const { error: requestError } = await supabase.
            from("service_requests").
            insert({
              user_id: user.id,
              service_id: serviceIdForDb,
              status: "in_progress",
              progress: 10,
              notes: `Payment initialized: ${response.razorpay_payment_id}`
            }).
            select("id").
            single();

            if (requestError) {
              console.error("Service request error post-payment:", requestError);
              // Payment did succeed — still navigate to success page
            }

            // Step 5: Navigate to confirmation page
            navigate(`/payment-success`, {
              state: {
                service,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: service.price
              }
            });
          } catch (err) {
            console.error("Post-payment error:", err);
            toast.error("Payment succeeded but post-processing failed. Please contact support.");
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
      // ⚠️ Do NOT call setIsLoading(false) here — Razorpay modal is open.
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initialize payment. Please try again.");
      setIsLoading(false);
    }
  };

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Service not found</h1>
          <Button asChild>
            <Link to="/services">Back to Services</Link>
          </Button>
        </div>
      </div>);

  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>);

  }

  const discount = service.originalPrice ? service.originalPrice - service.price : 0;
  const gst = Math.round(service.price * 0.18);
  const total = service.price + gst;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50">
        <div className="container mx-auto px-6 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/services")}
            className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
            
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-semibold tracking-tight">
            
            Complete Your Enrollment
          </motion.h1>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
          {/* Service Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 space-y-8">
            
            {/* Selected Service */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-3">
                      {service.category}
                    </Badge>
                    <CardTitle className="text-2xl">{service.title}</CardTitle>
                    <p className="text-muted-foreground mt-2">{service.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Estimated delivery: {service.duration}</span>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">What's Included</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {service.features.map((feature, index) =>
                    <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Secure Payment Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center p-4 rounded-lg bg-secondary/50 text-center">
                    <CreditCard className="w-6 h-6 mb-2 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Credit/Debit Card</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-secondary/50 text-center">
                    <Smartphone className="w-6 h-6 mb-2 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">UPI</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-secondary/50 text-center">
                    <Building2 className="w-6 h-6 mb-2 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Net Banking</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2">
            
            <div className="sticky top-24">
              <Card className="border-border/50 shadow-soft">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{service.title}</span>
                      <span>₹{service.originalPrice?.toLocaleString() || service.price.toLocaleString()}</span>
                    </div>
                    {discount > 0 &&
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>- ₹{discount.toLocaleString()}</span>
                      </div>
                    }
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{service.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST (18%)</span>
                      <span>₹{gst.toLocaleString()}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Payable</span>
                    <span className="flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {total.toLocaleString()}
                    </span>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={isLoading || !razorpayLoaded}
                    className="w-full h-12 text-base"
                    size="lg">
                    
                    {isLoading ?
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </> :

                    <>
                        <Lock className="w-4 h-4 mr-2" />
                        Pay ₹{total.toLocaleString()}
                      </>
                    }
                  </Button>

                  {/* Trust Indicators */}
                  <div className="pt-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-4 h-4 text-foreground" />
                      <span>100% Secure & Encrypted Payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-foreground" />
                      <span>Money-back guarantee if not satisfied</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>);

}