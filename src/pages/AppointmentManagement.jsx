import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { CalendarDays, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import AdminAppointmentsPanel from "@/components/admin/AdminAppointmentsPanel";

const easing = [0.22, 1, 0.36, 1];

export default function AppointmentManagement() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!authLoading && user && role !== "admin" && role !== "ca") {
      toast.error("Access denied"); navigate("/dashboard");
    }
  }, [user, role, authLoading, navigate]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-foreground text-background py-10">
          <div className="container mx-auto px-6">
            <Button variant="ghost" onClick={() => navigate("/admin")}
              className="text-background/80 hover:text-background hover:bg-background/10 mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing }}>
              <div className="flex items-center gap-3 mb-2">
                <CalendarDays className="h-6 w-6" />
                <h1 className="text-3xl font-semibold tracking-tight">Appointment Management</h1>
              </div>
              <p className="text-background/70">Manage, confirm, and track all client consultation bookings.</p>
            </motion.div>
          </div>
        </div>

        {/* Admin Panel */}
        <div className="container mx-auto px-6 py-8">
          <AdminAppointmentsPanel />
        </div>
      </div>
    </PageTransition>
  );
}
