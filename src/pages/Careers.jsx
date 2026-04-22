import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase, GraduationCap, MapPin, Clock, ChevronDown, Send,
  Shield, FileCheck, IndianRupee, Users, Building2, ArrowRight, Star, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

const easing = [0.22, 1, 0.36, 1];

const STORAGE_KEY = "gmr_career_positions";

const ICON_MAP = {
  "Audit & Assurance": Shield,
  "Tax Advisory": IndianRupee,
  "GST & Indirect Tax": FileCheck,
  "Articleship Program": GraduationCap,
  "Corporate Advisory": Briefcase,
  "Accounting & Bookkeeping": FileCheck,
  "Other": Briefcase,
};

const GRADIENT_MAP = {
  blue: "from-blue-500 to-cyan-400",
  emerald: "from-emerald-500 to-teal-400",
  purple: "from-purple-500 to-indigo-400",
  orange: "from-orange-500 to-amber-400",
  rose: "from-rose-500 to-pink-400",
  sky: "from-sky-500 to-blue-400",
};

// Default positions used as fallback
const DEFAULT_POSITIONS = [
  {
    id: "audit-senior",
    title: "Senior Associate – Audit & Assurance",
    department: "Audit & Assurance",
    type: "Full-Time",
    location: "Gurgaon / Delhi",
    experience: "3–5 years",
    color: "blue",
    description:
      "Join our audit practice and lead engagement teams for statutory and internal audits across diverse industries including manufacturing, NBFC, and IT.",
    responsibilities: [
      "Lead and execute statutory audits under Companies Act, 2013",
      "Conduct internal audits and prepare risk assessment reports",
      "Coordinate with senior management and audit committees",
      "Review financial statements and ensure compliance with Ind AS",
      "Mentor and supervise junior team members",
    ],
    requirements: [
      "Qualified CA (ACA / FCA)",
      "3–5 years of post-qualification experience in audit",
      "Strong knowledge of Ind AS, SA standards, and Companies Act",
      "Excellent analytical and communication skills",
      "Proficiency in audit tools and MS Excel",
    ],
    published: true,
    highlight: false,
  },
  {
    id: "tax-associate",
    title: "Associate – Direct Tax Advisory",
    department: "Tax Advisory",
    type: "Full-Time",
    location: "Gurgaon / Delhi",
    experience: "1–3 years",
    color: "emerald",
    description:
      "Work on complex direct tax matters including income tax return filings, assessments, appeals, and tax planning for individuals and corporates.",
    responsibilities: [
      "Prepare and file Income Tax Returns for individuals, firms, and companies",
      "Handle income tax assessments, notices, and appellate proceedings",
      "Tax planning and advisory for HNI clients and corporates",
      "Research and draft opinions on complex tax matters",
      "Assist in transfer pricing documentation",
    ],
    requirements: [
      "Qualified CA (ACA) or CA-Inter with relevant experience",
      "1–3 years of experience in direct taxation",
      "Knowledge of Income Tax Act, 1961 and recent amendments",
      "Familiarity with income tax e-filing portal and procedures",
      "Strong research and drafting skills",
    ],
    published: true,
    highlight: false,
  },
  {
    id: "gst-executive",
    title: "Executive – GST & Indirect Tax",
    department: "GST & Indirect Tax",
    type: "Full-Time",
    location: "Gurgaon",
    experience: "2–4 years",
    color: "purple",
    description:
      "Manage GST compliance for a portfolio of 200+ clients, ensure timely filing, and handle audits, refunds, and department assessments.",
    responsibilities: [
      "Prepare and file GSTR-1, GSTR-3B, GSTR-9 & GSTR-9C",
      "Handle GST audits, assessments, and departmental queries",
      "Advise clients on GST implications of business transactions",
      "Assist in GST refund applications and follow-ups",
      "Keep abreast of GST amendments and circulars",
    ],
    requirements: [
      "CA-Inter / B.Com with GST certification preferred",
      "2–4 years of hands-on GST compliance experience",
      "Thorough knowledge of CGST/SGST/IGST Acts and Rules",
      "Experience with GST portal and e-invoicing",
      "Attention to detail and ability to manage deadlines",
    ],
    published: true,
    highlight: false,
  },
  {
    id: "ca-articleship",
    title: "CA Articleship – Internship for CA Students",
    department: "Articleship Program",
    type: "Internship (3 Years)",
    location: "Gurgaon / Delhi",
    experience: "CA Students (IPCC / Inter cleared)",
    color: "orange",
    description:
      "Begin your CA journey with hands-on experience at one of Delhi-NCR's most trusted firms. Get exposure to audit, taxation, GST, and corporate advisory under the mentorship of experienced partners.",
    responsibilities: [
      "Assist in statutory and internal audits of various entities",
      "Prepare income tax computations and file returns",
      "Support GST compliance and reconciliation work",
      "Participate in company incorporation and ROC filings",
      "Exposure to real client interactions and firm-wide projects",
    ],
    requirements: [
      "Cleared CA IPCC / CA Intermediate examination",
      "Registered with ICAI for articleship",
      "Strong academic record and commitment to learning",
      "Good communication skills in English and Hindi",
      "Willingness to work in a fast-paced professional environment",
    ],
    published: true,
    highlight: true,
  },
];

