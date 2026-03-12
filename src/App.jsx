import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import { Navigation } from "./components/Navigation";
import { AIChatbot } from "./components/AIChatbot";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import ServiceCheckout from "./pages/ServiceCheckout";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Payments from "./pages/Payments";
import PaymentSuccess from "./pages/PaymentSuccess";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1
    }
  }
});

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:serviceId" element={<ServiceDetail />} />
        <Route path="/checkout/:serviceId" element={<ServiceCheckout />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/auth" element={<Auth />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>);

};

const App = () =>
<QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          {/* Fixed nav sits above content; pt-16 compensates for its 64px height */}
          <Navigation />
          <div className="pt-16 min-h-screen flex flex-col">
            <main className="flex-1">
              <AnimatedRoutes />
            </main>
            <Footer />
          </div>
          <AIChatbot />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;


export default App;