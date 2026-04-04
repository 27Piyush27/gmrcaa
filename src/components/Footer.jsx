import { Link } from "react-router-dom";

import { ArrowUpRight, Mail, Phone, MapPin } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

export const Footer = () => {
  const year = new Date().getFullYear();

  const links = {
    company: [
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Contact", path: "/contact" },
    { name: "Client Portal", path: "/dashboard" },
    { name: "Blog", path: "/blog" },
    { name: "FAQ", path: "/faq" },
    { name: "Team", path: "/team" },
    { name: "Testimonials", path: "/testimonials" },
    { name: "Feedback", path: "/feedback" }],

    services: [
    { name: "Tax Calculator", path: "/tax-calculator" },
    { name: "Financial Calculators", path: "/calculators" },
    { name: "GST Tracker", path: "/gst-tracker" },
    { name: "Expense Tracker", path: "/expenses" },
    { name: "Resource Center", path: "/resources" },
    { name: "Book Consultation", path: "/appointments" },
    { name: "View All Services", path: "/services" }],

    legal: [
    { name: "Terms of Service", path: "/terms" },
    { name: "Privacy Policy", path: "/privacy" }]

  };

  return (
    <footer className="relative border-t border-border/40 mt-0">
      {/* Gradient top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <ScrollReveal>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

            {/* Brand */}
            <div className="md:col-span-5">
              <p className="text-lg font-semibold tracking-tight mb-4">
                GMR<span className="text-accent">&</span>Associates
              </p>
              <p className="text-muted-foreground text-[15px] leading-relaxed max-w-sm mb-8">
                Chartered Accountants providing comprehensive professional services
                with precision and integrity since 2011.
              </p>

              <div className="space-y-3">
                <a
                  href="mailto:info@gmrindia.com"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                  
                  <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  info@gmrindia.com
                </a>
                <a
                  href="tel:+919871209393"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                  
                  <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                  +91 98712 09393
                </a>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <MapPin className="h-3.5 w-3.5" />
                  </span>
                  Gurgaon & Delhi, India
                </div>
              </div>
            </div>

            {/* Company Links */}
            <div className="md:col-span-2 md:col-start-7">
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-5">
                Company
              </p>
              <ul className="space-y-3">
                {links.company.map((link) =>
                <li key={link.path + link.name}>
                    <Link
                    to={link.path}
                    className="text-[15px] text-foreground/70 hover:text-foreground hover:translate-x-0.5 transition-all duration-200 flex items-center gap-1.5 group">
                    
                      {link.name}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200" />
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Services Links */}
            <div className="md:col-span-2">
              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-5">
                Services
              </p>
              <ul className="space-y-3">
                {links.services.map((link) =>
                <li key={link.path + link.name}>
                    <Link
                    to={link.path}
                    className="text-[15px] text-foreground/70 hover:text-foreground hover:translate-x-0.5 transition-all duration-200 flex items-center gap-1.5 group">
                    
                      {link.name}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200" />
                    </Link>
                  </li>
                )}
              </ul>

              <p className="text-xs tracking-widest text-muted-foreground uppercase mb-5 mt-8">
                Legal
              </p>
              <ul className="space-y-3">
                {links.legal.map((link) =>
                <li key={link.path + link.name}>
                    <Link
                    to={link.path}
                    className="text-[15px] text-foreground/70 hover:text-foreground hover:translate-x-0.5 transition-all duration-200 flex items-center gap-1.5 group">
                    
                      {link.name}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200" />
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border/40 flex flex-col items-center gap-4">
            <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-muted-foreground">
                © {year} GMR & Associates. All rights reserved. Chartered Accountants.
              </p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs text-muted-foreground">Available for new clients</p>
              </div>
            </div>

            {/* University project credit */}
            <div className="w-full pt-4 border-t border-border/20 flex flex-col items-center gap-1.5">
              <p className="text-[11px] text-muted-foreground/70 tracking-wide">
                A Major Project by students of{" "}
                <span className="font-medium text-muted-foreground">
                  Jaypee University of Information Technology, Solan
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1 flex-wrap justify-center">
                Built by{" "}
                <a
                  href="https://www.linkedin.com/in/piyushthakur2727"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground/60 hover:text-accent transition-colors underline underline-offset-2 decoration-accent/30 hover:decoration-accent"
                >
                  Piyush Thakur
                </a>
                <span className="text-border">•</span>
                <span className="font-medium text-foreground/60">Pranav Roy</span>
                <span className="text-border">•</span>
                <span className="font-medium text-foreground/60">Aakarsh Sharma</span>
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </footer>);

};