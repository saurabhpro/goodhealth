# GoodHealth

A Progressive Web App for fitness tracking with AI-powered workout planning and insights.

[![CI](https://github.com/saurabhpro/goodhealth/actions/workflows/ci.yml/badge.svg)](https://github.com/saurabhpro/goodhealth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/saurabhpro/goodhealth/graph/badge.svg?token=ESKjLLgWVw)](https://codecov.io/gh/saurabhpro/goodhealth)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=saurabhpro_goodhealth&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=saurabhpro_goodhealth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🏋️ **Workout Tracking** - Log exercises with smart inputs for cardio, strength, and functional training
- 📏 **Body Measurements** - Track 20+ body metrics with time-series charts
- 📊 **Progress Analytics** - Real-time dashboard with workout history and strength tracking
- 🎯 **Goal Management** - Set and track fitness goals with visual progress
- 🤖 **AI Workout Plans** - Generate personalized multi-week plans with progressive overload
- 📈 **AI Weekly Analysis** - Automated performance insights and recommendations
- 📱 **PWA Support** - Install and use offline on any device
- 🔐 **Secure** - Row-level security with email and OAuth authentication

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │────▶│   Supabase      │
│  Next.js 16     │     │  FastAPI 0.128  │     │  PostgreSQL     │
│    (Vercel)     │     │   (Railway)     │     │  Auth + Storage │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Google Gemini  │
                        │   AI Services   │
                        └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 24+
- Python 3.13+
- Supabase account

### Setup

```bash
# Clone
git clone https://github.com/saurabhpro/goodhealth.git
cd goodhealth

# Frontend
cd frontend && yarn install
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Backend
cd ../backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials

# Run both (from root)
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
goodhealth/
├── frontend/           # Next.js 16 (React + TypeScript)
│   ├── app/            # App Router pages
│   ├── components/     # React components
│   └── lib/            # Actions & utilities
│
├── backend/            # Python FastAPI
│   ├── app/
│   │   ├── routers/    # API endpoints
│   │   ├── services/   # Business logic
│   │   └── models/     # Pydantic schemas
│   ├── migrations/     # SQL migrations
│   └── tests/          # Pytest tests
│
├── docs/               # Documentation
└── .github/            # CI/CD workflows
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 · React · TypeScript · Tailwind CSS · shadcn/ui |
| Backend | Python 3.13 · FastAPI · Pydantic |
| Database | PostgreSQL (Supabase) |
| AI | Google Gemini Pro |
| Hosting | Vercel (frontend) · Railway (backend) |

## Documentation

- [Setup Guide](docs/SETUP.md) - Installation and configuration
- [Deployment](docs/DEPLOYMENT.md) - Deploy to Vercel + Railway
- [Architecture](docs/ARCHITECTURE.md) - System design and decisions
- [Testing](docs/TESTING.md) - Run and write tests
- [ADRs](docs/adr/) - Architectural Decision Records

## Scripts

```bash
# Development
npm run dev              # Start both frontend & backend

# Frontend (cd frontend)
yarn dev                 # Start dev server
yarn build               # Production build
yarn test                # Run tests

# Backend (cd backend)
uvicorn app.main:app --reload  # Start server
pytest                   # Run tests
```

## Deployment

| Service | Platform | Status |
|---------|----------|--------|
| Frontend | Vercel | Auto-deploy on push |
| Backend | Railway | Auto-deploy on push |
| Database | Supabase | Managed |

See [Deployment Guide](docs/DEPLOYMENT.md) for details.

## License

MIT
