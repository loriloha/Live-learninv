# Environment Variables Setup Guide

## Quick Reference: Where to Set Environment Variables

### Backend (NestJS)

**Location:** `backend/.env` (create from `backend/env.sample`)

**Required Variables:**

```env
# Authentication
JWT_SECRET=your-strong-random-secret-key-here
JWT_EXPIRES_IN=1d

# Database (choose ONE option)
# Option 1: SQLite (local development)
DATABASE_PATH=./data/learning.sqlite

# Option 2: PostgreSQL (production)
DATABASE_URL=postgresql://user:password@host:5432/dbname
DATABASE_SSL=true  # Set to 'true' for SSL connections (Neon, Supabase, etc.)

# Server
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000  # Comma-separated for multiple origins
```

**For Production Deployment (Render/Railway/Fly.io):**

1. Go to your hosting platform's dashboard
2. Navigate to your service → Environment Variables
3. Add each variable:
   - `DATABASE_URL` - Get from your PostgreSQL provider (Neon, Supabase, Railway)
   - `DATABASE_SSL=true` - If your provider requires SSL
   - `JWT_SECRET` - Generate a strong random string
   - `JWT_EXPIRES_IN=7d`
   - `FRONTEND_ORIGIN=https://your-frontend-domain.com`
   - `PORT` - Usually auto-set by platform

### Frontend (Next.js)

**Location:** `frontend/.env.local` (create from `frontend/env.sample`)

**Required Variables:**

```env
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

**For Production Deployment (Vercel/Netlify):**

1. Go to your hosting platform's dashboard
2. Navigate to your project → Settings → Environment Variables
3. Add:
   - `NEXT_PUBLIC_API_BASE` - Your deployed backend URL (e.g., `https://your-backend.onrender.com`)

## Free PostgreSQL Providers

### Neon (Recommended)
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string from the dashboard
4. Format: `postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`
5. Set `DATABASE_URL` and `DATABASE_SSL=true`

### Supabase
1. Sign up at https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (URI format)
5. Set `DATABASE_URL` and `DATABASE_SSL=true`

### Railway
1. Sign up at https://railway.app
2. Create a new project → Add PostgreSQL
3. Copy the connection string from the service
4. Set `DATABASE_URL` (SSL usually handled automatically)

## Security Notes

- **Never commit `.env` or `.env.local` files to Git**
- Use strong, random strings for `JWT_SECRET` (e.g., `openssl rand -base64 32`)
- In production, use different secrets than development
- Keep your database credentials secure and rotate them periodically

