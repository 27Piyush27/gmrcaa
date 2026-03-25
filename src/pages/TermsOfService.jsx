import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Shield } from "lucide-react";

export default function TermsOfService() {
  return (
    <PageTransition>
      <div className="min-h-screen">
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Shield className="w-3.5 h-3.5" /> Legal
            </motion.div>
            <motion.h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}>
              Terms of Service
            </motion.h1>
            <motion.p className="text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              Last updated: March 24, 2026
            </motion.p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-6 lg:px-12 prose prose-neutral dark:prose-invert">
            <ScrollReveal>
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing and using the GMR & Associates platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.</p>

              <h2>2. Description of Service</h2>
              <p>GMR & Associates provides chartered accountancy services including but not limited to tax filing, GST registration, company incorporation, auditing, and financial advisory services through our digital platform.</p>

              <h2>3. User Accounts</h2>
              <p>You must register for an account to access our services. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information during registration.</p>

              <h2>4. Payment Terms</h2>
              <ul>
                <li>Services are billed after completion as specified in the service agreement.</li>
                <li>All prices are in Indian Rupees (INR) and subject to 18% GST.</li>
                <li>Payments are processed securely through Razorpay.</li>
                <li>Refunds are handled on a case-by-case basis within 7 days of payment.</li>
              </ul>

              <h2>5. Service Delivery</h2>
              <p>We strive to deliver all services within the estimated timeframes. However, delivery timelines may vary based on complexity, document availability, and government processing times.</p>

              <h2>6. Confidentiality</h2>
              <p>We maintain strict confidentiality of all client information. Your financial data and documents are protected using industry-standard encryption and access controls.</p>

              <h2>7. Limitation of Liability</h2>
              <p>GMR & Associates shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.</p>

              <h2>8. Intellectual Property</h2>
              <p>All content on this platform, including but not limited to text, graphics, logos, and software, is the property of GMR & Associates and protected by intellectual property laws.</p>

              <h2>9. Termination</h2>
              <p>We reserve the right to terminate or suspend your account at any time for violation of these terms. You may also close your account at any time by contacting support.</p>

              <h2>10. Governing Law</h2>
              <p>These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Delhi/Gurgaon.</p>

              <h2>11. Contact</h2>
              <p>For any questions about these Terms, please contact us at <a href="mailto:info@gmrindia.com">info@gmrindia.com</a> or call +91 98712 09393.</p>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
