-- Seed data for `services` to satisfy the foreign key constraint `service_requests_service_id_fkey`

INSERT INTO public.services (id, name, description, category, is_active)
VALUES
  ('tax', 'Income Tax & GST', 'Tax Advisory and Filing Services', 'Tax Services', true),
  ('company-law', 'Company Law & Compliance', 'Incorporation and Annual Filings', 'Company Law', true),
  ('auditing', 'Audit & Assurance', 'Statutory and Tax Audit', 'Audit Services', true),
  ('payroll', 'Payroll Management', 'End-to-end payroll processing', 'HR & Payroll', true),
  ('finance-advisory', 'Finance Advisory', 'Project Finance and Loans', 'Advisory', true)
ON CONFLICT (id) DO NOTHING;
