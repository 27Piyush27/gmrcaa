
-- Drop the restrictive CA SELECT policy
DROP POLICY "CAs can view assigned requests" ON public.service_requests;

-- Allow CAs to view ALL service requests
CREATE POLICY "CAs can view all requests"
ON public.service_requests
FOR SELECT
USING (has_role(auth.uid(), 'ca'::app_role));

-- Also update CA UPDATE policy to allow updating any request (not just assigned)
DROP POLICY "CAs can update assigned requests" ON public.service_requests;

CREATE POLICY "CAs can update all requests"
ON public.service_requests
FOR UPDATE
USING (has_role(auth.uid(), 'ca'::app_role));
