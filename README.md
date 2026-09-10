# PostCraft - Social Media Scheduler & Auto-Comment SaaS 🚀

PostCraft is an open-source inspired social media scheduling and comment automation platform built with Next.js, Prisma, Tailwind CSS, and Supabase PostgreSQL.

## Features ✨

- **Multi-Platform Publishing:** Connect Facebook Pages with Meta Graph API.
- **Direct Media Uploads:** Drag-and-drop video (`.mp4`, `.mov`) and photo uploads with direct binary streaming.
- **Automated First Comment:** Instant or timed comment drops on posts.
- **Engagement Milestone Triggers:** Auto-drop comments when reaching targets (e.g. 10 Likes, 20 Comments).
- **Comment Auto-Reply:** Automatic responses to followers who leave comments.
- **Visual Content Calendar:** Interactive monthly grid with 1-click scheduling.
- **Production Ready:** Pre-configured for Supabase PostgreSQL & Vercel deployment.

## Tech Stack 🛠️

- **Framework:** Next.js (App Router, React 18, TypeScript)
- **Database & ORM:** PostgreSQL on Supabase with Prisma ORM
- **Styling:** Tailwind CSS & Lucide Icons
- **Scheduler:** Node background worker with polling queue

## Getting Started 🚀

1. Clone repository:
   ```bash
   git clone https://github.com/developeralaminvi/postcraft-app.git
   cd postcraft-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set environment variables in `.env`:
   ```env
   DATABASE_URL="your_supabase_pooler_transaction_url"
   DIRECT_URL="your_supabase_pooler_session_url"
   JWT_SECRET="your_jwt_secret"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```
4. Push database schema:
   ```bash
   npx prisma db push
   ```
5. Run development server:
   ```bash
   npm run dev
   ```
6. Run background auto-pilot worker:
   ```bash
   npm run worker
   ```