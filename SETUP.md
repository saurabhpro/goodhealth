# Quick Setup Guide for GoodHealth

Follow these steps to get your GoodHealth app running.

## Step 1: Supabase Setup (10 minutes)

### Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization (or create one)
4. Enter project details:
   - Name: `goodhealth` (or your preferred name)
   - Database Password: (generate a strong password and save it)
   - Region: (choose closest to you)
5. Click "Create new project" and wait for it to initialize (~2 minutes)

### Set Up the Database

1. Once your project is ready, go to the **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the `supabase-schema.sql` file from this project
4. Copy all the SQL code and paste it into the Supabase SQL Editor
5. Click **"Run"** to execute the schema
6. You should see "Success. No rows returned" - that's normal!

### Get Your API Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the settings menu
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Enable Google OAuth (Optional)

To allow users to sign in with Google:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** > **Credentials**
4. Click **"Create Credentials"** > **"OAuth client ID"**
5. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Add your app name and email
   - Add authorized domains (e.g., `supabase.co` and your domain)
6. For OAuth client ID:
   - Application type: **Web application**
   - Name: `GoodHealth`
   - Authorized redirect URIs: Add your Supabase callback URL:
     - Format: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
     - Find your exact URL in Supabase: **Authentication** > **Providers** > **Google**
7. Copy the **Client ID** and **Client Secret**

8. In your Supabase Dashboard:
   - Go to **Authentication** > **Providers**
   - Find **Google** and toggle it **ON**
   - Paste your **Client ID** and **Client Secret**
   - Click **Save**

## Step 2: Configure Environment Variables

1. In your project root, copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and replace the placeholders:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 3: Install and Run

```bash
# Install dependencies (if you haven't already)
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 4: Test the App

1. Click **"Sign up"** in the navigation
2. Choose one of these sign-up methods:
   - **Email/Password**: Fill out the form and create an account
   - **Google**: Click "Continue with Google" button (if you configured Google OAuth)
3. For email signup: Check your email for a confirmation link (if email confirmation is enabled)
4. Once logged in, you'll be redirected to the dashboard

## Troubleshooting

### "Invalid API key" Error

- Double-check that you copied the correct values from Supabase
- Make sure there are no extra spaces in your `.env.local` file
- Restart the dev server after changing environment variables

### Database Errors

- Make sure you ran the entire `supabase-schema.sql` script
- Check the Supabase logs in the Dashboard for specific errors
- Verify that Row Level Security is enabled on all tables

### Authentication Not Working

- Verify the callback URL is set correctly in Supabase:
  - Go to Authentication > URL Configuration
  - Add `http://localhost:3000/api/auth/callback` to allowed redirect URLs
- Check that the `handle_new_user()` function was created successfully

### Google OAuth Not Working

- Make sure Google provider is enabled in Supabase Authentication > Providers
- Verify the redirect URI in Google Cloud Console matches your Supabase callback URL exactly
- Check that your Google OAuth consent screen is configured correctly
- For local development, you may need to add your test users to the OAuth consent screen
- Clear browser cookies and try again if you see OAuth errors

### PWA Not Installing

- PWA features are disabled in development mode
- Build for production to test PWA: `npm run build && npm start`
- Use Chrome/Edge for better PWA support

## Next Steps

Once your app is running:

1. **Customize the UI**: Edit components in `components/` directory
2. **Add Features**: Create new pages in the `app/` directory
3. **Add Components**: Use `npx shadcn@latest add [component-name]`
4. **Deploy**: Push to GitHub and deploy to Vercel

## Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Type checking
npm run type-check       # Check TypeScript types

# Linting
npm run lint             # Run ESLint

# Add UI components
npx shadcn@latest add button card input
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Getting Help

If you run into issues:
1. Check the console for error messages
2. Review the Supabase logs in your dashboard
3. Search for similar issues on GitHub
4. Open a new issue with details about your problem

Happy coding!
