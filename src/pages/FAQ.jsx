import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, HelpCircle, FileText, Shield, CreditCard, Users, Building2, X } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const easing = [0.22, 1, 0.36, 1];

const FAQ_DATA = [
  {
    category: "General",
    icon: HelpCircle,
    items: [
      { q: "What services does GMR & Associates offer?", a: "We offer a comprehensive range of CA services including Income Tax Filing (ITR), GST Registration & Return Filing, Company Incorporation, Audit & Assurance, Tax Advisory, Payroll Management, and Compliance services." },
      { q: "How do I get started?", a: "Simply create an account, browse our services, and request the one you need. Our CA team will review your request and begin working on it. You only pay after the work is completed." },
      { q: "What are your working hours?", a: "Our office hours are Monday to Saturday, 10:00 AM to 7:00 PM IST. However, our AI chatbot is available 24/7 for basic queries." },
      { q: "Where is GMR & Associates located?", a: "We are headquartered in Gurgaon & Delhi, India. We serve clients across India through our digital platform." },
    ]
  },
  {
    category: "Payments",
    icon: CreditCard,
    items: [
      { q: "When do I need to pay?", a: "You only pay after our CA team completes the work on your service request. We follow a 'work first, pay later' model ensuring full transparency." },
      { q: "What payment methods are accepted?", a: "We accept all major credit/debit cards, UPI, net banking, and wallets through our secure Razorpay integration." },
      { q: "Can I get a refund?", a: "Refunds are processed on a case-by-case basis. If you're unsatisfied with our service, please contact us within 7 days of payment." },
      { q: "Is GST included in the price?", a: "GST at 18% is applicable on all services. The final invoice will show the base amount, GST breakdown (CGST + SGST), and total amount." },
      { q: "How do I download my invoice?", a: "After payment, you can download your invoice in PDF format from the Payment History section in your dashboard." },
    ]
  },
  {
    category: "Tax Filing",
    icon: FileText,
    items: [
      { q: "What documents do I need for ITR filing?", a: "You'll need your PAN card, Aadhaar, Form 16/16A, bank statements, investment proofs (80C, 80D), and any other income/deduction documents." },
      { q: "What is the deadline for ITR filing?", a: "For individuals, the ITR filing deadline is usually July 31st each year. For companies and audited firms, it's October 31st." },
      { q: "Which ITR form should I file?", a: "Our CA team will select the appropriate ITR form based on your income sources. ITR-1 for salaried individuals, ITR-3 for business income, ITR-4 for presumptive taxation, etc." },
      { q: "Can I file a revised return?", a: "Yes, a revised return can be filed before the end of the relevant assessment year if there are errors in the original return." },
    ]
  },
  {
    category: "GST",
    icon: Shield,
    items: [
      { q: "Who needs GST registration?", a: "GST registration is mandatory if your annual turnover exceeds ₹40 lakhs (₹20 lakhs for services). It's also required for inter-state suppliers and e-commerce sellers." },
      { q: "How often do I need to file GST returns?", a: "Regular taxpayers file GSTR-1 (monthly/quarterly) and GSTR-3B (monthly). Annual return GSTR-9 is filed once a year." },
      { q: "What is the penalty for late GST filing?", a: "Late fee is ₹50/day (₹20 for nil returns) up to a maximum of ₹10,000. Interest at 18% p.a. is also charged on outstanding tax." },
    ]
  },
  {
    category: "Company Law",
    icon: Building2,
    items: [
      { q: "How long does company incorporation take?", a: "Typically 7-15 business days from the time all documents are submitted correctly." },
      { q: "What is the minimum capital required?", a: "There is no minimum capital requirement for Private Limited Company incorporation in India." },
      { q: "Can a single person start a company?", a: "Yes, a One Person Company (OPC) requires only one director and one nominee. For a Private Limited Company, minimum 2 directors are required." },
    ]
  },
  {
    category: "Account & Security",
    icon: Users,
    items: [
      { q: "How is my data protected?", a: "We use Supabase with Row Level Security (RLS) ensuring your data is encrypted at rest and in transit. Only you and your assigned CA can access your documents." },
      { q: "Can I delete my account?", a: "Yes, you can request account deletion by contacting us. All your personal data will be permanently removed." },
      { q: "How do I reset my password?", a: "Click 'Forgot Password' on the login page. You'll receive a password reset link via email." },
    ]
  }
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItem, setOpenItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return FAQ_DATA.map(cat => ({
      ...cat,
      items: cat.items.filter(item =>
        (activeCategory === "All" || cat.category === activeCategory) &&
        (!q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q))
      )
    })).filter(cat => cat.items.length > 0);
  }, [searchQuery, activeCategory]);

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <HelpCircle className="w-3.5 h-3.5" /> Help Center
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.12 }}>
              Frequently Asked{" "}<span className="italic gradient-text-premium">Questions</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.28 }}>
              Find answers to common questions about our services, payments, and tax filing.
            </motion.p>
            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }} className="max-w-lg mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="text" placeholder="Search questions..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="premium-input pl-12 pr-10 h-14 text-base rounded-2xl" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </div>
        </section>

        {/* Category pills */}
        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="max-w-4xl mx-auto px-6 lg:px-12 py-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {["All", ...FAQ_DATA.map(c => c.category)].map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ list */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-12 space-y-8">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20">
                <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground text-sm">Try a different search term</p>
              </motion.div>
            ) : (
              filtered.map((cat, ci) => (
                <ScrollReveal key={cat.category}>
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <cat.icon className="w-5 h-5 text-muted-foreground" />
                      <h2 className="text-lg font-semibold">{cat.category}</h2>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{cat.items.length}</span>
                    </div>
                    <div className="space-y-2">
                      {cat.items.map((item, i) => {
                        const key = `${ci}-${i}`;
                        const isOpen = openItem === key;
                        return (
                          <motion.div key={key} layout className="apple-card overflow-hidden">
                            <button onClick={() => setOpenItem(isOpen ? null : key)}
                              className="w-full flex items-center justify-between p-5 text-left">
                              <span className="text-sm font-medium pr-4">{item.q}</span>
                              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              </motion.div>
                            </button>
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: easing }}>
                                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                                    {item.a}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollReveal>
              ))
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-32 bg-foreground text-background relative overflow-hidden">
          <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
            <ScrollReveal>
              <h2 className="text-3xl sm:text-4xl font-semibold mb-6">Still have questions?</h2>
              <p className="text-background/60 mb-10 max-w-xl mx-auto">Our team is here to help. Reach out and we'll get back to you.</p>
              <Button asChild size="lg" variant="secondary" className="rounded-xl gap-2">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
