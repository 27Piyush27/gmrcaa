import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Gift, Users, Copy, Share2, ArrowRight, CheckCircle, Trophy,
  Star, IndianRupee, Heart, Link2
} from "lucide-react";
import { Link } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

const REWARD_TIERS = [
  { referrals: 1, reward: "₹500 Credit", icon: "🎁", unlocked: true },
  { referrals: 3, reward: "10% Off Next Service", icon: "🏷️", unlocked: true },
  { referrals: 5, reward: "Free Tax Review", icon: "📋", unlocked: false },
  { referrals: 10, reward: "Priority Support", icon: "⚡", unlocked: false },
  { referrals: 15, reward: "Free ITR Filing", icon: "🎯", unlocked: false },
];

const REFERRAL_HISTORY = [
  { name: "Rajesh K.", email: "raj***@gmail.com", status: "active", reward: "₹500", date: "15 Dec 2025" },
  { name: "Sneha M.", email: "sne***@gmail.com", status: "active", reward: "₹500", date: "22 Dec 2025" },
  { name: "Vikram P.", email: "vik***@gmail.com", status: "pending", reward: "Pending", date: "2 Jan 2026" },
];

export default function Referrals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const referralCode = user ? `GMR-${user.id?.slice(0, 6).toUpperCase() || "DEMO01"}` : "GMR-DEMO01";
  const referralLink = `https://chartered-insight-hub-32-3d4b2fdf-m.vercel.app/auth?ref=${referralCode}`;
  const totalReferrals = 2;
  const totalEarnings = 1000;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it with friends and family." });
    setTimeout(() => setCopied(false), 2000);
  };

  const sendInvite = () => {
    if (!email) return;
    toast({ title: "Invitation sent!", description: `An invite was sent to ${email}` });
    setEmail("");
  };

  const stats = [
    { icon: Users, label: "Total Referrals", value: totalReferrals, color: "from-blue-500 to-cyan-600", lightBg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
    { icon: IndianRupee, label: "Credits Earned", value: `₹${totalEarnings}`, color: "from-emerald-500 to-green-600", lightBg: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { icon: Trophy, label: "Current Tier", value: "Silver", color: "from-amber-500 to-orange-600", lightBg: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400" },
    { icon: Heart, label: "Active Referrals", value: REFERRAL_HISTORY.filter(r => r.status === "active").length, color: "from-pink-500 to-rose-600", lightBg: "bg-pink-50 dark:bg-pink-950/30", iconColor: "text-pink-600 dark:text-pink-400" },
  ];

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="border-border/50 text-center max-w-md mx-auto p-10">
            <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">Sign in to Access Referrals</h2>
            <p className="text-sm text-muted-foreground mb-6">Invite friends and earn rewards!</p>
            <Button asChild className="rounded-xl gap-2">
              <Link to="/auth">Sign In <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-28 pb-10 md:pt-40 md:pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-pink-400/[0.06] blur-3xl pointer-events-none animate-breathe" />
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-sm text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Gift className="w-3.5 h-3.5" /> Rewards
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              Refer & <span className="italic gradient-text-premium">Earn</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              Invite friends to GMR & Associates. Earn credits and exclusive rewards for every successful referral.
            </motion.p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-6">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div key={stat.label}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="relative group rounded-2xl border border-border/60 bg-card overflow-hidden shadow-soft hover:shadow-md hover:-translate-y-1 transition-all duration-500">
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color}`} />
                  <div className="p-5">
                    <div className={`w-10 h-10 rounded-xl ${stat.lightBg} flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Share Section */}
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-6 lg:px-12 space-y-6">
            {/* Referral Link */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Link2 className="w-5 h-5 text-violet-500" />Your Referral Link</CardTitle>
                <CardDescription>Share this link — when someone signs up and uses a service, you both earn rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input value={referralLink} readOnly className="premium-input font-mono text-xs" />
                  <Button onClick={copyLink} variant="outline" className="rounded-xl gap-2 flex-shrink-0 px-5">
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs text-muted-foreground">Your code:</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary">{referralCode}</span>
                </div>
              </CardContent>
            </Card>

            {/* Email Invite */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Share2 className="w-5 h-5 text-blue-500" />Invite by Email</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input type="email" placeholder="friend@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} className="premium-input" />
                  <Button onClick={sendInvite} className="rounded-xl gap-2 flex-shrink-0">
                    <Share2 className="w-4 h-4" />Send Invite
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reward Tiers */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" />Reward Milestones</CardTitle>
                <CardDescription>Unlock rewards as you refer more people</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-0">
                  {REWARD_TIERS.map((tier, i) => (
                    <div key={i} className="flex-1 relative">
                      {i < REWARD_TIERS.length - 1 && (
                        <div className={`absolute top-5 left-1/2 right-0 h-0.5 ${
                          tier.unlocked ? "bg-emerald-500" : "bg-border"
                        } translate-x-1/2 z-0`} />
                      )}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                            tier.unlocked
                              ? "bg-emerald-100 dark:bg-emerald-950/40 border-2 border-emerald-500"
                              : "bg-secondary border-2 border-border"
                          }`}>
                          {tier.icon}
                        </motion.div>
                        <p className="text-[11px] font-semibold mt-2">{tier.referrals} referral{tier.referrals > 1 ? "s" : ""}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{tier.reward}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* History */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" />Referral History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {REFERRAL_HISTORY.map((ref, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-xs font-bold">
                        {ref.name.split(" ").map(w => w[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ref.name}</p>
                        <p className="text-xs text-muted-foreground">{ref.email} · {ref.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{ref.reward}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ref.status === "active" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" :
                        "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                      }`}>{ref.status === "active" ? "Active" : "Pending"}</span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
