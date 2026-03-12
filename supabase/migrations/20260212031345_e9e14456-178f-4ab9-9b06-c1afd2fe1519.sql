
-- Fix client_documents: drop restrictive policies and recreate as permissive
DROP POLICY "Admins can manage all documents" ON public.client_documents;
DROP POLICY "CAs can update document review status" ON public.client_documents;
DROP POLICY "CAs can view all client documents" ON public.client_documents;
DROP POLICY "Users can delete their own unreviewed documents" ON public.client_documents;
DROP POLICY "Users can insert their own documents" ON public.client_documents;
DROP POLICY "Users can view their own documents" ON public.client_documents;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Admins can manage all documents"
ON public.client_documents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CAs can view all client documents"
ON public.client_documents FOR SELECT
USING (has_role(auth.uid(), 'ca'::app_role));

CREATE POLICY "CAs can update document review status"
ON public.client_documents FOR UPDATE
USING (has_role(auth.uid(), 'ca'::app_role));

CREATE POLICY "Users can view their own documents"
ON public.client_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
ON public.client_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unreviewed documents"
ON public.client_documents FOR DELETE
USING (auth.uid() = user_id AND reviewed = false);

-- Fix service_requests: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can manage all requests" ON public.service_requests;
DROP POLICY IF EXISTS "CAs can view all requests" ON public.service_requests;
DROP POLICY IF EXISTS "CAs can update all requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.service_requests;

CREATE POLICY "Admins can manage all requests"
ON public.service_requests FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CAs can view all requests"
ON public.service_requests FOR SELECT
USING (has_role(auth.uid(), 'ca'::app_role));

CREATE POLICY "CAs can update all requests"
ON public.service_requests FOR UPDATE
USING (has_role(auth.uid(), 'ca'::app_role));

CREATE POLICY "Users can view their own requests"
ON public.service_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
ON public.service_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
ON public.service_requests FOR UPDATE
USING (auth.uid() = user_id);

-- Allow CAs to download from client-uploads bucket
CREATE POLICY "CAs can download client uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-uploads' AND has_role(auth.uid(), 'ca'::app_role));

-- Allow Admins to download from client-uploads bucket
CREATE POLICY "Admins can download client uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-uploads' AND has_role(auth.uid(), 'admin'::app_role));
