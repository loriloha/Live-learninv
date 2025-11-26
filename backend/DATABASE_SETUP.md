# Database Setup Guide

## Quick Start

### Using PostgreSQL (Your Current Setup)

You've configured PostgreSQL in `env.sample`. Here's what you need to do:

1. **Create the `.env` file:**
   ```bash
   cd backend
   cp env.sample .env
   ```

2. **Make sure PostgreSQL is running:**
   - If using local PostgreSQL, ensure the service is running
   - Your connection string: `postgresql://postgres:qwerty@localhost:5432/livelearning`

3. **Create the database (if it doesn't exist):**
   ```sql
   -- Connect to PostgreSQL and run:
   CREATE DATABASE livelearning;
   ```

4. **Start the backend:**
   ```bash
   npm run start:dev
   ```

   The app will automatically:
   - Connect to PostgreSQL using `DATABASE_URL`
   - Create tables automatically (synchronize: true)
   - Ignore `DATABASE_PATH` when `DATABASE_URL` is set

### Using SQLite (Alternative)

If you want to switch back to SQLite:

1. **Comment out `DATABASE_URL` in `.env`:**
   ```env
   # DATABASE_URL=postgresql://postgres:qwerty@localhost:5432/livelearning
   ```

2. **Uncomment `DATABASE_PATH`:**
   ```env
   DATABASE_PATH=./data/learning.sqlite
   ```

3. **The `data` folder will be created automatically**

## Important Notes

- **Only use ONE database option at a time** - either `DATABASE_URL` (PostgreSQL) OR `DATABASE_PATH` (SQLite)
- The code prioritizes `DATABASE_URL` if it exists, otherwise falls back to SQLite
- For production, always use PostgreSQL with a hosted provider (Neon, Supabase, Railway)
- `synchronize: true` auto-creates tables - set to `false` in production and use migrations

## Troubleshooting

**Error: "database does not exist"**
- Create the database first: `CREATE DATABASE livelearning;`

**Error: "password authentication failed"**
- Check your PostgreSQL password in the connection string

**Error: "connection refused"**
- Ensure PostgreSQL is running: `pg_isready` or check service status

