
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS time_slot text,
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS appointment_day date GENERATED ALWAYS AS ((appointment_date AT TIME ZONE 'UTC')::date) STORED;

ALTER TABLE public.appointments ALTER COLUMN user_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_unique_slot
  ON public.appointments (appointment_day, time_slot)
  WHERE status <> 'cancelled' AND time_slot IS NOT NULL;

DROP POLICY IF EXISTS "Public can create appointments" ON public.appointments;
CREATE POLICY "Public can create appointments"
  ON public.appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
