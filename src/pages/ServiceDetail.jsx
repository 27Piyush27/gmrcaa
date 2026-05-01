import { useParams, Link, useNavigate } from "react-router-dom";
import { getServiceById, servicesData } from "@/lib/servicesData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import {
  Calculator, FileCheck, Receipt, FileText, PieChart, Settings,
  CheckCircle, Shield, Search, AlertCircle, TrendingUp, Scale,
  Users, ArrowLeft, IndianRupee, Clock, Percent, Building,
  ClipboardCheck
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { resolveServiceIdForDb } from "@/lib/serviceIdResolver";
import { getErrorMessage } from "@/lib/errorMessage";

const iconMap = {
  Calculator: <Calculator className="h-8 w-8" />,
  FileCheck: <FileCheck className="h-8 w-8" />,
  Receipt: <Receipt className="h-8 w-8" />,
  FileText: <FileText className="h-5 w-5" />,
  PieChart: <PieChart className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
  CheckCircle: <CheckCircle className="h-5 w-5" />,
  Shield: <Shield className="h-8 w-8" />,
  Search: <Search className="h-5 w-5" />,
  AlertCircle: <AlertCircle className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-8 w-8" />,
  Scale: <Scale className="h-5 w-5" />,
  Users: <Users className="h-8 w-8" />,
  Percent: <Percent className="h-8 w-8" />,
  Building: <Building className="h-8 w-8" />,
  ClipboardCheck: <ClipboardCheck className="h-8 w-8" />,
};

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requesting, setRequesting] = useState(false);
  const service = getServiceById(serviceId);

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Service not found</h1>
          <Button asChild>
            <Link to="/services">Back to Services</Link>
          </Button>
        </div>
      </div>);

  }

  const handleRequestService = async () => {
    if (!user) {
      toast.error("Please login to request services");
      navigate("/auth", { state: { redirectTo: `/services/${service.id}` } });
      return;
    }

    setRequesting(true);
    try {
      const serviceIdForDb = await resolveServiceIdForDb(service.backendServiceId, service.title);

      const { data: existing, error: checkError } = await supabase.
      from("service_requests").
      select("id, status").
      eq("user_id", user.id).
      eq("service_id", serviceIdForDb).
      in("status", ["pending", "in_progress", "completed"]);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        toast.info("You already have an active request for this service.");
        navigate("/dashboard");
        return;
      }

      const { error: insertError } = await supabase.
      from("service_requests").
      insert({ user_id: user.id, service_id: serviceIdForDb, status: "pending", progress: 0 });

      if (insertError) throw insertError;

      toast.success("Service requested successfully! Check your dashboard for updates.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error requesting service:", error);
      toast.error(getErrorMessage(error, "Failed to request service. Please try again."));
    } finally {
      setRequesting(false);
    }
  };

  const discount = service.originalPrice ? service.originalPrice - service.price : 0;

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 overflow-hidden border-b border-border/40 bg-background">
          <div className="absolute inset-0 bg-aurora opacity-30 dark:opacity-10 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
          
          <div className="container relative z-10 mx-auto px-6 max-w-5xl">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="mb-8 text-muted-foreground hover:text-foreground -ml-4">
                <Link to="/services">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
                </Link>
              </Button>
            </motion.div>
            
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="bg-primary/10 w-24 h-24 rounded-2xl flex items-center justify-center text-primary shrink-0 shadow-lg border border-primary/20 backdrop-blur-md">
                {iconMap[service.icon]}
              </motion.div>
              
              <div className="flex-1">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 mb-3">
                   <Badge variant="secondary" className="px-3 py-1 font-medium bg-primary/10 text-primary border border-primary/20 shadow-sm">
                     {service.category || "Professional Service"}
                   </Badge>
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-balance gradient-text-premium">
                  {service.title}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="text-xl text-muted-foreground max-w-2xl text-balance">
                  {service.description}
                </motion.p>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-12 gradient-border-glow spotlight-card">
              <div className="p-6 md:p-8 rounded-2xl bg-card/90 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-sm font-medium text-muted-foreground mb-1 block">Service Investment</span>
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-baseline gap-1">
                  <IndianRupee className="w-6 h-6 text-foreground" />
                  <span className="text-4xl font-bold tracking-tight text-foreground">{service.price.toLocaleString("en-IN")}</span>
                </div>
                {service.originalPrice && (
                  <span className="text-lg line-through text-muted-foreground decoration-destructive/40">
                    ₹{service.originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
                {discount > 0 && (
                  <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 shadow-none font-semibold">
                    Save ₹{discount.toLocaleString("en-IN")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <Clock className="w-4 h-4" />
                <span>Estimated delivery: {service.duration}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleRequestService}
                disabled={requesting}
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base shadow-sm bg-background hover-lift">
                {requesting ? "Requesting..." : `Consult First`}
              </Button>
              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-base shadow-md hover-lift">
                <Link to={`/checkout/${service.id}`}>
                  Pay & Enroll
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none" />
        <div className="container relative z-10 mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">What's Included</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need, handled by our expert team.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {service.features.map((feature, index) =>
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-6 rounded-2xl border border-border/50 bg-card perspective-card">
                <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0 animate-pulse-ring">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium leading-relaxed">{feature}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="py-24 bg-secondary/30 border-y border-border/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="container relative z-10 mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Our Process</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A seamless experience from start to finish.</p>
          </motion.div>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {[
                { title: "Request", text: "Submit your details securely online." },
                { title: "Review", text: "We analyze your documents." },
                { title: "Process", text: "Our experts handle the filing." },
                { title: "Deliver", text: "You get the final certified output." },
              ].map((step, index) =>
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.15 }}
                  className="relative flex flex-col items-center text-center group">
                  <div className="w-14 h-14 rounded-2xl bg-card border border-border/60 text-primary flex items-center justify-center font-bold text-xl mb-4 shadow-sm z-10 relative group-hover:scale-110 group-hover:shadow-glow transition-all duration-300">
                    {index + 1}
                  </div>
                  {index < 3 && <div className="hidden md:block absolute top-7 left-[60%] w-full h-[2px] bg-border/60 overflow-hidden">
                    <motion.div 
                      initial={{ x: "-100%" }} whileInView={{ x: "100%" }} viewport={{ once: true }} transition={{ duration: 1.5, delay: index * 0.2 }}
                      className="w-full h-full bg-primary" 
                    />
                  </div>}
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground px-2">{step.text}</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-primary text-primary-foreground text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none opacity-50" />
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Ready to Get Started?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-xl opacity-90 max-w-2xl mx-auto text-balance">
            Join hundreds of satisfied clients. Let our experts handle your {service.title} with precision and care.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button
              onClick={handleRequestService}
              disabled={requesting}
              size="lg"
              variant="secondary"
              className="h-14 px-8 text-base font-bold w-full sm:w-auto hover-lift text-primary shadow-xl">
              {requesting ? "Processing..." : "Consult First"}
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base font-bold w-full sm:w-auto bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground hover-lift backdrop-blur-md">
              <Link to={`/checkout/${service.id}`}>
                Pay & Enroll Now
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
    </PageTransition>
  );
}