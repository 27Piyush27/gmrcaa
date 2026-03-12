
-- Add amount column to service_requests for CA/Admin to set the final billable amount
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS amount numeric;

-- Add document_url for CA to attach final deliverable documents
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS document_url text;

-- Create storage bucket for service documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-documents', 'service-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for service documents

-- Admins and CAs can upload documents
CREATE POLICY "Admins and CAs can upload service documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-documents' AND 
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'))
);

-- Admins and CAs can update documents
CREATE POLICY "Admins and CAs can update service documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-documents' AND 
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ca'))
);

-- Users can view documents in their own folder, admins and CAs can view all
CREATE POLICY "Users can view their service documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'service-documents' AND
  (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'ca') OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);
