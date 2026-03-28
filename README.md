# SMC Job Board 🧹

A mobile-first job dispatch system for Sylvia's Magic Cleaning. Post cleaning jobs, notify workers via WhatsApp, and let them claim work through a simple web portal.

## Tech Stack
- **Frontend:** Next.js 14 + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Auth:** Phone + 4-digit PIN
- **Hosting:** Vercel
- **Notifications:** WhatsApp (manual share links)

---

## Setup Instructions

### Step 1: Supabase Database

1. Go to [supabase.com](https://supabase.com) and open your project
2. Click **SQL Editor** in the left sidebar
3. Copy the entire contents of `scripts/schema.sql` and paste it in
4. Click **Run** — this creates all tables, indexes, triggers, and policies
5. Go to **Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → this is your `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_PHONE=your10digitphone
```

### Step 3: Install & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 4: Create Your Admin Account

1. Go to `http://localhost:3000/signup`
2. Sign up with your name, phone, and a PIN
3. Go to Supabase → **Table Editor → workers**
4. Find your row and change:
   - `status` → `approved`
   - `is_admin` → `true`
5. Now log in at `http://localhost:3000/login` — you'll see the admin dashboard

### Step 5: Deploy to Vercel

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and click **New Project**
3. Import your GitHub repo
4. Add your environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` → set to your Vercel URL (e.g., `https://smc-job-board.vercel.app`)
5. Click **Deploy**

---

## How It Works

### For You (Admin)
1. **Post a job** from the Jobs tab (tap the + button)
2. Fill in location, date, time, pay, type, and notes
3. Tap "Post & Share via WhatsApp" — opens WhatsApp with a pre-formatted message
4. Paste it into your SMC Jobs WhatsApp group
5. Workers tap the link, log in, and claim the job
6. You see who claimed what in your dashboard

### For Workers
1. You send them the signup link via WhatsApp
2. They fill out their profile (name, phone, availability, PIN)
3. You approve them in the Team tab
4. They bookmark the worker portal link
5. When you post a job, they get the WhatsApp message
6. They tap the link, log in with phone + PIN, and claim the job

### Pin This in Your WhatsApp Group
```
📌 SMC Worker Dashboard

Check your schedule, see available jobs, and view your pay:
👉 https://your-app.vercel.app/worker

Log in with your phone number + 4-digit PIN
```

---

## Project Structure

```
smc-job-board/
├── app/
│   ├── layout.js          # Root layout with fonts
│   ├── page.js             # Home — routes to admin/worker/login
│   ├── login/page.js       # Login (phone + PIN)
│   ├── signup/page.js      # 2-step worker signup
│   ├── admin/page.js       # Admin dashboard (Jobs, Team, Schedule, Pay)
│   ├── worker/page.js      # Worker portal (Jobs, Schedule, Pay)
│   └── api/
│       ├── auth/route.js   # Login & signup
│       ├── jobs/route.js   # CRUD for jobs
│       ├── claims/route.js # Claim/unclaim jobs
│       ├── workers/route.js# Worker management
│       └── stats/route.js  # Dashboard statistics
├── components/
│   ├── TopBar.js           # Header bar
│   ├── Tabs.js             # Tab navigation
│   ├── JobCard.js          # Job display card
│   └── Toast.js            # Notifications
├── lib/
│   ├── supabase.js         # Supabase client
│   ├── i18n.js             # English/Spanish translations
│   └── utils.js            # Formatting helpers
├── scripts/
│   └── schema.sql          # Database schema (run in Supabase SQL Editor)
├── public/
│   └── manifest.json       # PWA manifest
├── package.json
├── tailwind.config.js
└── .env.local.example
```

---

## Features

- ✅ Admin dashboard with Jobs, Team, Schedule, Pay tabs
- ✅ Worker signup with profile (name, phone, experience, availability)
- ✅ 4-digit PIN login system
- ✅ Admin approval queue for new workers
- ✅ Post jobs with WhatsApp share (pre-formatted message)
- ✅ Workers claim jobs (first come, first served)
- ✅ Auto-update job status when claimed
- ✅ Worker schedule and pay views
- ✅ Team availability tracking
- ✅ Spanish language support (signup form)
- ✅ Mobile-first responsive design
- ✅ PWA-ready (installable on phones)
- ✅ Invite link system with copy & WhatsApp share
