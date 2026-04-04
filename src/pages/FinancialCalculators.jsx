import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Calculator, IndianRupee, TrendingUp, Home, ArrowRight, CheckCircle, Banknote } from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];
const fmt = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

// EMI Calculation: P * r * (1+r)^n / ((1+r)^n - 1)
function calculateEMI(principal, annualRate, tenureMonths) {
  if (!principal || !annualRate || !tenureMonths) return null;
  const r = annualRate / 12 / 100;
  const n = tenureMonths;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emi * n;
  const totalInterest = totalPayment - principal;
  return { emi: Math.round(emi), totalPayment: Math.round(totalPayment), totalInterest: Math.round(totalInterest), principal };
}

// SIP Calculation: SIP * ((1+r)^n - 1) / r * (1+r)
function calculateSIP(monthlySIP, annualReturn, years) {
  if (!monthlySIP || !annualReturn || !years) return null;
  const r = annualReturn / 12 / 100;
  const n = years * 12;
  const futureValue = monthlySIP * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  const invested = monthlySIP * n;
  const gains = futureValue - invested;
  return { futureValue: Math.round(futureValue), invested: Math.round(invested), gains: Math.round(gains) };
}

// HRA Exemption: Min of (Actual HRA, 50%/40% Basic, Rent - 10% Basic)
function calculateHRA(basicSalary, hra, rentPaid, metroCity) {
  if (!basicSalary || !hra || !rentPaid) return null;
  const actualHRA = hra;
  const percentOfBasic = metroCity ? basicSalary * 0.5 : basicSalary * 0.4;
  const rentMinusBasic = Math.max(0, rentPaid - basicSalary * 0.1);
  const exempt = Math.min(actualHRA, percentOfBasic, rentMinusBasic);
  const taxable = hra - exempt;
  return { exempt: Math.round(exempt), taxable: Math.round(taxable), actualHRA, percentOfBasic: Math.round(percentOfBasic), rentMinusBasic: Math.round(rentMinusBasic) };
}

function ResultRow({ label, value, highlight, bold }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "text-lg font-bold" : ""}`}>
      <span className={highlight ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={`font-medium ${highlight ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{value}</span>
    </div>
  );
}