function loadPublishedPositions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const all = JSON.parse(stored);
      return all.filter((p) => p.published !== false);
    }
  } catch {
    // ignore
  }
  return DEFAULT_POSITIONS.filter((p) => p.published !== false);
}

const PERKS = [
  { icon: "📚", title: "Learning & Growth", desc: "Regular CPE sessions, access to premium courses, and mentorship programs" },
  { icon: "💼", title: "Diverse Exposure", desc: "Work across industries — NBFC, manufacturing, IT, healthcare, startups" },
  { icon: "🏠", title: "Flexible Work", desc: "Hybrid work model with flexibility during non-peak seasons" },
  { icon: "🎯", title: "Career Advancement", desc: "Clear growth path from Associate to Partner with transparent evaluations" },
  { icon: "🤝", title: "Supportive Culture", desc: "Collaborative team environment with regular team activities and outings" },
  { icon: "💰", title: "Competitive Pay", desc: "Industry-leading compensation with performance bonuses and stipends" },
];

export default function Careers() {
  const [positions, setPositions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });

  useEffect(() => {
    setPositions(loadPublishedPositions());
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleApply = (title) => {
    setSelectedRole(title);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Application submitted successfully! We'll get back to you within 3-5 business days.");
    setFormData({ name: "", email: "", phone: "", message: "" });
    setShowForm(false);
    setSelectedRole("");
  };

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div
            className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-orange-400/[0.04] animate-breathe pointer-events-none"
            style={{ filter: "blur(60px)", willChange: "transform", transform: "translateZ(0)" }}
          />
          <div
            className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-purple-400/[0.03] animate-breathe pointer-events-none"
            style={{ filter: "blur(50px)", willChange: "transform", transform: "translateZ(0)", animationDelay: "-3s" }}
          />
          <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8"
            >
              <Briefcase className="w-3.5 h-3.5" /> Join Our Team
            </motion.div>
            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.12 }}
            >
              Build Your <span className="italic gradient-text-premium">Career</span> With Us
            </motion.h1>
            <motion.p
              className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.28 }}
            >
              Join a team of passionate professionals at one of Delhi-NCR's most trusted CA firms.
              We offer meaningful work, real growth, and an environment where excellence thrives.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80">
                <Building2 className="w-3.5 h-3.5" /> {positions.length} Open Positions
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80">
                <MapPin className="w-3.5 h-3.5" /> Gurgaon & Delhi
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80">
                <Users className="w-3.5 h-3.5" /> 30+ Team Members
              </span>
            </motion.div>
          </div>
        </section>

        {/* Why Join Us */}
        <section className="py-16 md:py-20 bg-secondary/20">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Why GMR & Associates</p>
                <h2 className="text-3xl md:text-4xl font-semibold">More Than Just a Workplace</h2>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PERKS.map((perk, i) => (
                <ScrollReveal key={i} delay={i * 0.06}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="premium-card p-6 h-full group"
                  >
                    <span className="text-2xl mb-3 block">{perk.icon}</span>
                    <h3 className="text-sm font-semibold mb-1.5 group-hover:text-accent transition-colors">{perk.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{perk.desc}</p>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="text-xs tracking-widest text-muted-foreground uppercase mb-4">Open Positions</p>
                <h2 className="text-3xl md:text-4xl font-semibold">Find Your Role</h2>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              {positions.map((pos, i) => {
                const Icon = ICON_MAP[pos.department] || Briefcase;
                const gradient = GRADIENT_MAP[pos.color] || "from-blue-500 to-cyan-400";
                const isOpen = expandedId === pos.id;
                return (
                  <ScrollReveal key={pos.id} delay={i * 0.08}>
                    <motion.div
                      layout
                      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                        pos.highlight
                          ? "border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20"
                          : "border-border/50 bg-card"
                      } ${isOpen ? "shadow-lg" : "shadow-sm hover:shadow-md"}`}
                    >
                      {/* Header */}
                      <button
                        onClick={() => toggleExpand(pos.id)}
                        className="w-full flex items-center gap-4 p-5 md:p-6 text-left"
                      >
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold truncate">{pos.title}</h3>
                            {pos.highlight && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 text-[10px] font-semibold uppercase tracking-wider">
                                <Star className="w-2.5 h-2.5" /> Featured
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{pos.location}</span>
                            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{pos.type}</span>
                            <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" />{pos.experience}</span>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                      </button>

                      {/* Expandable Content */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: easing }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 md:px-6 pb-6 pt-0">
                              <div className="border-t border-border/40 pt-5 space-y-5">
                                <p className="text-sm text-muted-foreground leading-relaxed">{pos.description}</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Key Responsibilities</h4>
                                    <ul className="space-y-2">
                                      {(pos.responsibilities || []).map((r, j) => (
                                        <li key={j} className="flex items-start gap-2 text-sm text-foreground/80">
                                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-${pos.color}-500`} />
                                          {r}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Requirements</h4>
                                    <ul className="space-y-2">
                                      {(pos.requirements || []).map((r, j) => (
                                        <li key={j} className="flex items-start gap-2 text-sm text-foreground/80">
                                          <ArrowRight className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-${pos.color}-500`} />
                                          {r}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                <Button
                                  onClick={() => handleApply(pos.title)}
                                  className="rounded-xl gap-2 mt-2"
                                >
                                  <Send className="w-4 h-4" /> Apply for this Position
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Application Form */}
        <AnimatePresence>
          {showForm && (
            <motion.section
              id="application-form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.5, ease: easing }}
              className="py-16 md:py-20 bg-secondary/20"
            >
              <div className="max-w-2xl mx-auto px-6 lg:px-12">
                <div className="text-center mb-8">
                  <p className="text-xs tracking-widest text-muted-foreground uppercase mb-3">Application</p>
                  <h2 className="text-2xl md:text-3xl font-semibold mb-2">Apply Now</h2>
                  <p className="text-sm text-muted-foreground">
                    Applying for: <span className="font-medium text-foreground">{selectedRole}</span>
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="premium-card p-6 md:p-8 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        required
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="premium-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        required
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="premium-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input
                      required
                      type="tel"
                      placeholder="+91 98XXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="premium-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cover Note</Label>
                    <Textarea
                      placeholder="Tell us briefly why you're interested in this role..."
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="premium-input resize-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can also email your resume directly to{" "}
                    <a href="mailto:careers@gmrindia.com" className="text-accent underline underline-offset-2">
                      careers@gmrindia.com
                    </a>
                  </p>
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1 h-11 rounded-xl gap-2">
                      <Send className="w-4 h-4" /> Submit Application
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => { setShowForm(false); setSelectedRole(""); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* CTA */}
        <section className="py-20 md:py-28 bg-foreground text-background relative overflow-hidden">
          <div
            className="absolute top-0 left-1/2 w-[500px] h-[250px] rounded-full bg-accent/15 pointer-events-none"
            style={{ transform: "translateX(-50%) translateZ(0)", filter: "blur(80px)" }}
          />
          <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center relative">
            <ScrollReveal>
              <h2 className="text-3xl sm:text-4xl font-semibold mb-4">Don't See Your Role?</h2>
              <p className="text-background/60 mb-8 max-w-md mx-auto">
                We're always open to hearing from talented professionals. Send us your CV and we'll keep you in mind for future openings.
              </p>
              <a
                href="mailto:careers@gmrindia.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-background text-foreground text-sm font-medium hover:bg-background/90 transition-colors"
              >
                <Send className="w-4 h-4" /> careers@gmrindia.com
              </a>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
