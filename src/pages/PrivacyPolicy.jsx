import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Lock } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <PageTransition>
      <div className="min-h-screen">
        <section className="relative pt-28 pb-16 md:pt-40 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
          <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center relative">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/60 text-xs text-muted-foreground tracking-widest uppercase mb-8">
              <Lock className="w-3.5 h-3.5" /> Privacy
            </motion.div>
            <motion.h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-6"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}>
              Privacy Policy
            </motion.h1>
            <motion.p className="text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              Last updated: May 1, 2026
            </motion.p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-6 lg:px-12 prose prose-neutral dark:prose-invert">
            <ScrollReveal>
              <h2>1. Information We Collect</h2>
              <p>We collect the following types of information:</p>
              <ul>
                <li><strong>Personal Information:</strong> Name, email, phone number, address, PAN, GSTIN</li>
                <li><strong>Financial Documents:</strong> Tax documents, bank statements, and other files you upload</li>
                <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, and interaction patterns</li>
                <li><strong>Payment Information:</strong> Processed securely through Razorpay (we do not store card details)</li>
              </ul>

              <h2>2. How We Use Your Information</h2>
              <ul>
                <li>To provide and improve our CA services</li>
                <li>To process your payments securely</li>
                <li>To communicate service updates and tax deadlines</li>
                <li>To comply with legal and regulatory requirements</li>
                <li>To respond to your inquiries and support requests</li>
              </ul>

              <h2>3. Data Security</h2>
              <p>We implement industry-standard security measures including:</p>
              <ul>
                <li>Supabase Row Level Security (RLS) for data isolation</li>
                <li>End-to-end encryption for data in transit (TLS/SSL)</li>
                <li>Encryption at rest for all stored data</li>
                <li>Role-based access control (admin, CA, client)</li>
                <li>Regular security audits and monitoring</li>
              </ul>

              <h2>4. Data Sharing</h2>
              <p>We do not sell or rent your personal information. Data may be shared with:</p>
              <ul>
                <li>Assigned Chartered Accountants handling your services</li>
                <li>Payment processors (Razorpay) for transaction processing</li>
                <li>Government authorities when legally required</li>
              </ul>

              <h2>5. Data Retention</h2>
              <p>We retain your data as long as your account is active or as needed to provide services. Financial records are retained for 8 years as required by Indian tax law.</p>

              <h2>6. Your Rights</h2>
              <ul>
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your data in a portable format</li>
              </ul>

              <h2>7. Cookies</h2>
              <p>We use essential cookies for authentication and session management. No third-party tracking cookies are used without your consent.</p>

              <h2>8. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>

              <h2>9. Contact Us</h2>
              <p>For privacy-related inquiries, contact our Data Protection Officer at <a href="mailto:privacy@gmrindia.com">privacy@gmrindia.com</a> or call +91 98712 09393.</p>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
