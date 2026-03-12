# Supabase Setup Guide for GMR & Associates

This guide outlines the complete process to set up a fresh Supabase project for the GMR & Associates application.

## 1. Create a New Supabase Project
1. Go to [database.new](https://database.new) and sign in to Supabase.
2. Click **New Project**.
3. Select an organization, name your project (e.g., `gmr-associates-prod`), and generate a secure database password.
4. Choose a region closest to your users (e.g., `South Asia (Mumbai)`) and click **Create new project**.

## 2. Get API Credentials
Once your project is ready:
1. Go to **Project Settings** (gear icon) -> **API**.
2. Copy the **Project URL** and the **anon public** key.
3. In your local project, open `.env` (or create one if it doesn't exist) and add these keys:
   ```env
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
   ```

## 3. Database Schema Setup
You need to create the tables required by the application. Go to the **SQL Editor** in the Supabase dashboard and run the following queries sequentially:

### Profiles Table
```sql
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text,
  email text,
  phone text,
  avatar_url text,
  company_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
```

### Services Table
```sql
create table services (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table services enable row level security;
create policy "Services are viewable by everyone." on services for select using (true);
```

### Service Requests Table
```sql
create table service_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  service_id uuid references services(id) not null,
  status text default 'pending'::text,
  progress integer default 0,
  amount numeric,
  notes text,
  document_url text,
  assigned_ca uuid references auth.users(id),
  payment_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table service_requests enable row level security;
create policy "Users can view their own service requests." on service_requests for select using (auth.uid() = user_id);
create policy "Users can insert their own service requests." on service_requests for insert with check (auth.uid() = user_id);
```

### Payments Table
```sql
create table payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  service_request_id uuid references service_requests(id),
  amount numeric not null,
  gst_amount numeric,
  total_amount numeric,
  status text default 'pending'::text,
  description text,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  payment_method text,
  idempotency_key text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table payments enable row level security;
create policy "Users can view their own payments." on payments for select using (auth.uid() = user_id);
```

### Contact Inquiries Table
```sql
create table contact_inquiries (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text default 'new'::text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table contact_inquiries enable row level security;
create policy "Anyone can insert a contact inquiry" on contact_inquiries for insert with check (true);
-- Only admins/CAs should select, so no public select policy
```

## 4. Storage Buckets Setup
1. Go to **Storage** in the Supabase Dashboard.
2. Click **New bucket**.
3. Name it `service-documents`.
4. Make sure it is a **Public** bucket so users can download their documents.
5. Create a policy for the bucket to allow authenticated users to upload and read files.

## 5. Authentication Setup
1. Go to **Authentication** -> **Providers**.
2. **Email**: Ensure Email provider is enabled. You can toggle off "Confirm email" if you want users to log in immediately without verifying their email during development.
3. **Google (Optional)**: If you want Google login, enable the Google provider and fill in the OAuth Client ID and Secret obtained from the Google Cloud Console.

## 6. Configure Supabase CLI & Edge Functions
If you plan to deploy the Edge Functions (Razorpay integration, Chatbot, etc.) to production:
1. Make sure you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed.
2. Link your local project to your live project:
   ```bash
   npx supabase link --project-ref your_project_ref
   ```
   *(You can find your `project_ref` in your Supabase Project Settings URL: `https://supabase.com/dashboard/project/<project_ref>`)*
3. Set your production secrets (Razorpay keys) in Supabase:
   ```bash
   npx supabase secrets set RAZORPAY_KEY_ID=rzp_live_...
   npx supabase secrets set RAZORPAY_KEY_SECRET=your_secret_here
   ```
4. Deploy the edge functions:
   ```bash
   npx supabase functions deploy
   ```

## 7. Realtime Configuration
To ensure the Notification Bell updates live when a service request status changes:
1. Go to **Database** -> **Replication** / **Realtime** in the Supabase dashboard.
2. Enable Realtime on the `service_requests` table.

## Done!
Your new Supabase project is now fully configured and linked to your GMR & Associates application.
