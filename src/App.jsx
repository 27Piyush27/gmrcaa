import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { CookieConsent } from "./components/CookieConsent";
import { AnnouncementBanner } from "./components/AnnouncementBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import PageLoader from "./components/PageLoader";
import { ScrollProgressBar, BackToTop } from "./components/InteractiveEffects";

// ── Prefetch critical routes after initial idle ────────────────────────────
// Downloads the JS chunks for top-visited pages so navigation feels instant.
function usePrefetchRoutes() {
  useEffect(() => {
    const prefetch = () => {
      import("./pages/About");
      import("./pages/Services");
      import("./pages/Contact");
      import("./pages/Auth");
    };
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(prefetch, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(prefetch, 3000);
      return () => clearTimeout(id);
    }
  }, []);
}

// ── Scroll to top on route change ─────────────────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// ── Lazy-loaded pages ──────────────────────────────────────────────────
// Only the visited page's code is downloaded — saves ~70% initial JS.
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const ServiceCheckout = lazy(() => import("./pages/ServiceCheckout"));
const Contact = lazy(() => import("./pages/Contact"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Payments = lazy(() => import("./pages/Payments"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const TaxCalculator = lazy(() => import("./pages/TaxCalculator"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Blog = lazy(() => import("./pages/Blog"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const Team = lazy(() => import("./pages/Team"));
const ClientManagement = lazy(() => import("./pages/ClientManagement"));
const AppointmentManagement = lazy(() => import("./pages/AppointmentManagement"));
const MyAppointments = lazy(() => import("./pages/MyAppointments"));
const InvoiceHistory = lazy(() => import("./pages/InvoiceHistory"));
const DocumentVault = lazy(() => import("./pages/DocumentVault"));
const BlogManagement = lazy(() => import("./pages/BlogManagement"));
const TestimonialApproval = lazy(() => import("./pages/TestimonialApproval"));
const ClientProfile = lazy(() => import("./pages/ClientProfile"));
const GSTTracker = lazy(() => import("./pages/GSTTracker"));
const ExpenseTracker = lazy(() => import("./pages/ExpenseTracker"));
const FinancialCalculators = lazy(() => import("./pages/FinancialCalculators"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const Feedback = lazy(() => import("./pages/Feedback"));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences"));
const RevenueDashboard = lazy(() => import("./pages/RevenueDashboard"));
const TaskKanban = lazy(() => import("./pages/TaskKanban"));
const TaxCalendar = lazy(() => import("./pages/TaxCalendar"));
const LiveChat = lazy(() => import("./pages/LiveChat"));
const ComplianceScore = lazy(() => import("./pages/ComplianceScore"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Careers = lazy(() => import("./pages/Careers"));
const CareerManagement = lazy(() => import("./pages/CareerManagement"));
const TeamManagement = lazy(() => import("./pages/TeamManagement"));
const ServicesManagement = lazy(() => import("./pages/ServicesManagement"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// AI / ML / Data Science pages
const AITaxOptimizer = lazy(() => import("./pages/AITaxOptimizer"));
const SmartDocAnalyzer = lazy(() => import("./pages/SmartDocAnalyzer"));
const FinancialInsights = lazy(() => import("./pages/FinancialInsights"));
const RiskAssessment = lazy(() => import("./pages/RiskAssessment"));
const CashFlowForecaster = lazy(() => import("./pages/CashFlowForecaster"));
const InvoiceScanner = lazy(() => import("./pages/InvoiceScanner"));
const DeductionFinder = lazy(() => import("./pages/DeductionFinder"));
const AIClientInsights = lazy(() => import("./pages/AIClientInsights"));
const WorkloadOptimizer = lazy(() => import("./pages/WorkloadOptimizer"));
const AnomalyConsole = lazy(() => import("./pages/AnomalyConsole"));
const AIHub = lazy(() => import("./pages/AIHub"));

// Lazy-load AIChatbot — it's 49KB and only needed when user clicks the fab
const AIChatbotLazy = lazy(() =>
  import("./components/AIChatbot").then((m) => ({ default: m.AIChatbot }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1
    }
  }
});

const AnimatedRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
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
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tax-calculator" element={<TaxCalculator />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/team" element={<Team />} />
        <Route path="/clients" element={<ClientManagement />} />
        <Route path="/admin/appointments" element={<AppointmentManagement />} />
        <Route path="/admin/blog" element={<BlogManagement />} />
        <Route path="/admin/testimonials" element={<TestimonialApproval />} />
        <Route path="/admin/client/:userId" element={<ClientProfile />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/invoices" element={<InvoiceHistory />} />
        <Route path="/documents" element={<DocumentVault />} />
        <Route path="/gst-tracker" element={<GSTTracker />} />
        <Route path="/expenses" element={<ExpenseTracker />} />
        <Route path="/calculators" element={<FinancialCalculators />} />
        <Route path="/resources" element={<KnowledgeBase />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/notifications" element={<NotificationPreferences />} />
        <Route path="/admin/revenue" element={<RevenueDashboard />} />
        <Route path="/admin/tasks" element={<TaskKanban />} />
        <Route path="/tax-calendar" element={<TaxCalendar />} />
        <Route path="/messages" element={<LiveChat />} />
        <Route path="/compliance" element={<ComplianceScore />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/admin/careers" element={<CareerManagement />} />
        <Route path="/admin/team" element={<TeamManagement />} />
        <Route path="/admin/services" element={<ServicesManagement />} />
        {/* AI / ML / DS Feature Routes */}
        <Route path="/ai-tax-optimizer" element={<AITaxOptimizer />} />
        <Route path="/smart-docs" element={<SmartDocAnalyzer />} />
        <Route path="/financial-insights" element={<FinancialInsights />} />
        <Route path="/risk-assessment" element={<RiskAssessment />} />
        <Route path="/cash-flow-forecast" element={<CashFlowForecaster />} />
        <Route path="/invoice-scanner" element={<InvoiceScanner />} />
        <Route path="/deduction-finder" element={<DeductionFinder />} />
        <Route path="/admin/ai-insights" element={<AIClientInsights />} />
        <Route path="/admin/workload" element={<WorkloadOptimizer />} />
        <Route path="/admin/anomalies" element={<AnomalyConsole />} />
        <Route path="/ai-tools" element={<AIHub />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  usePrefetchRoutes();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
            <ErrorBoundary>
            <Toaster />
            <Sonner />
            <ScrollToTop />
            <AnnouncementBanner />
            {/* Fixed nav sits above content; pt-16 compensates for its 64px height */}
            <Navigation />
          <div className="pt-16 min-h-screen flex flex-col">
            <main className="flex-1">
              <ErrorBoundary>
                <AnimatedRoutes />
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
          <Suspense fallback={null}>
            <AIChatbotLazy />
          </Suspense>
          <ScrollProgressBar />
          <BackToTop />
          <CookieConsent />
          </ErrorBoundary>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};


export default App;