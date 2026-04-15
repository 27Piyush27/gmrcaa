import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User, Mail, Phone, MapPin, Shield, Save, Loader2,
  Building2, FileText, ArrowLeft, Camera, CheckCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";

const easing = [0.22, 1, 0.36, 1];

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, role, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    pan_number: "",
    gstin: "",
    company_name: "",
    avatar_url: ""
  });

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        pan_number: profile.pan_number || "",
        gstin: profile.gstin || "",
        company_name: profile.company_name || "",
        avatar_url: profile.avatar_url || ""
      });
    }
  }, [user, profile, authLoading, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          pan_number: formData.pan_number,
          gstin: formData.gstin,
          company_name: formData.company_name,
          avatar_url: formData.avatar_url
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  const initials = (formData.name || user.email || "U")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="relative overflow-hidden bg-foreground text-background">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 lg:px-12 py-14">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}
              className="text-background/80 hover:text-background hover:bg-background/10 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
            </Button>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing }} className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-bold">
                  {initials}
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{formData.name || "Your Profile"}</h1>
                <p className="text-background/60 mt-1 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {role === "admin" ? "Administrator" : role === "ca" ? "Chartered Accountant" : "Client"}
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: easing }} className="space-y-8">

            {/* Personal Info */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={formData.name} onChange={e => handleChange("name", e.target.value)}
                      placeholder="Your full name" className="premium-input" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={formData.email} disabled className="premium-input opacity-60" />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />Verified
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone"><Phone className="w-3.5 h-3.5 inline mr-1" />Phone</Label>
                    <Input id="phone" value={formData.phone} onChange={e => handleChange("phone", e.target.value)}
                      placeholder="+91 XXXXX XXXXX" className="premium-input" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address"><MapPin className="w-3.5 h-3.5 inline mr-1" />Address</Label>
                    <Input id="address" value={formData.address} onChange={e => handleChange("address", e.target.value)}
                      placeholder="Your address" className="premium-input" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Info */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />Business Details</CardTitle>
                <CardDescription>Tax and business identification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pan"><FileText className="w-3.5 h-3.5 inline mr-1" />PAN Number</Label>
                    <Input id="pan" value={formData.pan_number} onChange={e => handleChange("pan_number", e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F" maxLength={10} className="premium-input uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input id="gstin" value={formData.gstin} onChange={e => handleChange("gstin", e.target.value.toUpperCase())}
                      placeholder="22AAAAA0000A1Z5" maxLength={15} className="premium-input uppercase" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company"><Building2 className="w-3.5 h-3.5 inline mr-1" />Company Name</Label>
                  <Input id="company" value={formData.company_name} onChange={e => handleChange("company_name", e.target.value)}
                    placeholder="Your company name" className="premium-input" />
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Save */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl px-8">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
