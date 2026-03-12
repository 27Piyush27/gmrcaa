
-- Table to track client-uploaded documents per service request
CREATE TABLE public.client_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  notes TEXT,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Clients can view their own documents
CREATE POLICY "Users can view their own documents"
  ON public.client_documents FOR SELECT
  USING (auth.uid() = user_id);

-- Clients can upload documents
CREATE POLICY "Users can insert their own documents"
  ON public.client_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Clients can delete their own unreviewed documents
CREATE POLICY "Users can delete their own unreviewed documents"
  ON public.client_documents FOR DELETE
  USING (auth.uid() = user_id AND reviewed = false);

-- Admins full access
CREATE POLICY "Admins can manage all documents"
  ON public.client_documents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- CAs can view all client documents
CREATE POLICY "CAs can view all client documents"
  ON public.client_documents FOR SELECT
  USING (has_role(auth.uid(), 'ca'::app_role));

-- CAs can update review status
CREATE POLICY "CAs can update document review status"
  ON public.client_documents FOR UPDATE
  USING (has_role(auth.uid(), 'ca'::app_role));

-- Storage bucket for client uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('client-uploads', 'client-uploads', false);

-- Storage policies: clients upload to their own folder
CREATE POLICY "Users can upload their own client documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'client-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own client documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own client documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'client-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins and CAs can view all client uploads
CREATE POLICY "Admins can view all client uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-uploads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CAs can view all client uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-uploads' AND has_role(auth.uid(), 'ca'::app_role));

-- Enable realtime for client_documents
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_documents;
