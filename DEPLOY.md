# UrbanVault Chats — Deploy Guide

## Quick Deploy to Vercel

### Option 1: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option 2: Vercel Dashboard
1. Push this folder to GitHub
2. Go to vercel.com → New Project
3. Import your repo
4. Add env variables (see below)
5. Deploy

## Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Supabase Setup
1. Create project at supabase.com
2. Run `supabase/schema.sql` in SQL editor
3. Enable Phone Auth in Authentication > Providers
4. Add your Twilio credentials for OTP

## Admin Access
Default demo PIN: **2024**
Change in production via env var: ADMIN_SECRET_PIN

## Features
- 🌮 Spanish/English bilingual (ES default)
- 🔐 OTP phone auth (Supabase)
- 💬 13 public chat rooms
- 🛡️ Admin panel (/admin)
- ✨ Premium system (VIP badges)
- 🚫 Profanity/hate speech filter
- 📱 Mobile-first responsive
- ⚡ Real-time messages
