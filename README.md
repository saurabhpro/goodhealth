# GoodHealth - Gym Activity Tracker

A modern, progressive web application for tracking gym workouts, visualizing progress, setting fitness goals, and sharing achievements with a community.

## Features

- **Workout Logging**: Track exercises, sets, reps, and weights
- **Progress Visualization**: View your gains with beautiful charts and analytics
- **Goal Setting**: Create and monitor fitness goals
- **Social Features**: Share workouts and connect with the community
- **AI Recommendations**: Get smart workout suggestions (coming soon)
- **Progressive Web App**: Install on mobile devices and use offline
- **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend/Database**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: Zustand
- **Data Visualization**: Recharts
- **PWA**: next-pwa
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- npm or yarn package manager

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Set Up Supabase

1. Create a new project at [app.supabase.com](https://app.supabase.com)
2. Go to Project Settings > API to find your project URL and anon key
3. Go to SQL Editor and run the schema from `supabase-schema.sql`

### 3. Configure Environment Variables

Copy the example environment file and add your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 5. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
goodhealth/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   └── auth/callback/    # Supabase auth callback
│   ├── layout.tsx            # Root layout with navbar
│   └── page.tsx              # Landing page
├── components/               # React components
│   ├── layout/               # Layout components (navbar, etc.)
│   ├── workout/              # Workout-related components
│   ├── dashboard/            # Dashboard components
│   └── ui/                   # shadcn/ui components
├── lib/                      # Utility functions and configs
│   ├── supabase/             # Supabase client configs
│   │   ├── client.ts         # Browser client
│   │   └── server.ts         # Server client
│   └── auth/                 # Authentication utilities
│       ├── actions.ts        # Server actions for auth
│       └── hooks.ts          # Client hooks for auth
├── types/                    # TypeScript type definitions
│   ├── database.ts           # Supabase database types
│   └── index.ts              # App-specific types
├── public/                   # Static assets
│   └── manifest.json         # PWA manifest
├── middleware.ts             # Auth middleware
└── supabase-schema.sql       # Database schema
```

## Database Schema

The app uses the following main tables:

- **profiles**: User profile information
- **workouts**: Workout sessions
- **exercises**: Individual exercises within workouts
- **workout_templates**: Reusable workout templates
- **goals**: Fitness goals and tracking

See `supabase-schema.sql` for the complete schema with Row Level Security policies.

## PWA Installation

### On Mobile (iOS/Android)

1. Open the app in your browser
2. Tap the share/menu button
3. Select "Add to Home Screen"
4. The app will now work offline and appear like a native app

### On Desktop

1. Open the app in Chrome, Edge, or another supported browser
2. Look for the install icon in the address bar
3. Click to install the PWA

## Development

### Adding New Components

```bash
# Add shadcn/ui components
npx shadcn@latest add [component-name]
```

### Type Generation

If you modify the database schema, regenerate TypeScript types:

```bash
npx supabase gen types typescript --project-id your-project-id > types/database.ts
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [vercel.com](https://vercel.com)
3. Add your environment variables in Vercel settings
4. Deploy

The app will automatically deploy on every push to main.

### Environment Variables for Production

Make sure to set these in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)

## Future Enhancements

- [ ] AI-powered workout recommendations
- [ ] Social feed and user following
- [ ] Workout sharing and community templates
- [ ] Advanced analytics and insights
- [ ] Nutrition tracking
- [ ] Integration with fitness wearables
- [ ] Mobile app (React Native or Flutter)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with Next.js, Supabase, and TypeScript
