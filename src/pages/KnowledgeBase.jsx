import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  BookOpen, Download, FileText, CheckSquare, ArrowRight, Search, ExternalLink,
  Shield, Calendar, IndianRupee, ClipboardList, Briefcase, Users, FileCheck, X
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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
      content: `1. Log in to the e-Filing portal using your PAN and password.
2. Go to 'e-File' > 'Income Tax Returns' > 'File Income Tax Return'.
3. Select the Assessment Year and Mode of Filing (Online).
4. Choose your Status (Individual) and select the applicable ITR form.
5. Review the pre-filled data and verify your income, deductions, and tax paid details.
6. Calculate the final tax computation. Pay if tax is due, or proceed if refund is due.
7. E-verify your return using Aadhaar OTP or net banking.`
    },
    {
      id: 2, title: "Understanding GST Input Tax Credit",
      description: "Learn how to claim ITC, eligible purchases, and common mistakes to avoid.",
      icon: IndianRupee, category: "GST", readTime: "6 min",
      content: `Input Tax Credit (ITC) means claiming the credit of the GST paid on purchase of goods and services which are used for the furtherance of business.
• Ensure the supplier has uploaded the invoice in their GSTR-1.
• The invoice should reflect in your GSTR-2B.
• The goods or services must have been received.
• Tax must have been paid to the government.
Avoid claiming ITC on blocked credits under Section 17(5) such as food, beverages, and motor vehicles for personal use.`
    },
    {
      id: 3, title: "Tax Saving Strategies for Professionals",
      description: "Maximize your tax savings using Section 80C, 80D, HRA, NPS, and more.",
      icon: Shield, category: "Tax Planning", readTime: "10 min",
      content: `• Section 80C: Invest up to ₹1.5L in ELSS, PPF, EPF, Life Insurance, or Tax Saver FDs.
• Section 80CCD(1B): Get an extra ₹50,000 deduction via NPS (National Pension System).
• Section 80D: Claim up to ₹25,000 for health insurance premiums for self/family, and up to ₹50,000 for senior citizen parents.
• Section 24(b): Claim interest deduction on home loans up to ₹2 Lakhs.
• Presumptive Taxation (Section 44ADA): Professionals can declare 50% of gross receipts as profit to save on compliance.`
    },
    {
      id: 4, title: "Choosing the Right Business Structure",
      description: "Sole proprietorship vs Partnership vs LLP vs Pvt Ltd.",
      icon: Briefcase, category: "Business Setup", readTime: "7 min",
      content: `• Sole Proprietorship: Easiest to start, low compliance, but unlimited liability. Best for freelancers and small single-owner businesses.
• Partnership: Good for multiple owners, relatively easy to setup, but unlimited liability.
• LLP (Limited Liability Partnership): Benefits of both company and partnership. Limited liability, lower compliance than a Pvt Ltd.
• Private Limited Company: Separate legal entity, limited liability, easy to raise funds. High compliance required.`
    },
  ],
  downloads: [
    {
      id: 1, title: "Form 16 Request Letter Template",
      description: "Template to request your employer for Form 16.",
      category: "Templates", format: "TXT", size: "2 KB"
    },
    {
      id: 2, title: "Rent Receipt Generator / Format",
      description: "Standard rent receipt format for claiming HRA.",
      category: "Templates", format: "TXT", size: "1 KB"
    },
    {
      id: 3, title: "Tax Computation Excel Sheet FY 25-26",
      description: "Calculate your tax liability under old vs new regime.",
      category: "Tools", format: "CSV", size: "5 KB"
    },
    {
      id: 4, title: "GST Invoice Format Standard",
      description: "Compliant invoice format under GST regulations.",
      category: "Templates", format: "CSV", size: "3 KB"
    }
  ]
};

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState("checklists");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItem, setExpandedItem] = useState(null);

  const filteredChecklists = RESOURCES.checklists.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredGuides = RESOURCES.guides.filter(g =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDownloads = RESOURCES.downloads.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (download) => {
    let content = "";
    let mimeType = "text/plain";
    let extension = "txt";

    if (download.title.includes("Form 16")) {
      content = "Date: [Current Date]\n\nTo,\nThe HR Manager,\n[Company Name]\n\nSubject: Request for Form 16\n\nDear Sir/Madam,\n\nPlease provide my Form 16 for the financial year 2024-25 so I can file my income tax returns.\n\nThank you,\n[Your Name]\n[Employee ID]";
      mimeType = "text/plain";
      extension = "txt";
    } else if (download.title.includes("Rent Receipt")) {
      content = "RENT RECEIPT\n\nReceived sum of Rs. _______ from Mr/Ms _______ towards rent of property located at _______ for the month of _______.\n\nLandlord Signature: _______\nLandlord PAN: _______";
      mimeType = "text/plain";
      extension = "txt";
    } else if (download.title.includes("Tax Computation")) {
      content = "Income Source,Amount\nSalary,1000000\nOther Sources,50000\nTotal Income,1050000\nDeductions (80C),150000\nNet Taxable Income,900000\nTax Payable,0";
      mimeType = "text/csv";
      extension = "csv";
    } else if (download.title.includes("GST Invoice")) {
      content = "Invoice No,Date,Customer,GSTIN,Item,Qty,Rate,Taxable Value,CGST,SGST,Total\nINV-001,2025-04-01,ABC Corp,27AAAAA0000A1Z5,Consulting,1,50000,50000,4500,4500,59000";
      mimeType = "text/csv";
      extension = "csv";
    } else {
      content = "Sample document content.";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${download.title.replace(/\s+/g, '_')}_Sample.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${download.title} Sample`);
  };

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
              Checklists, step-by-step guides, and downloadable resources to help you stay compliant and informed.
            </motion.p>
            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search checklists, guides, downloads..."
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
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-secondary/80 rounded-xl h-11">
                <TabsTrigger value="checklists" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <CheckSquare className="w-4 h-4 hidden sm:block" />Checklists ({filteredChecklists.length})
                </TabsTrigger>
                <TabsTrigger value="guides" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <BookOpen className="w-4 h-4 hidden sm:block" />Guides ({filteredGuides.length})
                </TabsTrigger>
                <TabsTrigger value="downloads" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <Download className="w-4 h-4 hidden sm:block" />Downloads ({filteredDownloads.length})
                </TabsTrigger>
              </TabsList>

              {/* Checklists */}
              <TabsContent value="checklists" className="space-y-4">
                {filteredChecklists.length === 0 && <p className="text-center text-muted-foreground py-12">No checklists found.</p>}
                {filteredChecklists.map((checklist, i) => {
                  const Icon = checklist.icon;
                  const isOpen = expandedItem === `checklist-${checklist.id}`;
                  return (
                    <motion.div key={checklist.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="border-border/50 overflow-hidden">
                        <button onClick={() => setExpandedItem(isOpen ? null : `checklist-${checklist.id}`)} className="w-full text-left">
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
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: easing }}>
                              <CardContent className="border-t border-border/30 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {checklist.content.map((item, idx) => (
                                    <label key={idx} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-secondary/30 cursor-pointer transition-colors group">
                                      <input type="checkbox" className="mt-0.5 rounded border-primary" />
                                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{item}</span>
                                    </label>
                                  ))}
                                </div>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}
              </TabsContent>

              {/* Guides */}
              <TabsContent value="guides" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGuides.length === 0 && <p className="text-center text-muted-foreground py-12 col-span-2">No guides found.</p>}
                {filteredGuides.map((guide, i) => {
                  const Icon = guide.icon;
                  const isOpen = expandedItem === `guide-${guide.id}`;
                  return (
                    <motion.div key={guide.id} className="h-full"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className={`border-border/50 h-full transition-all duration-300 ${isOpen ? "ring-1 ring-primary/50 shadow-md" : "hover:shadow-soft"}`}>
                        <button onClick={() => setExpandedItem(isOpen ? null : `guide-${guide.id}`)} className="w-full text-left">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-border/50 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div className="flex-1">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{guide.category}</span>
                                <h3 className="font-semibold mt-2 mb-1 group-hover:text-accent transition-colors">{guide.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{guide.description}</p>
                                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="w-3 h-3" />
                                    <span>{guide.readTime} read</span>
                                  </div>
                                  <span className="text-primary hover:underline">{isOpen ? "Hide Details" : "Read More"}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                              <div className="px-6 pb-6 pt-2 border-t border-border/30">
                                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                  {guide.content.split('\n').map((line, idx) => (
                                    <p key={idx} className="mb-2">{line}</p>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}
              </TabsContent>

              {/* Downloads */}
              <TabsContent value="downloads" className="space-y-4">
                {filteredDownloads.length === 0 && <p className="text-center text-muted-foreground py-12">No downloads found.</p>}
                {filteredDownloads.map((download, i) => (
                  <motion.div key={download.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="border-border/50 group hover:shadow-sm transition-all">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                            <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold mb-0.5 group-hover:text-primary transition-colors">{download.title}</h3>
                            <p className="text-xs text-muted-foreground">{download.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="bg-secondary px-2 py-0.5 rounded">{download.format}</span>
                            <span>{download.size}</span>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2 rounded-xl hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors" onClick={() => handleDownload(download)}>
                            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>
            </Tabs>

            {/* CTA */}
            <ScrollReveal>
              <div className="mt-16 text-center bg-secondary/30 rounded-3xl p-8 border border-border/50">
                <h3 className="text-xl font-semibold mb-2">Need Professional Assistance?</h3>
                <p className="text-muted-foreground mb-6">Our experts are ready to help you with personalized advisory and compliance.</p>
                <Button asChild size="lg" className="rounded-xl gap-2 bg-foreground text-background hover:bg-foreground/90">
                  <Link to="/contact">Get in Touch <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
