-- Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'ca', 'client');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create services table
CREATE TABLE public.services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  price_range TEXT,
  features TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_requests table
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id TEXT REFERENCES public.services(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes TEXT,
  assigned_ca UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_request_id UUID REFERENCES public.service_requests(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and CAs can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'));

-- User roles policies
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own role on signup"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Services policies (public read)
CREATE POLICY "Anyone can view services"
ON public.services FOR SELECT
USING (true);

CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Service requests policies
CREATE POLICY "Users can view their own requests"
ON public.service_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
ON public.service_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
ON public.service_requests FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "CAs can view assigned requests"
ON public.service_requests FOR SELECT
USING (public.has_role(auth.uid(), 'ca') AND auth.uid() = assigned_ca);

CREATE POLICY "CAs can update assigned requests"
ON public.service_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'ca') AND auth.uid() = assigned_ca);

CREATE POLICY "Admins can manage all requests"
ON public.service_requests FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Payments policies
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
ON public.payments FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'client')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default services
INSERT INTO public.services (id, name, description, icon, category, features) VALUES
('accounting', 'Accounting & Bookkeeping', 'Complete financial record management and bookkeeping services', 'Calculator', 'Financial', ARRAY['Monthly bookkeeping', 'Financial statements', 'Accounts reconciliation', 'Cash flow management']),
('auditing', 'Auditing & Assurance', 'Comprehensive audit services for compliance and assurance', 'FileCheck', 'Compliance', ARRAY['Statutory audits', 'Internal audits', 'Tax audits', 'Due diligence']),
('tax', 'Tax Advisory & Compliance', 'Expert tax planning and compliance services', 'Receipt', 'Tax', ARRAY['Income tax filing', 'GST compliance', 'Tax planning', 'TDS management']),
('company-law', 'Company Law & Secretarial', 'Corporate compliance and secretarial services', 'Building2', 'Legal', ARRAY['Company registration', 'Annual filings', 'Board meetings', 'Statutory compliance']),
('payroll', 'Payroll Management', 'End-to-end payroll processing and compliance', 'Users', 'HR', ARRAY['Salary processing', 'PF/ESI compliance', 'Payslip generation', 'Leave management']),
('advisory', 'Finance & Project Advisory', 'Strategic financial consulting and project advisory', 'TrendingUp', 'Advisory', ARRAY['Business valuation', 'Project financing', 'Strategic planning', 'Investment advisory']);