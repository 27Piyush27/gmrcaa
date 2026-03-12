import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, Briefcase, Shield, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const roles = [
{ value: "client", label: "Client", icon: User, description: "Access your financial documents and services" },
{ value: "ca", label: "Chartered Accountant", icon: Briefcase, description: "Manage clients and provide services" },
{ value: "admin", label: "Admin", icon: Shield, description: "Full system administration access" }];


const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" });
const nameSchema = z.string().trim().min(1, { message: "Name is required" }).max(100);



const easing = [0.22, 1, 0.36, 1];

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get("signup") ? "signup" : "login");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "", role: "client" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "client"
  });

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

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
      navigate("/dashboard");
    }

    setIsSubmitting(false);
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

    // Admin signup requires special code
    if (signupData.role === "admin") {
      toast.error("Admin accounts can only be created by existing admins");
      setIsSubmitting(false);
      return;
    }

    const { error } = await signUp(
      signupData.email,
      signupData.password,
      signupData.name,
      signupData.role
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
                  {/* Role Selection */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {roles.map((role) => {
                    const Icon = role.icon;
                    const isActive = loginData.role === role.value;
                    return (
                      <motion.button
                        key={role.value}
                        type="button"
                        onClick={() => setLoginData({ ...loginData, role: role.value })}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                        isActive ?
                        "border-foreground bg-foreground/5 shadow-sm" :
                        "border-border/60 hover:border-foreground/30"}`
                        }>
                        
                          <Icon className={`w-5 h-5 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                          <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                            {role.value === "ca" ? "CA" : role.label}
                          </span>
                        </motion.button>);

                  })}
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
                            Sign In as {roles.find((r) => r.value === loginData.role)?.label}
                            <ArrowRight className="h-4 w-4" />
                          </>
                      }
                      </Button>
                    </motion.div>
                  </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6">
                  {/* Role Selection for Signup */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {roles.filter((r) => r.value !== "admin").map((role) => {
                    const Icon = role.icon;
                    const isActive = signupData.role === role.value;
                    return (
                      <motion.button
                        key={role.value}
                        type="button"
                        onClick={() => setSignupData({ ...signupData, role: role.value })}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                        isActive ?
                        "border-foreground bg-foreground/5 shadow-sm" :
                        "border-border/60 hover:border-foreground/30"}`
                        }>
                        
                          <Icon className={`w-5 h-5 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                          <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                            {role.value === "ca" ? "Chartered Accountant" : role.label}
                          </span>
                        </motion.button>);

                  })}
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <motion.div className="space-y-2" custom={0} variants={fieldVariants} initial="hidden" animate="visible">
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
                            Create {signupData.role === "ca" ? "CA" : "Client"} Account
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