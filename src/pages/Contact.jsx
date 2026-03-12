import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Loader2, ArrowRight, Clock, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

const easing = [0.22, 1, 0.36, 1];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("contact_inquiries").insert([
      {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        status: "new"
      }]
      );

      if (error) {
        throw error;
      }

      toast.success("Thank you! We'll get back to you within 24 hours.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      
    } catch (err) {
      console.error("Error submitting contact form:", err);
      toast.error(err.message || "Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const offices = [
  {
    name: "Gurgaon Office",
    address: "H.No.43, SF, Sector-7, Gurugram",
    phone: "+91 98712 09393",
    gradient: "from-blue-500/10 to-cyan-500/5"
  },
  {
    name: "Delhi Office",
    address: "AB 38, Ground Floor, Shalimar Bagh",
    phone: "+91 98710 84875",
    gradient: "from-purple-500/10 to-indigo-500/5"
  }];


  return (
    <PageTransition>
      <div className="min-h-screen">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative pt-28 pb-20 md:pt-40 md:pb-28 overflow-hidden">
          {/* Ambient gradients */}
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/[0.06] blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-purple-400/[0.05] blur-[60px] pointer-events-none" />

          <div className="max-w-5xl mx-auto px-6 lg:px-12 relative">
            <motion.p
              className="text-xs tracking-widest text-muted-foreground uppercase mb-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing, delay: 0.1 }}>
              
              Contact
            </motion.p>
            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl mb-8 text-balance max-w-4xl"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.2 }}>
              
              Get in{" "}
              <span className="italic gradient-text-premium">touch.</span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.38 }}>
              
              We're ready to answer your questions and help you get started
              with the right financial strategy.
            </motion.p>
          </div>
        </section>

        {/* ── Contact Form & Info ─────────────────────────────────────── */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">

              {/* Contact Form */}
              <ScrollReveal className="lg:col-span-3">
                <div className="premium-card p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Send className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold">Send us a message</h2>
                      <p className="text-sm text-muted-foreground">We'll respond within 24 hours</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4, ease: easing }}>
                        
                        <Label htmlFor="name" className="text-sm tracking-wide font-medium">
                          Your Name
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Full name"
                          className="premium-input"
                          required />
                        
                      </motion.div>

                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.4, ease: easing }}>
                        
                        <Label htmlFor="email" className="text-sm tracking-wide font-medium">
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="name@example.com"
                          className="premium-input"
                          required />
                        
                      </motion.div>
                    </div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.4, ease: easing }}>
                      
                      <Label htmlFor="subject" className="text-sm tracking-wide font-medium">
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="How can we help?"
                        className="premium-input"
                        required />
                      
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45, duration: 0.4, ease: easing }}>
                      
                      <Label htmlFor="message" className="text-sm tracking-wide font-medium">
                        Your Message
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your requirements..."
                        rows={5}
                        className="premium-input resize-none !h-auto"
                        required />
                      
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.4, ease: easing }}>
                      
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-12 px-8 rounded-xl text-sm font-medium gap-2 hover-lift w-full sm:w-auto">
                        
                        {isSubmitting ?
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </> :

                        <>
                            Send Message
                            <ArrowRight className="w-4 h-4" />
                          </>
                        }
                      </Button>
                    </motion.div>
                  </form>
                </div>
              </ScrollReveal>

              {/* Contact Information */}
              <div className="lg:col-span-2 space-y-6">
                <ScrollReveal delay={0.1}>
                  <p className="text-xs tracking-widest text-muted-foreground uppercase mb-6">
                    Our Offices
                  </p>
                </ScrollReveal>

                <StaggerContainer className="space-y-4" staggerDelay={0.12}>
                  {offices.map((office) =>
                  <StaggerItem key={office.name}>
                      <motion.div
                      whileHover={{ y: -3 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="premium-card p-6 group">
                      
                        {/* Gradient bg on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${office.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        <div className="relative">
                          <h3 className="text-lg font-semibold mb-4">{office.name}</h3>
                          <div className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex items-start gap-3 group/item">
                              <span className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover/item:bg-accent/10 transition-colors">
                                <MapPin className="h-3.5 w-3.5" />
                              </span>
                              <span className="pt-1.5">{office.address}</span>
                            </div>
                            <div className="flex items-center gap-3 group/item">
                              <span className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover/item:bg-accent/10 transition-colors">
                                <Phone className="h-3.5 w-3.5" />
                              </span>
                              <a
                              href={`tel:${office.phone.replace(/\s/g, '')}`}
                              className="hover:text-foreground transition-colors pt-0.5">
                              
                                {office.phone}
                              </a>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </StaggerItem>
                  )}

                  {/* Email */}
                  <StaggerItem>
                    <div className="premium-card p-6">
                      <div className="flex items-center gap-3 group/item">
                        <span className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover/item:bg-accent/10 transition-colors">
                          <Mail className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Email Us</p>
                          <a
                            href="mailto:info@gmrindia.com"
                            className="text-sm font-medium hover:text-accent transition-colors">
                            
                            info@gmrindia.com
                          </a>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                </StaggerContainer>
              </div>
            </div>
          </div>
        </section>

        {/* ── Map ────────────────────────────────────────────────────── */}
        <section className="py-12 md:py-16">
          <ScrollReveal>
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <div className="premium-card overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3507.0!2d77.03!3d28.47!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDI4JzEyLjAiTiA3N8KwMDEnNDguMCJF!5e0!3m2!1sen!2sin!4v1600000000000!5m2!1sen!2sin"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-700" />
                
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ── Business Hours ──────────────────────────────────────────── */}
        <section className="section-padding-sm bg-secondary/20">
          <ScrollReveal>
            <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">
                Business Hours
              </p>
              <h2 className="text-3xl md:text-4xl mb-12">When we're available</h2>

              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto" staggerDelay={0.12}>
                {[
                { day: "Weekdays", sub: "Monday – Friday", time: "9:00 AM – 6:00 PM", color: "from-blue-500" },
                { day: "Saturday", sub: "Half Day", time: "9:00 AM – 1:00 PM", color: "from-emerald-500" }].
                map((item) =>
                <StaggerItem key={item.day}>
                    <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="premium-card p-8 text-center group">
                    
                      {/* Top gradient accent */}
                      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.color} to-transparent`} />
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-secondary mx-auto mb-4 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                          <Clock className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">{item.day}</h3>
                        <p className="text-muted-foreground text-sm mb-3">{item.sub}</p>
                        <p className="text-xl font-medium">{item.time}</p>
                      </div>
                    </motion.div>
                  </StaggerItem>
                )}
              </StaggerContainer>

              <motion.p
                className="text-muted-foreground mt-10 text-sm"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}>
                
                Closed on Sundays and public holidays
              </motion.p>
            </div>
          </ScrollReveal>
        </section>

      </div>
    </PageTransition>);

}