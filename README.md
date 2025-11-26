# Live Learning Platform

Full-stack, real-time learning experience that combines NestJS, Next.js, WebRTC, WebSockets, and SQLite/PostgreSQL — all on 100% free/open tooling.

## Architecture Overview

```mermaid
flowchart LR
  subgraph Frontend [Next.js + Chakra UI]
    UI[Auth & Scheduling UI]
    Call[WebRTC Client]
    Chat[Socket.IO Client]
  end

  subgraph Backend [NestJS]
    Auth[Auth + Users Module]
    Lessons[Lesson Scheduling]
    Gateway[Socket.IO Signaling]
    DB[(SQLite/PG via TypeORM)]
  end

  UI -->|REST| Auth
  UI -->|REST| Lessons
  Call -->|Signaling| Gateway
  Chat -->|Messages| Gateway
  Lessons --> DB
  Auth --> DB
```

## Folder Structure

```
.
├── backend (NestJS API + signaling)
│   ├── src/auth        # JWT auth, Passport strategies
│   ├── src/users       # User entity/service/controller
│   ├── src/lessons     # Lesson entity + CRUD + join logic
│   ├── src/realtime    # Socket.IO gateway for chat/WebRTC
│   └── env.sample      # Copy to .env before running
└── frontend (Next.js app router)
    ├── src/app         # Pages (auth, dashboard, lessons, live room)
    ├── src/components  # Navbar, App shell, Video tiles
    ├── src/hooks       # Auth protection + WebRTC hook
    └── env.sample      # Copy to .env.local
```

## Backend (NestJS) Setup

> Requirements: Node 18+, npm, SQLite (bundled), Git Bash/PowerShell.

```bash
cd backend
cp env.sample .env          # or set the same vars manually
npm install
npm run start:dev
```

### Environment Variables

Create a `.env` file in the `backend` directory (copy from `env.sample`):

**Required:**
- `JWT_SECRET` - Secret for signing JWT tokens (use a strong random string in production)
- `JWT_EXPIRES_IN` - Token expiration (e.g., `1d`, `7d`)

**Database (choose one):**
- **SQLite (local dev)**: Set `DATABASE_PATH=./data/learning.sqlite`
- **PostgreSQL (production)**: Set `DATABASE_URL=postgresql://user:password@host:5432/dbname` and optionally `DATABASE_SSL=true` for SSL connections (Neon, Supabase, etc.)

**Optional:**
- `PORT` - API port (default: 4000)
- `FRONTEND_ORIGIN` - Allowed CORS origins, comma-separated (default: `http://localhost:3000`)

**Example for local development:**
```env
PORT=4000
DATABASE_PATH=./data/learning.sqlite
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1d
FRONTEND_ORIGIN=http://localhost:3000
```

**Example for production with PostgreSQL (e.g., Neon free tier):**
```env
PORT=4000
DATABASE_URL=postgresql://user:pass@ep-cool-name-123.us-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_SSL=true
JWT_SECRET=your-production-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=https://your-frontend-domain.com
```

### Key Backend Features

- **Authentication**: Email/password using Passport local + JWT strategies. Passwords hashed with bcrypt.
- **Scheduling**: Teachers create lessons with topic, description, and datetime. Students can join a lesson if vacant.
- **Signaling**: Socket.IO gateway (`LiveGateway`) handles join events, offer/answer/ICE relay, and chat events.
- **Persistence**: TypeORM with SQLite by default. Swap to PostgreSQL (e.g., Neon or Supabase free tiers) by changing TypeORM config/env vars.

## Frontend (Next.js) Setup

```bash
cd frontend
cp env.sample .env.local
npm install
npm run dev
```

### Environment Variables

Create a `.env.local` file in the `frontend` directory (copy from `env.sample`):

- `NEXT_PUBLIC_API_BASE` - Backend API URL
  - Local: `http://localhost:4000`
  - Production: `https://your-backend-domain.com`

### UI Highlights

- Chakra UI-powered pages for landing, auth, dashboard, lesson details, and live call room.
- Global auth context keeps JWT + user profile in `localStorage`.
- Dashboard differentiates teacher (create lessons) vs student (join) permissions.
- `useWebRTC` hook handles media acquisition, peer creation (SimplePeer), Socket.IO signaling, and chat.

## WebRTC Signaling Flow

```mermaid
sequenceDiagram
  participant Teacher
  participant Student
  participant SocketIO as NestJS LiveGateway

  Teacher->>SocketIO: join-room (lessonId, displayName)
  Student->>SocketIO: join-room
  SocketIO-->>Teacher: peer-joined (student socketId)
  Teacher->>SocketIO: signal-offer (lessonId, targetSocketId, offer)
  SocketIO-->>Student: signal-offer (from, offer)
  Student->>SocketIO: signal-answer (lessonId, targetSocketId, answer)
  SocketIO-->>Teacher: signal-answer (from, answer)
  Teacher->>SocketIO: signal-ice (candidate)
  Student->>SocketIO: signal-ice (candidate)
  Note over Teacher,Student: Once connected, media flows peer-to-peer while chat continues over Socket.IO.
```

## Running Everything Locally

1. **Start backend**: `cd backend && npm run start:dev`
2. **Start frontend**: `cd frontend && npm run dev`
3. Open `http://localhost:3000`, register as teacher/student, schedule lessons, and launch live rooms.

## Deployment (Free Tiers)

### Backend

**Free PostgreSQL options:**
- [Neon](https://neon.tech) - Free tier with 0.5GB storage
- [Supabase](https://supabase.com) - Free tier with 500MB database
- [Railway](https://railway.app) - Free tier with PostgreSQL included

**Deployment steps:**

1. **Get a PostgreSQL database URL** (from Neon, Supabase, or Railway)
2. **Deploy to Render/Railway/Fly.io:**
   - Connect your GitHub repo
   - Set root directory to `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm run start:prod`
   - **Set environment variables:**
     - `DATABASE_URL` - Your PostgreSQL connection string
     - `DATABASE_SSL=true` - If your provider requires SSL
     - `JWT_SECRET` - A strong random secret
     - `JWT_EXPIRES_IN=7d`
     - `FRONTEND_ORIGIN` - Your frontend URL (e.g., `https://your-app.vercel.app`)
     - `PORT` - Usually auto-set by the platform (check their docs)

### Frontend

**Deploy to Vercel (recommended) or Netlify:**

1. Connect your GitHub repo
2. Set root directory to `frontend`
3. Build settings are auto-detected (Next.js)
4. **Set environment variable:**
   - `NEXT_PUBLIC_API_BASE` - Your deployed backend URL (e.g., `https://your-backend.onrender.com`)

**Note:** Vercel automatically detects Next.js and sets build/output settings. No manual configuration needed.

### Signaling in Production
- Ensure backend origin allows your deployed frontend domain (update `FRONTEND_ORIGIN`).
- If using HTTPS frontend + HTTP backend, enable HTTPS on backend host to avoid mixed content.

## Testing Checklist

- [ ] Register/login flow works for teacher & student.
- [ ] Teachers can create lessons and see them on dashboard.
- [ ] Students can join open lessons.
- [ ] WebRTC call establishes between teacher & student; chat messages broadcast.
- [ ] Deployment env vars configured and CORS allows public domain.

Everything above uses projects/services that offer generous free tiers (NestJS, Next.js, Socket.IO, SQLite, Chakra UI, Render, Railway, Fly.io, Vercel, GitHub Actions, etc.).

