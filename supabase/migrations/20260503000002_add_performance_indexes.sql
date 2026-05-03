-- Migration: Add Performance Indexes for Scalability
-- This migration adds B-tree indexes to foreign keys and frequently filtered columns
-- to ensure the database can scale to handle thousands of concurrent users and large datasets
-- without degrading query performance via sequential scans.

-- Indexes for Service Requests
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_ca ON public.service_requests(assigned_ca);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.service_requests(created_at DESC);

-- Indexes for Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);

-- Indexes for Payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_service_request_id ON public.payments(service_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Indexes for Chat System
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);

-- Indexes for Documents
CREATE INDEX IF NOT EXISTS idx_client_documents_user_id ON public.client_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_request_id ON public.client_documents(service_request_id);

-- Indexes for Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
