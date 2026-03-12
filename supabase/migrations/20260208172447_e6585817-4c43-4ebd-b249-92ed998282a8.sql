-- Create tables if they don't exist (policies/triggers already exist from previous migration)

-- Create service_requests table if missing
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id TEXT REFERENCES public.services(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  assigned_ca UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table if missing
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_request_id UUID REFERENCES public.service_requests(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (safe to re-run)
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$ BEGIN
  -- Service requests policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'Users can view their own requests') THEN
    CREATE POLICY "Users can view their own requests" ON public.service_requests FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'Users can create their own requests') THEN
    CREATE POLICY "Users can create their own requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'Users can update their own requests') THEN
    CREATE POLICY "Users can update their own requests" ON public.service_requests FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'CAs can view assigned requests') THEN
    CREATE POLICY "CAs can view assigned requests" ON public.service_requests FOR SELECT USING (public.has_role(auth.uid(), 'ca') AND auth.uid() = assigned_ca);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'CAs can update assigned requests') THEN
    CREATE POLICY "CAs can update assigned requests" ON public.service_requests FOR UPDATE USING (public.has_role(auth.uid(), 'ca') AND auth.uid() = assigned_ca);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'Admins can manage all requests') THEN
    CREATE POLICY "Admins can manage all requests" ON public.service_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  -- Payments policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can view their own payments') THEN
    CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can create their own payments') THEN
    CREATE POLICY "Users can create their own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can view all payments') THEN
    CREATE POLICY "Admins can view all payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Create triggers (drop first if exist to be safe)
DROP TRIGGER IF EXISTS update_service_requests_updated_at ON public.service_requests;
CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default services if not exists
INSERT INTO public.services (id, name, description, icon, category, features) VALUES
('accounting', 'Accounting & Bookkeeping', 'Complete financial record management and bookkeeping services', 'Calculator', 'Financial', ARRAY['Monthly bookkeeping', 'Financial statements', 'Accounts reconciliation', 'Cash flow management']),
('auditing', 'Auditing & Assurance', 'Comprehensive audit services for compliance and assurance', 'FileCheck', 'Compliance', ARRAY['Statutory audits', 'Internal audits', 'Tax audits', 'Due diligence']),
('tax', 'Tax Advisory & Compliance', 'Expert tax planning and compliance services', 'Receipt', 'Tax', ARRAY['Income tax filing', 'GST compliance', 'Tax planning', 'TDS management']),
('company-law', 'Company Law & Secretarial', 'Corporate compliance and secretarial services', 'Building2', 'Legal', ARRAY['Company registration', 'Annual filings', 'Board meetings', 'Statutory compliance']),
('payroll', 'Payroll Management', 'End-to-end payroll processing and compliance', 'Users', 'HR', ARRAY['Salary processing', 'PF/ESI compliance', 'Payslip generation', 'Leave management']),
('advisory', 'Finance & Project Advisory', 'Strategic financial consulting and project advisory', 'TrendingUp', 'Advisory', ARRAY['Business valuation', 'Project financing', 'Strategic planning', 'Investment advisory'])
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for service_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;