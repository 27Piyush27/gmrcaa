import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, IndianRupee, TrendingUp, ArrowRight, CheckCircle, Info, ExternalLink, Landmark } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

// Tax slabs for FY 2025-26
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

const NEW_REGIME_SLABS = [
  { min: 0, max: 400000, rate: 0 },
  { min: 400000, max: 800000, rate: 5 },
  { min: 800000, max: 1200000, rate: 10 },
  { min: 1200000, max: 1600000, rate: 15 },
  { min: 1600000, max: 2000000, rate: 20 },
  { min: 2000000, max: 2400000, rate: 25 },
  { min: 2400000, max: Infinity, rate: 30 },
];

function calculateTax(income, slabs) {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.min) break;
    const taxable = Math.min(income, slab.max) - slab.min;
    tax += taxable * (slab.rate / 100);
  }
  return Math.round(tax);
}

function calculateGST(amount, rate) {
  const gst = amount * (rate / 100);
  return { cgst: gst / 2, sgst: gst / 2, igst: gst, total: amount + gst };
}

export default function TaxCalculator() {
  const [activeTab, setActiveTab] = useState("income-tax");
  
  // Income Tax
  const [income, setIncome] = useState("");
  const [deductions80C, setDeductions80C] = useState("");
  const [deductions80D, setDeductions80D] = useState("");
  const [hra, setHra] = useState("");
  const [result, setResult] = useState(null);

  // GST
  const [gstAmount, setGstAmount] = useState("");
  const [gstRate, setGstRate] = useState("18");
  const [gstResult, setGstResult] = useState(null);

  const handleIncomeTaxCalc = () => {
    const totalIncome = parseFloat(income) || 0;
    const total80C = Math.min(parseFloat(deductions80C) || 0, 150000);
    const total80D = Math.min(parseFloat(deductions80D) || 0, 75000);
    const totalHRA = parseFloat(hra) || 0;

    const oldTaxableIncome = Math.max(0, totalIncome - total80C - total80D - totalHRA);
    const newTaxableIncome = totalIncome;

    const oldTax = calculateTax(oldTaxableIncome, OLD_REGIME_SLABS);
    const newTax = calculateTax(newTaxableIncome, NEW_REGIME_SLABS);

    // Rebate u/s 87A
    const oldTaxAfterRebate = oldTaxableIncome <= 500000 ? 0 : oldTax;
    const newTaxAfterRebate = newTaxableIncome <= 1200000 ? 0 : newTax;

    // Health & Education Cess 4%
    const oldFinalTax = Math.round(oldTaxAfterRebate * 1.04);
    const newFinalTax = Math.round(newTaxAfterRebate * 1.04);

    setResult({
      oldRegime: { taxableIncome: oldTaxableIncome, tax: oldTax, rebate: oldTaxAfterRebate, cess: oldFinalTax - oldTaxAfterRebate, total: oldFinalTax },
      newRegime: { taxableIncome: newTaxableIncome, tax: newTax, rebate: newTaxAfterRebate, cess: newFinalTax - newTaxAfterRebate, total: newFinalTax },
      savings: Math.abs(oldFinalTax - newFinalTax),
      recommended: newFinalTax <= oldFinalTax ? "new" : "old"
    });
  };

  const handleGSTCalc = () => {
    const amount = parseFloat(gstAmount) || 0;
    const rate = parseFloat(gstRate) || 18;
    setGstResult(calculateGST(amount, rate));
  };

  const formatCurrency = (n) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-emerald-400/[0.06] blur-3xl pointer-events-none animate-breathe" />
          <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Calculator className="w-3.5 h-3.5" /> Tax Tools
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easing, delay: 0.12 }}>
              Tax <span className="italic gradient-text-premium">Calculator</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.28 }}>
              Estimate your income tax under both regimes and calculate GST instantly.
            </motion.p>
          </div>
        </section>

        {/* Calculator */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/80 rounded-xl h-11">
                <TabsTrigger value="income-tax" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <IndianRupee className="w-4 h-4" />Income Tax
                </TabsTrigger>
                <TabsTrigger value="gst" className="data-[state=active]:bg-background rounded-lg text-sm font-medium gap-2">
                  <Calculator className="w-4 h-4" />GST Calculator
                </TabsTrigger>
              </TabsList>

              <TabsContent value="income-tax" className="space-y-6">
                {/* Government Calculator Callout */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                      <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Official Government Calculator</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Also try the Income Tax Department's official calculator for verified results.</p>
                    </div>
                  </div>
                  <a
                    href="https://incometaxindia.gov.in/pages/tools/tax-calculator.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Govt Calculator
                  </a>
                </div>
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Income Tax Calculator (FY 2025-26)</CardTitle>
                    <CardDescription>Compare tax under Old vs New regime</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Annual Income (Gross)</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="number" placeholder="Enter your annual income" value={income}
                          onChange={e => setIncome(e.target.value)} className="premium-input pl-9" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>80C Deductions</Label>
                        <Input type="number" placeholder="Max ₹1,50,000" value={deductions80C}
                          onChange={e => setDeductions80C(e.target.value)} className="premium-input" />
                        <p className="text-xs text-muted-foreground">PF, ELSS, LIC, PPF etc.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>80D (Medical)</Label>
                        <Input type="number" placeholder="Max ₹75,000" value={deductions80D}
                          onChange={e => setDeductions80D(e.target.value)} className="premium-input" />
                        <p className="text-xs text-muted-foreground">Health insurance premium</p>
                      </div>
                      <div className="space-y-2">
                        <Label>HRA Exemption</Label>
                        <Input type="number" placeholder="HRA amount" value={hra}
                          onChange={e => setHra(e.target.value)} className="premium-input" />
                        <p className="text-xs text-muted-foreground">House rent allowance</p>
                      </div>
                    </div>
                    <Button onClick={handleIncomeTaxCalc} className="w-full h-12 rounded-xl gap-2 text-sm font-medium">
                      <Calculator className="w-4 h-4" />Calculate Tax
                    </Button>
                  </CardContent>
                </Card>

                {result && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: easing }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Old Regime */}
                    <Card className={`border-2 ${result.recommended === "old" ? "border-emerald-500" : "border-border/50"}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Old Regime</CardTitle>
                          {result.recommended === "old" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />Recommended
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Taxable Income</span><span className="font-medium">{formatCurrency(result.oldRegime.taxableIncome)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Base Tax</span><span className="font-medium">{formatCurrency(result.oldRegime.tax)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">After 87A Rebate</span><span className="font-medium">{formatCurrency(result.oldRegime.rebate)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cess (4%)</span><span className="font-medium">{formatCurrency(result.oldRegime.cess)}</span></div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold"><span>Total Tax</span><span className="text-foreground">{formatCurrency(result.oldRegime.total)}</span></div>
                      </CardContent>
                    </Card>
                    {/* New Regime */}
                    <Card className={`border-2 ${result.recommended === "new" ? "border-emerald-500" : "border-border/50"}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">New Regime</CardTitle>
                          {result.recommended === "new" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />Recommended
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Taxable Income</span><span className="font-medium">{formatCurrency(result.newRegime.taxableIncome)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Base Tax</span><span className="font-medium">{formatCurrency(result.newRegime.tax)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">After 87A Rebate</span><span className="font-medium">{formatCurrency(result.newRegime.rebate)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cess (4%)</span><span className="font-medium">{formatCurrency(result.newRegime.cess)}</span></div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold"><span>Total Tax</span><span className="text-foreground">{formatCurrency(result.newRegime.total)}</span></div>
                      </CardContent>
                    </Card>
                    {/* Savings Banner */}
                    <div className="md:col-span-2">
                      <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
                        <CardContent className="py-6 text-center">
                          <p className="text-emerald-700 dark:text-emerald-400 font-semibold text-lg">
                            You save {formatCurrency(result.savings)} with the {result.recommended === "new" ? "New" : "Old"} Regime!
                          </p>
                          <p className="text-emerald-600/70 dark:text-emerald-500/70 text-sm mt-1">
                            Need expert help filing your ITR?{" "}
                            <Link to="/services" className="underline font-medium">Explore our services</Link>
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="gst" className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>GST Calculator</CardTitle>
                    <CardDescription>Calculate CGST, SGST, and total amount with GST</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Amount (Excluding GST)</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="number" placeholder="Enter amount" value={gstAmount}
                          onChange={e => setGstAmount(e.target.value)} className="premium-input pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>GST Rate (%)</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {["5", "12", "18", "28"].map(rate => (
                          <Button key={rate} variant={gstRate === rate ? "default" : "outline"}
                            onClick={() => setGstRate(rate)} className="rounded-xl">
                            {rate}%
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleGSTCalc} className="w-full h-12 rounded-xl gap-2 text-sm font-medium">
                      <Calculator className="w-4 h-4" />Calculate GST
                    </Button>
                  </CardContent>
                </Card>

                {gstResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: easing }}>
                    <Card className="border-border/50">
                      <CardContent className="py-6 space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Base Amount</span><span className="font-medium">{formatCurrency(parseFloat(gstAmount))}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">CGST ({parseFloat(gstRate) / 2}%)</span><span className="font-medium">{formatCurrency(Math.round(gstResult.cgst))}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">SGST ({parseFloat(gstRate) / 2}%)</span><span className="font-medium">{formatCurrency(Math.round(gstResult.sgst))}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">IGST ({gstRate}%)</span><span className="font-medium">{formatCurrency(Math.round(gstResult.igst))}</span></div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold"><span>Total (with GST)</span><span>{formatCurrency(Math.round(gstResult.total))}</span></div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>

            {/* CTA */}
            <ScrollReveal>
              <div className="mt-16 text-center">
                <p className="text-muted-foreground mb-4">Need expert help with your taxes?</p>
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <Link to="/services">Explore Our Services <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
