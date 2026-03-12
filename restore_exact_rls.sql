-- Script to restore the exact RLS policies from the original Lovable/Supabase project
-- This will wipe the existing policies on the listed tables and recreate them.

-- 1. Clean existing policies on affected tables to ensure no conflicts
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename IN (
            'payments', 'profiles', 'service_requests', 
            'services', 'user_roles', 'client_documents'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END
$$;

-- 2. Create the EXACT policies side-by-side with your screenshots

-- Table: payments
CREATE POLICY "Users can view their own payments" ON public.payments
FOR SELECT TO public
USING ((auth.uid() = user_id));

CREATE POLICY "Users can create their own payments" ON public.payments
FOR INSERT TO public
WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Admins can view all payments" ON public.payments
FOR ALL TO public
USING (has_role(auth.uid(), 'admin'::app_role));


-- Table: profiles
CREATE POLICY "Admins and CAs can view all profiles" ON public.profiles
FOR SELECT TO public
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ca'::app_role)));

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT TO public
USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT TO public
WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO public
USING ((auth.uid() = user_id));


-- Table: service_requests
CREATE POLICY "CAs can view all requests" ON public.service_requests
FOR SELECT TO public
USING (has_role(auth.uid(), 'ca'::app_role));

CREATE POLICY "Users can view their own requests" ON public.service_requests
FOR SELECT TO public
USING ((auth.uid() = user_id));

CREATE POLICY "Users can create their own requests" ON public.service_requests
FOR INSERT TO public
WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "CAs can update all requests" ON public.service_requests
FOR UPDATE TO public
USING (has_role(auth.uid(), 'ca'::app_role));

CREATE POLICY "Users can update their own requests" ON public.service_requests
FOR UPDATE TO public
USING ((auth.uid() = user_id));

CREATE POLICY "Admins can manage all requests" ON public.service_requests
FOR ALL TO public
USING (has_role(auth.uid(), 'admin'::app_role));


-- Table: services
CREATE POLICY "Anyone can view services" ON public.services
FOR SELECT TO public
USING (true);

CREATE POLICY "Admins can manage services" ON public.services
FOR ALL TO public
USING (has_role(auth.uid(), 'admin'::app_role));


-- Table: user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles
FOR SELECT TO public
USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert their own role on signup" ON public.user_roles
FOR INSERT TO public
WITH CHECK (((auth.uid() = user_id) AND (role = 'client'::app_role)));

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL TO public
USING (has_role(auth.uid(), 'admin'::app_role));


-- Table: client_documents
CREATE POLICY "CAs can view all client documents" ON public.client_documents
FOR SELECT TO public
USING (has_role(auth.uid(), 'ca'::app_role));

CREATE POLICY "Users can view their own documents" ON public.client_documents
FOR SELECT TO public
USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert their own documents" ON public.client_documents
FOR INSERT TO public
WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "CAs can update document review status" ON public.client_documents
FOR UPDATE TO public
USING (has_role(auth.uid(), 'ca'::app_role));

CREATE POLICY "Users can delete their own unreviewed documents" ON public.client_documents
FOR DELETE TO public
USING (((auth.uid() = user_id) AND (reviewed = false)));

CREATE POLICY "Admins can manage all documents" ON public.client_documents
FOR ALL TO public
USING (has_role(auth.uid(), 'admin'::app_role));

