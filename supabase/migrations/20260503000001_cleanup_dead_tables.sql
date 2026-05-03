-- Cleanup redundant and unused tables from the database schema
-- These features (Direct Messaging, separate application tables) have been consolidated
-- into existing features like service_request_messages and contact_inquiries.

DROP TABLE IF EXISTS public.dm_presence CASCADE;
DROP TABLE IF EXISTS public.dm_typing CASCADE;
DROP TABLE IF EXISTS public.dm_messages CASCADE;
DROP TABLE IF EXISTS public.dm_conversations CASCADE;
DROP TABLE IF EXISTS public.ca_applications CASCADE;
DROP TABLE IF EXISTS public.careers CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