export default function FinancialCalculators() {
  const [activeTab, setActiveTab] = useState("emi");

  // EMI State
  const [emiPrincipal, setEmiPrincipal] = useState("");
  const [emiRate, setEmiRate] = useState("");
  const [emiTenure, setEmiTenure] = useState("");
  const [emiResult, setEmiResult] = useState(null);

  // SIP State
  const [sipAmount, setSipAmount] = useState("");
  const [sipReturn, setSipReturn] = useState("");
  const [sipYears, setSipYears] = useState("");
  const [sipResult, setSipResult] = useState(null);

  // HRA State
  const [hraBasic, setHraBasic] = useState("");
  const [hraAmount, setHraAmount] = useState("");
  const [hraRent, setHraRent] = useState("");
  const [hraMetro, setHraMetro] = useState(true);
  const [hraResult, setHraResult] = useState(null);

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/4 right-1/3 w-72 h-72 rounded-full bg-blue-400/[0.06] blur-3xl pointer-events-none animate-breathe" />
          <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Calculator className="w-3.5 h-3.5" /> Financial Tools
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.12 }}>
              Financial <span className="italic gradient-text-premium">Calculators</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.28 }}>
              EMI, SIP & HRA calculators to help you plan your finances smarter.
            </motion.p>
          </div>
        </section>

        {/* Calculators */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-secondary/80 rounded-xl h-11">
                <TabsTrigger value="emi" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <Banknote className="w-4 h-4" />EMI
                </TabsTrigger>
                <TabsTrigger value="sip" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <TrendingUp className="w-4 h-4" />SIP
                </TabsTrigger>
                <TabsTrigger value="hra" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <Home className="w-4 h-4" />HRA
                </TabsTrigger>
              </TabsList>

              {/* EMI Calculator */}
              <TabsContent value="emi" className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>EMI Calculator</CardTitle>
                    <CardDescription>Calculate your Equated Monthly Installment for any loan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Loan Amount (₹)</Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="number" placeholder="e.g. 50,00,000" value={emiPrincipal} onChange={e => setEmiPrincipal(e.target.value)} className="premium-input pl-9" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Interest Rate (% p.a.)</Label>
                        <Input type="number" placeholder="e.g. 8.5" value={emiRate} onChange={e => setEmiRate(e.target.value)} className="premium-input" step="0.1" />
                      </div>
                      <div className="space-y-2">
                        <Label>Tenure (Months)</Label>
                        <Input type="number" placeholder="e.g. 240" value={emiTenure} onChange={e => setEmiTenure(e.target.value)} className="premium-input" />
                      </div>
                    </div>
                    <Button onClick={() => setEmiResult(calculateEMI(parseFloat(emiPrincipal), parseFloat(emiRate), parseInt(emiTenure)))} className="w-full h-12 rounded-xl gap-2 text-sm font-medium">
                      <Calculator className="w-4 h-4" />Calculate EMI
                    </Button>
                  </CardContent>
                </Card>

                {emiResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easing }}>
                    <Card className="border-2 border-emerald-500">
                      <CardContent className="pt-6 space-y-3">
                        <div className="text-center mb-6">
                          <p className="text-sm text-muted-foreground mb-1">Your Monthly EMI</p>
                          <p className="text-5xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{fmt(emiResult.emi)}</p>
                        </div>
                        <Separator />
                        <ResultRow label="Principal Amount" value={fmt(emiResult.principal)} />
                        <ResultRow label="Total Interest" value={fmt(emiResult.totalInterest)} />
                        <Separator />
                        <ResultRow label="Total Payment" value={fmt(emiResult.totalPayment)} bold />
                        {/* Visual breakdown */}
                        <div className="mt-4 h-4 rounded-full overflow-hidden flex">
                          <div className="bg-blue-500 h-full" style={{ width: `${(emiResult.principal / emiResult.totalPayment) * 100}%` }} />
                          <div className="bg-amber-500 h-full flex-1" />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500" />Principal ({Math.round((emiResult.principal / emiResult.totalPayment) * 100)}%)</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" />Interest ({Math.round((emiResult.totalInterest / emiResult.totalPayment) * 100)}%)</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>

              {/* SIP Calculator */}
              <TabsContent value="sip" className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>SIP Calculator</CardTitle>
                    <CardDescription>Estimate returns on your Systematic Investment Plan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Monthly Investment (₹)</Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="number" placeholder="e.g. 10,000" value={sipAmount} onChange={e => setSipAmount(e.target.value)} className="premium-input pl-9" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Expected Return (% p.a.)</Label>
                        <Input type="number" placeholder="e.g. 12" value={sipReturn} onChange={e => setSipReturn(e.target.value)} className="premium-input" step="0.5" />
                      </div>
                      <div className="space-y-2">
                        <Label>Time Period (Years)</Label>
                        <Input type="number" placeholder="e.g. 10" value={sipYears} onChange={e => setSipYears(e.target.value)} className="premium-input" />
                      </div>
                    </div>
                    <Button onClick={() => setSipResult(calculateSIP(parseFloat(sipAmount), parseFloat(sipReturn), parseInt(sipYears)))} className="w-full h-12 rounded-xl gap-2 text-sm font-medium">
                      <Calculator className="w-4 h-4" />Calculate Returns
                    </Button>
                  </CardContent>
                </Card>

                {sipResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easing }}>
                    <Card className="border-2 border-emerald-500">
                      <CardContent className="pt-6 space-y-3">
                        <div className="text-center mb-6">
                          <p className="text-sm text-muted-foreground mb-1">Total Future Value</p>
                          <p className="text-5xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{fmt(sipResult.futureValue)}</p>
                        </div>
                        <Separator />
                        <ResultRow label="Amount Invested" value={fmt(sipResult.invested)} />
                        <ResultRow label="Wealth Gained" value={fmt(sipResult.gains)} highlight />
                        <Separator />
                        <ResultRow label="Total Value" value={fmt(sipResult.futureValue)} bold />
                        <div className="mt-4 h-4 rounded-full overflow-hidden flex">
                          <div className="bg-blue-500 h-full" style={{ width: `${(sipResult.invested / sipResult.futureValue) * 100}%` }} />
                          <div className="bg-emerald-500 h-full flex-1" />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500" />Invested ({Math.round((sipResult.invested / sipResult.futureValue) * 100)}%)</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" />Returns ({Math.round((sipResult.gains / sipResult.futureValue) * 100)}%)</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>

              {/* HRA Calculator */}
              <TabsContent value="hra" className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>HRA Exemption Calculator</CardTitle>
                    <CardDescription>Calculate how much of your HRA is tax-exempt under Section 10(13A)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Basic Salary (Annual)</Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="number" placeholder="e.g. 6,00,000" value={hraBasic} onChange={e => setHraBasic(e.target.value)} className="premium-input pl-9" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>HRA Received (Annual)</Label>
                        <Input type="number" placeholder="e.g. 2,40,000" value={hraAmount} onChange={e => setHraAmount(e.target.value)} className="premium-input" />
                      </div>
                      <div className="space-y-2">
                        <Label>Rent Paid (Annual)</Label>
                        <Input type="number" placeholder="e.g. 1,80,000" value={hraRent} onChange={e => setHraRent(e.target.value)} className="premium-input" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="text-sm">City Type:</Label>
                      <div className="flex gap-2">
                        <Button variant={hraMetro ? "default" : "outline"} size="sm" onClick={() => setHraMetro(true)} className="rounded-xl">Metro (50%)</Button>
                        <Button variant={!hraMetro ? "default" : "outline"} size="sm" onClick={() => setHraMetro(false)} className="rounded-xl">Non-Metro (40%)</Button>
                      </div>
                    </div>
                    <Button onClick={() => setHraResult(calculateHRA(parseFloat(hraBasic), parseFloat(hraAmount), parseFloat(hraRent), hraMetro))} className="w-full h-12 rounded-xl gap-2 text-sm font-medium">
                      <Calculator className="w-4 h-4" />Calculate HRA Exemption
                    </Button>
                  </CardContent>
                </Card>

                {hraResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easing }}>
                    <Card className="border-2 border-emerald-500">
                      <CardContent className="pt-6 space-y-3">
                        <div className="text-center mb-6">
                          <p className="text-sm text-muted-foreground mb-1">HRA Exemption Amount</p>
                          <p className="text-5xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{fmt(hraResult.exempt)}</p>
                        </div>
                        <Separator />
                        <ResultRow label="Actual HRA Received" value={fmt(hraResult.actualHRA)} />
                        <ResultRow label={`${hraMetro ? "50" : "40"}% of Basic Salary`} value={fmt(hraResult.percentOfBasic)} />
                        <ResultRow label="Rent Paid − 10% of Basic" value={fmt(hraResult.rentMinusBasic)} />
                        <Separator />
                        <ResultRow label="Exempt (Minimum of above)" value={fmt(hraResult.exempt)} highlight />
                        <ResultRow label="Taxable HRA" value={fmt(hraResult.taxable)} bold />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>

            {/* CTA */}
            <ScrollReveal>
              <div className="mt-16 text-center">
                <p className="text-muted-foreground mb-4">Need personalized financial planning?</p>
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <Link to="/appointments">Book a Consultation <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
