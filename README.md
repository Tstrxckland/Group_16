# SafeSpace - Bridging the Social Gap

A supportive web application designed for individuals with social anxiety. SafeSpace helps users track their mental wellness journey, practice mindfulness, journal their thoughts, complete social challenges, and connect with a supportive community.

## Features

- **Personal Dashboard** - Track your growth and wellness journey
- **Journal** - Record thoughts and moods with reflective journaling
- **Quick Calm Tools** - Breathing exercises and meditation techniques
- **Social Challenges** - Build confidence with progressive challenges
- **Community** - Anonymous support community posts
- **Friends** - Connect and message with other users
- **Discreet Mode** - Privacy-focused features

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **State Management**: TanStack React Query
- **Routing**: React Router v6

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm or bun
- A Supabase account (for backend services)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd Group_16

# Install dependencies
npm install

# Copy environment example and configure
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
```

Get these values from your [Supabase Dashboard](https://supabase.com/dashboard) under Settings > API.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/     # React components
│   ├── layout/     # Layout components
│   └── ui/         # shadcn/ui components
├── hooks/          # Custom React hooks
├── integrations/   # External service integrations
├── lib/            # Utility functions
└── pages/          # Page components
```

## Database Setup

The `supabase/migrations/` folder contains all database migrations. To set up a new Supabase project:

```bash
# Install Supabase CLI
npm install -g supabase

# Push migrations to your project
supabase db push
```

## Documentation

- See `cursor_migration.md` for detailed migration and setup instructions
- See `docs/architecture.md` for system architecture overview

## Deployment

Build the production version:

```bash
npm run build
```

The `dist/` folder can be deployed to any static hosting service (Vercel, Netlify, Cloudflare Pages, etc.)

## License

This project is private.
