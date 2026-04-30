import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Loader2, ArrowRight, Clock, Send, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";

const offices = [
  {
    name: "Gurgaon Office",
    address: "H.No.43, SF, Sector-7, Gurugram",
    phone: "+91 98712 09393",
  },
  {
    name: "Delhi Office",
    address: "AB 38, Ground Floor, Shalimar Bagh",
    phone: "+91 98710 84875",
  },
];

const hours = [
  { day: "Weekdays", sub: "Monday – Friday", time: "9:00 AM – 6:00 PM" },
  { day: "Saturday", sub: "Half Day", time: "9:00 AM – 1:00 PM" },
];

/* Simple fade variant */
const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    
    try {
      // 1. Save to Supabase DB so it appears in the Admin Dashboard
      const { error: dbErr } = await supabase.from("contact_inquiries").insert([
        { name: formData.name, email: formData.email, subject: formData.subject, message: formData.message, status: "new" },
      ]);
      
      if (dbErr) console.error("DB insert error:", dbErr);

      // 2. Send email directly to info@gmrindia.com using FormSubmit API
      const res = await fetch("https://formsubmit.co/ajax/info@gmrindia.com", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          _subject: `New Contact Form Inquiry: ${formData.subject}`,
          _template: "table"
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === "false") {
        throw new Error(data?.message || "Failed to send message via email provider");
      }

      toast.success("Thank you! Your message has been sent successfully.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      
    } catch (err) {
      console.error("Contact form error:", err);
      toast.error(err.message || "Failed to send email. Please try emailing us directly at info@gmrindia.com");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <PageTransition>
      <div className="min-h-screen">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative pt-28 pb-14 md:pt-36 md:pb-20 overflow-hidden">
          {/* Soft ambient glow — pure CSS, GPU-composited */}
          <div
            className="absolute top-1/4 right-1/4 w-[26rem] h-[26rem] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 70%)", transform: "translateZ(0)" }}
          />
          <div
            className="absolute bottom-0 left-1/3 w-[20rem] h-[20rem] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(260 60% 55% / 0.04) 0%, transparent 70%)", transform: "translateZ(0)" }}
          />

          <div className="max-w-5xl mx-auto px-6 lg:px-12 relative">
            <motion.p
              className="text-xs tracking-widest text-muted-foreground uppercase mb-6"
              initial="hidden" animate="visible" variants={fade} custom={0}
            >
              Contact
            </motion.p>
            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight mb-8 text-balance max-w-4xl"
              initial="hidden" animate="visible" variants={fade} custom={0.1}
            >
              Get in{" "}
              <span className="italic gradient-text-premium">touch.</span>
            </motion.h1>
            <motion.p
              className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed"
              initial="hidden" animate="visible" variants={fade} custom={0.2}
            >
              We're ready to answer your questions and help you get started
              with the right financial strategy.
            </motion.p>
          </div>
        </section>

        {/* ── Contact Form & Info ─────────────────────────────────── */}
        <section className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">

              {/* Contact Form */}
              <motion.div
                className="lg:col-span-3"
                initial="hidden" animate="visible" variants={fade} custom={0.15}
              >
                <div className="rounded-2xl border border-border/50 bg-card p-8 md:p-10 transition-shadow duration-500 hover:shadow-lg">
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
                      <div className="space-y-2">
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
                          required
                        />
                      </div>
                      <div className="space-y-2">
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
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
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
                        required
                      />
                    </div>

                    <div className="space-y-2">
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
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-12 px-8 rounded-xl text-sm font-medium gap-2 w-full sm:w-auto transition-all duration-300 active:scale-[0.97]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : sent ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Sent!
                        </>
                      ) : (
                        <>
                          Send Message
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                className="lg:col-span-2 space-y-4"
                initial="hidden" animate="visible" variants={fade} custom={0.25}
              >
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-6">
                  Our Offices
                </p>

                {offices.map((office) => (
                  <div
                    key={office.name}
                    className="rounded-2xl border border-border/50 bg-card p-6 transition-all duration-400 hover:shadow-md hover:border-border/80 hover:-translate-y-0.5"
                  >
                    <h3 className="text-lg font-semibold mb-4">{office.name}</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-3.5 w-3.5" />
                        </span>
                        <span className="pt-1.5">{office.address}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                          <Phone className="h-3.5 w-3.5" />
                        </span>
                        <a
                          href={`tel:${office.phone.replace(/\s/g, "")}`}
                          className="hover:text-foreground transition-colors pt-0.5"
                        >
                          {office.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Email card */}
                <div className="rounded-2xl border border-border/50 bg-card p-6 transition-all duration-400 hover:shadow-md hover:border-border/80 hover:-translate-y-0.5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Email Us</p>
                      <a
                        href="mailto:info@gmrindia.com"
                        className="text-sm font-medium hover:text-accent transition-colors"
                      >
                        info@gmrindia.com
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Map ─────────────────────────────────────────────────── */}
        <section className="py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            {/* Subtle divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-10" />

            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3507.0!2d77.03!3d28.47!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDI4JzEyLjAiTiA3N8KwMDEnNDguMCJF!5e0!3m2!1sen!2sin!4v1600000000000!5m2!1sen!2sin"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>
        </section>

        {/* ── Business Hours ──────────────────────────────────────── */}
        <section className="py-16 md:py-24 bg-secondary/20">
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
            <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">
              Business Hours
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-12">
              When we're available
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {hours.map((item) => (
                <div
                  key={item.day}
                  className="rounded-2xl border border-border/50 bg-card p-8 text-center transition-all duration-400 hover:shadow-md hover:border-border/80 hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary mx-auto mb-4 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{item.day}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{item.sub}</p>
                  <p className="text-xl font-medium">{item.time}</p>
                </div>
              ))}
            </div>

            <p className="text-muted-foreground mt-10 text-sm">
              Closed on Sundays and public holidays
            </p>
          </div>
        </section>

      </div>
    </PageTransition>
  );
}