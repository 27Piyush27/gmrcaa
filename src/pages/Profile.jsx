import { useState, useEffect, useRef } from "react";
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
  Building2, FileText, ArrowLeft, Camera, CheckCircle, X, ImagePlus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";

const easing = [0.22, 1, 0.36, 1];

// Helper: compress image client-side before upload
function compressImage(file, maxSize = 512) {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h = (h * maxSize) / w; w = maxSize; } }
        else { if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; } }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, role, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
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
      if (profile.avatar_url) setAvatarPreview(profile.avatar_url);
    }
  }, [user, profile, authLoading, navigate]);

  // ── Avatar upload ──────────────────────────────────────────────────
  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      // Compress image
      const compressed = await compressImage(file, 512);
      const fileName = `${user.id}-${Date.now()}.jpg`;

      // Try uploading to Supabase Storage
      let publicUrl = null;
      try {
        // Delete old avatar if exists
        if (formData.avatar_url && formData.avatar_url.includes("avatars/")) {
          const oldPath = formData.avatar_url.split("avatars/").pop();
          if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, compressed, {
            cacheControl: "3600",
            upsert: true,
            contentType: "image/jpeg"
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(uploadData.path);

        publicUrl = urlData.publicUrl;
      } catch (storageErr) {
        console.warn("Storage upload failed, using base64 fallback:", storageErr);
        // Fallback: convert to base64 data URI
        publicUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(compressed);
        });
      }

      // Save to profile
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateErr) throw updateErr;

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      setAvatarPreview(publicUrl);
      toast.success("Profile picture updated!");
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAvatar = async () => {
    try {
      // Delete from storage if applicable
      if (formData.avatar_url && formData.avatar_url.includes("avatars/")) {
        const oldPath = formData.avatar_url.split("avatars/").pop();
        if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
      }

      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("user_id", user.id);

      setFormData(prev => ({ ...prev, avatar_url: "" }));
      setAvatarPreview(null);
      toast.success("Profile picture removed");
    } catch (err) {
      console.error("Remove avatar error:", err);
      toast.error("Failed to remove profile picture");
    }
  };

  // ── Save profile ──────────────────────────────────────────────────
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
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarSelect}
        />

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
              <div className="relative group">
                {/* Avatar */}
                <div
                  className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-bold overflow-hidden cursor-pointer transition-all duration-300 group-hover:border-white/40"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl">
                    {uploadingAvatar ? (
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>
                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
                {/* Remove button */}
                {avatarPreview && (
                  <button
                    onClick={removeAvatar}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{formData.name || "Your Profile"}</h1>
                <p className="text-background/60 mt-1 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {role === "admin" ? "Administrator" : role === "ca" ? "Chartered Accountant" : "Client"}
                </p>
                {avatarPreview ? (
                  <p className="text-[10px] text-background/40 mt-0.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" /> Photo uploaded
                  </p>
                ) : (
                  <p className="text-[10px] text-background/40 mt-0.5 flex items-center gap-1">
                    <ImagePlus className="w-3 h-3" /> Click avatar to upload photo
                  </p>
                )}
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
