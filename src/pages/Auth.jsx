import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, Briefcase, Shield, Loader2, ArrowRight, Eye, EyeOff, Check, X as XIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" });
const nameSchema = z.string().trim().min(1, { message: "Name is required" }).max(100);



const easing = [0.22, 1, 0.36, 1];

// Password strength calculator
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", checks: {} };
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = ["", "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];
  return { score, label: labels[score], color: colors[score], checks };
}

function PasswordStrengthMeter({ password }) {
  const { score, label, color, checks } = getPasswordStrength(password);
  if (!password) return null;

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= score ? color : "bg-secondary"}`} />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${score <= 2 ? "text-red-500" : score <= 3 ? "text-amber-500" : "text-emerald-500"}`}>{label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {Object.entries({ length: "8+ chars", uppercase: "Uppercase", lowercase: "Lowercase", number: "Number", special: "Special char" }).map(([key, label]) => (
          <span key={key} className={`text-[10px] flex items-center gap-1 ${checks[key] ? "text-emerald-500" : "text-muted-foreground"}`}>
            {checks[key] ? <Check className="w-2.5 h-2.5" /> : <XIcon className="w-2.5 h-2.5" />} {label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite_token");
  const { user, role, loading: authLoading, signIn, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get("signup") || inviteToken ? "signup" : "login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "", role: "client" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (user && !authLoading) {
      if (role === "admin" || role === "ca") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, role, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      emailSchema.parse(loginData.email);
      passwordSchema.parse(loginData.password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        setIsSubmitting(false);
        return;
      }
    }

    const { error } = await signIn(loginData.email, loginData.password);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Welcome back!");
      // Role-based redirect is handled by the useEffect above
    }

    setIsSubmitting(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) { toast.error("Please enter your email"); return; }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
    } catch (err) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setSendingReset(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      nameSchema.parse(signupData.name);
      emailSchema.parse(signupData.email);
      passwordSchema.parse(signupData.password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        setIsSubmitting(false);
        return;
      }
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    const { error } = await signUp(
      signupData.email,
      signupData.password,
      signupData.name,
      inviteToken
    );

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Account created successfully!");
      navigate("/dashboard");
    }

    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full" />
        
      </div>);

  }

  // Staggered form field animation
  const fieldVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.06 + 0.15, duration: 0.4, ease: easing }
    })
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4 relative overflow-hidden">
      {/* ── Ambient background ────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-accent/[0.06] blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.04] blur-[60px] pointer-events-none" />
      <div className="absolute top-[20%] left-[-5%] w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[50px] pointer-events-none" />
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-30" />

      {/* ── Card ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: easing }}
        className="w-full max-w-md relative z-10">
        
        <Card className="glass-frosted shadow-hero border-border/40">
          <CardHeader className="text-center space-y-2 pb-6">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
              className="w-14 h-14 mx-auto rounded-2xl bg-foreground text-background flex items-center justify-center text-xl font-bold mb-2 shadow-lg">
              
              G
            </motion.div>
            <CardTitle className="text-3xl font-semibold tracking-tight">Welcome</CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Sign in to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/80 rounded-xl h-11">
                <TabsTrigger value="login" className="data-[state=active]:bg-background rounded-lg text-sm font-medium">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-background rounded-lg text-sm font-medium">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-6">
                  {/* Role info note */}
                  <div className="text-center py-2 px-4 rounded-lg bg-secondary/40 border border-border/30">
                    <p className="text-xs text-muted-foreground">
                      Your dashboard is determined by your account role (Client, CA, or Admin).
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <motion.div className="space-y-2" custom={0} variants={fieldVariants} initial="hidden" animate="visible">
                      <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                      <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="premium-input"
                      required
                      disabled={isSubmitting} />
                    
                    </motion.div>

                    <motion.div className="space-y-2" custom={1} variants={fieldVariants} initial="hidden" animate="visible">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="Enter your password"
                      className="premium-input"
                      required
                      disabled={isSubmitting} />
                    
                    </motion.div>

                    {/* Forgot Password Link */}
                    <motion.div custom={1.5} variants={fieldVariants} initial="hidden" animate="visible" className="text-right">
                      <button type="button" onClick={() => setShowForgotPassword(!showForgotPassword)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Forgot password?
                      </button>
                    </motion.div>

                    {showForgotPassword && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl border border-border/50 bg-secondary/20 space-y-2">
                        <p className="text-xs text-muted-foreground">Enter your email and we'll send a reset link.</p>
                        <div className="flex gap-2">
                          <Input type="email" placeholder="your@email.com" value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)} className="premium-input text-sm h-9" />
                          <Button type="button" size="sm" onClick={handleForgotPassword} disabled={sendingReset} className="rounded-lg h-9 px-4 text-xs">
                            {sendingReset ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
                      <Button
                      type="submit"
                      className="w-full h-12 text-sm font-medium rounded-xl gap-2 hover-lift"
                      size="lg"
                      disabled={isSubmitting}>
                      
                        {isSubmitting ?
                      <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Signing in...
                          </> :

                      <>
                            Sign In
                            <ArrowRight className="h-4 w-4" />
                          </>
                      }
                      </Button>
                    </motion.div>
                  </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6">
                  <form onSubmit={handleSignup} className="space-y-4">
                    
                    {inviteToken && (
                      <motion.div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary font-medium flex items-center gap-2" custom={0} variants={fieldVariants} initial="hidden" animate="visible">
                        <Shield className="h-4 w-4" />
                        Secure Staff Invitation Detected
                      </motion.div>
                    )}

                    <motion.div className="space-y-2" custom={0.5} variants={fieldVariants} initial="hidden" animate="visible">
                      <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                      <Input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      placeholder="John Doe"
                      className="premium-input"
                      required
                      disabled={isSubmitting} />
                    
                    </motion.div>

                    <motion.div className="space-y-2" custom={1} variants={fieldVariants} initial="hidden" animate="visible">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                      <Input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="premium-input"
                      required
                      disabled={isSubmitting} />
                    
                    </motion.div>

                    <motion.div className="space-y-2" custom={2} variants={fieldVariants} initial="hidden" animate="visible">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                      <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      placeholder="At least 6 characters"
                      className="premium-input"
                      required
                      disabled={isSubmitting} />
                    
                    </motion.div>
                    <PasswordStrengthMeter password={signupData.password} />

                    <motion.div className="space-y-2" custom={3} variants={fieldVariants} initial="hidden" animate="visible">
                      <Label htmlFor="signup-confirm" className="text-sm font-medium">Confirm Password</Label>
                      <Input
                      id="signup-confirm"
                      type="password"
                      autoComplete="new-password"
                      value={signupData.confirmPassword}
                      onChange={(e) =>
                      setSignupData({ ...signupData, confirmPassword: e.target.value })
                      }
                      placeholder="Re-enter your password"
                      className="premium-input"
                      required
                      disabled={isSubmitting} />
                    
                    </motion.div>

                    <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
                      <Button
                      type="submit"
                      className="w-full h-12 text-sm font-medium rounded-xl gap-2 hover-lift"
                      size="lg"
                      disabled={isSubmitting}>
                      
                        {isSubmitting ?
                      <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating account...
                          </> :

                      <>
                            Create Account
                            <ArrowRight className="h-4 w-4" />
                          </>
                      }
                      </Button>
                    </motion.div>
                  </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>);

}