# Database Setup Guide

Zeempo requires a PostgreSQL database. You have several options:

## Option 1: Cloud Database (Recommended for Quick Start)

### Using Neon (Free Tier)

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy the connection string (it looks like: `postgresql://user:password@host/database`)
5. Paste it into your `backend/.env` file as `DATABASE_URL`

### Using Supabase (Free Tier)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the "Connection string" (URI format)
5. Paste it into your `backend/.env` file as `DATABASE_URL`

## Option 2: Local PostgreSQL Installation

### Windows

1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Install with default settings (remember the password you set)
3. Open pgAdmin or use psql to create a database:
   ```sql
   CREATE DATABASE zeempo_db;
   ```
4. Update your `backend/.env` file:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/zeempo_db"
   ```

### After Setting Up Database

Run the Prisma migration:

```bash
cd backend
prisma generate --schema=prisma/schema.prisma
prisma db push --schema=prisma/schema.prisma
```

Then start your backend:

```bash
python -m app.main
```
