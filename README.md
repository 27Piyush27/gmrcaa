# GMR & Associates — CA Firm Platform

A full-stack web application for GMR & Associates, a Chartered Accountant firm, built with React, TypeScript, Supabase, and Google Gemini AI.

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **UI**: shadcn/ui + Tailwind CSS + Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime)
- **AI Chatbot**: Google Gemini API
- **Payments**: Razorpay

## Features

- **Client Portal**: Request CA services, upload documents, track progress, make payments
- **Admin / CA Dashboard**: Manage service requests, assign CAs, upload deliverables, review documents
- **AI Chatbot**: Gemini-powered CA assistant with persistent conversation history
- **Payments**: Razorpay integration with GST breakdown and signature verification
- **Notifications**: Real-time in-app notifications for service status changes
- **Document Management**: Secure file uploads with role-based access

## Getting Started

### Prerequisites
- Node.js 18+ and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- A [Supabase](https://supabase.com) project
- Google Gemini API key
- Razorpay account

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Create a .env file (see .env.example)
cp .env.example .env

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

### Supabase Setup

1. **Push the database migration:**
   ```sh
   supabase db push
   ```

2. **Set secrets in Supabase Dashboard → Settings → Edge Functions:**
   - `GEMINI_API_KEY` — Google Gemini API key
   - `RAZORPAY_KEY_ID` — Razorpay Key ID
   - `RAZORPAY_KEY_SECRET` — Razorpay Key Secret
   - `INTERNAL_FUNCTION_SECRET` — A random secret string (`openssl rand -hex 32`)

3. **Deploy edge functions:**
   ```sh
   supabase functions deploy
   ```

## Deployment

Build for production:
```sh
npm run build
```

Deploy the `dist/` folder to any static host (Netlify, Vercel, Cloudflare Pages, etc.) and point it to your Supabase project.
