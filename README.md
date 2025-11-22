# GoodHealth

A Progressive Web App for fitness tracking with AI-powered insights.

[![CI](https://github.com/saurabhpro/goodhealth/actions/workflows/ci.yml/badge.svg)](https://github.com/saurabhpro/goodhealth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/saurabhpro/goodhealth/graph/badge.svg?token=ESKjLLgWVw)](https://codecov.io/gh/saurabhpro/goodhealth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🏋️ **Workout Tracking** - Log exercises with smart inputs for cardio, strength, and functional training
- 📏 **Body Measurements** - Track 20+ body metrics with time-series charts
- 📊 **Progress Analytics** - Real-time dashboard with workout history and strength tracking
- 🎯 **Goal Management** - Set and track fitness goals with visual progress
- 🤖 **AI Weekly Analysis** - Automated performance insights every Monday
- 📱 **PWA Support** - Install and use offline on any device
- 🔐 **Secure** - Row-level security with email and OAuth authentication

## Quick Start

```bash
# Install
yarn install

# Configure
cp .env.local.example .env.local
# Add your Supabase credentials to .env.local

# Run migrations
npx supabase db push

# Start
yarn dev
```

Visit http://localhost:3000

## Documentation

- [Setup Guide](docs/SETUP.md) - Installation and configuration
- [Deployment](docs/DEPLOYMENT.md) - Deploy to Vercel/Netlify/Railway
- [Architecture](docs/ARCHITECTURE.md) - System design and technical decisions
- [ADRs](docs/adr/) - Architectural Decision Records
- [Testing](TESTING.md) - Run and write tests

## Tech Stack

Next.js 16 · React 19 · TypeScript · Supabase · Google Gemini AI · Tailwind CSS

## License

MIT
