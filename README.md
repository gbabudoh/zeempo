# Zeempo - AI Chat in Pidgin & Swahili

A modern AI-powered chat application that speaks Nigerian/Ghanaian Pidgin English and Kiswahili.

## Features

- 🗣️ **Bilingual AI**: Chat in Pidgin or Swahili
- 🔐 **User Authentication**: JWT-based secure login/registration
- 💾 **Persistent Chat History**: All conversations saved to database
- 🌙 **Dark Mode**: Beautiful light and dark themes
- 💳 **Stripe Integration**: Subscription payments for Pro features
- 🎨 **Modern UI**: Sleek design with Tailwind CSS and Framer Motion

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL database (local or cloud)

### 1. Database Setup

You need a PostgreSQL database. Choose one option:

**Option A: Cloud Database (Easiest)**

- Sign up for [Neon](https://neon.tech) or [Supabase](https://supabase.com) (free tier)
- Get your connection string
- Add it to `backend/.env` as `DATABASE_URL`

**Option B: Local PostgreSQL**

- Install PostgreSQL
- Create a database named `zeempo_db`
- Update `backend/.env` with your connection string

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

### 2. Backend Setup

```bash
cd backend

# Create .env file from example
cp .env.example .env

# Edit .env and add your:
# - DATABASE_URL
# - GROQ_API_KEY (get from https://console.groq.com)
# - SECRET_KEY (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Install dependencies
pip install -r requirements.txt

# Run Prisma migrations
prisma generate --schema=prisma/schema.prisma
prisma db push --schema=prisma/schema.prisma

# Start the server
python -m app.main
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:5173` and start chatting!

## Environment Variables

### Backend (.env)

```env
# Required
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=postgresql://user:password@host:5432/database
SECRET_KEY=your_secret_key_here

# Optional (for Stripe payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Optional
```

## Tech Stack

### Frontend

- React + Vite
- Tailwind CSS v4
- Framer Motion
- React Icons

### Backend

- FastAPI
- Prisma (ORM)
- PostgreSQL
- JWT Authentication
- Stripe (Payments)
- Groq AI (LLM)

## Project Structure

```
zeempo/
├── backend/
│   ├── app/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── models.py        # Pydantic models
│   │   └── main.py          # FastAPI app
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── services/        # API client
│   │   ├── App.jsx          # Main component
│   │   └── index.css        # Styles
│   └── package.json
└── DATABASE_SETUP.md        # Database setup guide
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning or commercial purposes.
