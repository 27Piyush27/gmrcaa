import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  BookOpen, Download, FileText, CheckSquare, ArrowRight, Search, ExternalLink,
  Shield, Calendar, IndianRupee, ClipboardList, Briefcase, Users, FileCheck
} from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

const RESOURCES = {
  checklists: [
    {
      id: 1, title: "ITR Filing Documents Checklist",
      description: "Complete list of documents needed for income tax return filing — PAN, Form 16, bank statements, investment proofs & more.",
      icon: FileCheck, category: "Income Tax", items: 18,
      content: [
        "PAN Card copy", "Aadhaar Card copy", "Form 16 from employer", "Form 16A (TDS on non-salary income)",
        "Bank statements (all accounts)", "Interest certificates from banks", "Investment proofs (80C, 80D, 80E)",
        "Home loan interest certificate", "Rent receipts (if claiming HRA)", "Capital gains statements",
        "Property tax receipts", "Foreign income details (if any)", "Donation receipts (Section 80G)",
        "Medical insurance premium receipts", "Tuition fee receipts", "NPS contribution proof",
        "Previous year ITR acknowledgment", "Form 26AS / AIS from TRACES"
      ]
    },
    {
      id: 2, title: "GST Registration Checklist",
      description: "Everything you need to register for GST — documents for proprietorship, partnership, and companies.",
      icon: ClipboardList, category: "GST", items: 14,
      content: [
        "PAN of the business/owner", "Aadhaar of proprietor/partners/directors", "Proof of business registration",
        "Bank account statement/passbook (cancelled cheque)", "Address proof of business premises",
        "Rent/lease agreement (if rented)", "NOC from owner of premises", "Electricity bill of premises",
        "Partnership deed (for partnership firms)", "MOA & AOA (for companies)", "Board resolution (for companies)",
        "Letter of Authorization/Board resolution for authorized signatory",
        "Photographs of promoters/partners/directors", "Digital Signature Certificate (DSC)"
      ]
    },
    {
      id: 3, title: "Company Incorporation Checklist",
      description: "Step-by-step document checklist for incorporating a Private Limited Company in India.",
      icon: Briefcase, category: "Business Setup", items: 12,
      content: [
        "DSC (Digital Signature Certificate) for all directors", "DIN (Director Identification Number)",
        "Company name approval (RUN/SPICe+)", "MOA (Memorandum of Association)",
        "AOA (Articles of Association)", "Registered office address proof",
        "Identity proof of all directors (Aadhaar/Passport)", "Address proof of all directors",
        "PAN card of all directors", "Passport-size photographs", "NOC from premises owner",
        "Utility bill of registered office (not older than 2 months)"
      ]
    },
    {
      id: 4, title: "Audit Preparation Checklist",
      description: "Prepare for your statutory audit with this comprehensive checklist of financial records and documents.",
      icon: Shield, category: "Audit", items: 15,
      content: [
        "Trial balance (year-end)", "General ledger", "Bank reconciliation statements",
        "Fixed asset register", "Depreciation schedule", "Inventory valuation report",
        "Accounts receivable aging", "Accounts payable listing", "Loan agreements & schedules",
        "Board minutes & resolutions", "Tax computation and challan copies", "TDS/TCS returns filed",
        "GST returns and reconciliation", "Related party transaction details",
        "Previous year's audited financial statements"
      ]
    },
  ],
  guides: [
    {
      id: 1, title: "How to File ITR Online — Step by Step",
      description: "A detailed walkthrough of filing your Income Tax Return on the e-filing portal.",
      icon: FileText, category: "Income Tax", readTime: "8 min",
    },
    {
      id: 2, title: "Understanding GST Input Tax Credit",
      description: "Learn how to claim ITC, eligible purchases, and common mistakes to avoid.",
      icon: IndianRupee, category: "GST", readTime: "6 min",
    },
    {
      id: 3, title: "Tax Saving Strategies for Salaried Professionals",
      description: "Maximize your tax savings using Section 80C, 80D, HRA, NPS, and more.",
      icon: Shield, category: "Tax Planning", readTime: "10 min",
    },
    {
      id: 4, title: "Choosing the Right Business Structure",
      description: "Sole proprietorship vs Partnership vs LLP vs Pvt Ltd — which one is right for you?",
      icon: Briefcase, category: "Business Setup", readTime: "7 min",
    },
    {
      id: 5, title: "Important Tax Deadlines FY 2025-26",
      description: "A complete calendar of ITR, GST, TDS, and compliance deadlines for the financial year.",
      icon: Calendar, category: "Compliance", readTime: "5 min",
    },
    {
      id: 6, title: "Employee vs Contractor — Tax Implications",
      description: "Understand the tax treatment differences between hiring employees and independent contractors.",
      icon: Users, category: "HR & Tax", readTime: "6 min",
    },
  ]
};

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState("checklists");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedChecklist, setExpandedChecklist] = useState(null);

  const filteredChecklists = RESOURCES.checklists.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredGuides = RESOURCES.guides.filter(g =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full bg-indigo-400/[0.06] blur-3xl pointer-events-none animate-breathe" />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <BookOpen className="w-3.5 h-3.5" /> Knowledge Base
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.12 }}>
              Resource <span className="italic gradient-text-premium">Center</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.28 }}>
              Checklists, guides, and resources to help you stay compliant and informed.
            </motion.p>
            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search checklists, guides..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="premium-input pl-11 h-12 rounded-xl"
              />
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/80 rounded-xl h-11">
                <TabsTrigger value="checklists" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <CheckSquare className="w-4 h-4" />Checklists ({filteredChecklists.length})
                </TabsTrigger>
                <TabsTrigger value="guides" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <BookOpen className="w-4 h-4" />Guides ({filteredGuides.length})
                </TabsTrigger>
              </TabsList>

              {/* Checklists */}
              <TabsContent value="checklists" className="space-y-4">
                {filteredChecklists.map((checklist, i) => {
                  const Icon = checklist.icon;
                  const isOpen = expandedChecklist === checklist.id;
                  return (
                    <motion.div key={checklist.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}>
                      <Card className="border-border/50 overflow-hidden">
                        <button
                          onClick={() => setExpandedChecklist(isOpen ? null : checklist.id)}
                          className="w-full text-left">
                          <CardHeader className="hover:bg-secondary/30 transition-colors">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-border/50 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <CardTitle className="text-base">{checklist.title}</CardTitle>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{checklist.category}</span>
                                </div>
                                <CardDescription>{checklist.description}</CardDescription>
                                <p className="text-xs text-muted-foreground mt-2">{checklist.items} items</p>
                              </div>
                            </div>
                          </CardHeader>
                        </button>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            transition={{ duration: 0.3, ease: easing }}>
                            <CardContent className="border-t border-border/30">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                {checklist.content.map((item, idx) => (
                                  <label key={idx} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-secondary/30 cursor-pointer transition-colors group">
                                    <input type="checkbox" className="mt-0.5 rounded" />
                                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{item}</span>
                                  </label>
                                ))}
                              </div>
                            </CardContent>
                          </motion.div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </TabsContent>

              {/* Guides */}
              <TabsContent value="guides" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGuides.map((guide, i) => {
                  const Icon = guide.icon;
                  return (
                    <motion.div key={guide.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}>
                      <Card className="border-border/50 h-full hover:shadow-soft hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-border/50 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{guide.category}</span>
                              <h3 className="font-semibold mt-2 mb-1 group-hover:text-accent transition-colors">{guide.title}</h3>
                              <p className="text-sm text-muted-foreground leading-relaxed">{guide.description}</p>
                              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <BookOpen className="w-3 h-3" />
                                <span>{guide.readTime} read</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </TabsContent>
            </Tabs>

            {/* CTA */}
            <ScrollReveal>
              <div className="mt-16 text-center">
                <p className="text-muted-foreground mb-4">Can't find what you're looking for?</p>
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <Link to="/contact">Contact Our Team <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
