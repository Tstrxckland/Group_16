# SafeSpace - Cursor Migration Guide

This document provides a comprehensive overview of the SafeSpace codebase and step-by-step instructions for disconnecting Lovable.dev dependencies and running the application locally.

---

## Table of Contents

1. [Codebase Overview](#codebase-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Lovable Dependencies to Remove](#lovable-dependencies-to-remove)
6. [Step-by-Step Migration Instructions](#step-by-step-migration-instructions)
7. [Environment Configuration](#environment-configuration)
8. [Running Locally](#running-locally)
9. [Supabase Setup Options](#supabase-setup-options)
10. [Troubleshooting](#troubleshooting)

---

## Codebase Overview

**SafeSpace** is a supportive web application designed for individuals with social anxiety. The platform helps users:

- Track their mental wellness journey through a personal dashboard
- Practice mindfulness with "Quick Calm" breathing and meditation tools
- Journal their thoughts and moods
- Complete social challenges to build confidence
- Connect with a supportive community
- Build friendships with other users

### Key Features

| Feature | Description | Location |
|---------|-------------|----------|
| **Authentication** | Email/password auth via Supabase | `src/hooks/useAuth.tsx` |
| **Dashboard** | Personal growth tracking and stats | `src/pages/Dashboard.tsx` |
| **Journal** | Mood tracking and reflective journaling | `src/pages/Journal.tsx` |
| **Challenges** | Social challenges to build confidence | `src/pages/Challenges.tsx` |
| **Calm Tools** | Breathing exercises and meditation | `src/pages/Calm.tsx` |
| **Community** | Anonymous support community posts | `src/pages/Community.tsx` |
| **Friends** | Direct messaging with friends | `src/pages/Friends.tsx` |
| **Profile** | User settings and preferences | `src/pages/Profile.tsx` |

---

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **TanStack React Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library (Radix UI primitives)
- **Lucide React** - Icon library
- **Recharts** - Data visualization

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication (email/password)
  - Row Level Security (RLS)
  - Edge Functions (Deno)

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

---

## Project Structure

```
Group_16/
├── public/                    # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── layout/           # App layout components
│   │   │   ├── AppLayout.tsx    # Main authenticated layout
│   │   │   └── BottomNav.tsx    # Mobile bottom navigation
│   │   ├── ui/               # shadcn/ui components (40+ components)
│   │   ├── MessageThread.tsx    # Chat messaging component
│   │   ├── NavLink.tsx          # Navigation link component
│   │   └── ProtectedRoute.tsx   # Auth route guard
│   ├── hooks/
│   │   ├── useAuth.tsx          # Authentication context & hooks
│   │   ├── useDiscreetMode.tsx  # Privacy mode toggle
│   │   ├── useUserStats.tsx     # User statistics hook
│   │   ├── use-mobile.tsx       # Mobile detection hook
│   │   └── use-toast.ts         # Toast notification hook
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts        # Supabase client initialization
│   │       └── types.ts         # Database TypeScript types
│   ├── lib/
│   │   ├── contentModeration.ts # Content filtering utilities
│   │   └── utils.ts             # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── Index.tsx            # Landing page
│   │   ├── Welcome.tsx          # Welcome screen
│   │   ├── Onboarding.tsx       # User onboarding flow
│   │   ├── Auth.tsx             # Login/signup page
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── Challenges.tsx       # Social challenges
│   │   ├── Calm.tsx             # Calm/meditation tools
│   │   ├── Journal.tsx          # Journaling feature
│   │   ├── Community.tsx        # Community posts
│   │   ├── Friends.tsx          # Friends & messaging
│   │   ├── Profile.tsx          # User profile/settings
│   │   └── NotFound.tsx         # 404 page
│   ├── App.tsx                  # Root component with routing
│   ├── App.css                  # App-specific styles
│   ├── index.css                # Global styles & Tailwind
│   ├── main.tsx                 # React entry point
│   └── vite-env.d.ts           # Vite type declarations
├── supabase/
│   ├── config.toml              # Supabase local config
│   ├── functions/
│   │   └── delete-account/      # Edge function for account deletion
│   │       └── index.ts
│   └── migrations/              # Database migrations (9 files)
├── docs/
│   └── architecture.md          # Architecture diagram
├── .env                         # Environment variables (DO NOT COMMIT)
├── .gitignore
├── components.json              # shadcn/ui configuration
├── eslint.config.js
├── index.html                   # HTML entry point
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## Database Schema

The application uses the following Supabase tables:

### `profiles`
User profile information linked to auth.users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `display_name` | TEXT | User's display name |
| `username` | TEXT | Unique username |
| `avatar_url` | TEXT | Profile picture URL |
| `completed_challenges` | TEXT[] | Array of completed challenge IDs |
| `discreet_mode` | BOOLEAN | Privacy mode toggle |
| `is_anonymous` | BOOLEAN | Anonymous posting preference |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### `journal_entries`
User journal entries with mood tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `content` | TEXT | Journal entry content |
| `mood` | TEXT | Mood indicator |
| `reflection` | TEXT | Optional reflection |
| `created_at` | TIMESTAMP | Creation timestamp |

### `community_posts`
Anonymous community support posts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `content` | TEXT | Post content |
| `author_name` | TEXT | Optional author name |
| `is_anonymous` | BOOLEAN | Anonymous posting flag |
| `likes` | INTEGER | Like count |
| `tags` | TEXT[] | Post tags |
| `created_at` | TIMESTAMP | Creation timestamp |

### `friendships`
Friend relationships between users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `requester_profile_id` | UUID | Profile who sent request |
| `addressee_profile_id` | UUID | Profile who received request |
| `status` | ENUM | pending, accepted, declined, blocked |
| `accepted_at` | TIMESTAMP | When accepted |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### `messages`
Direct messages between friends.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `friendship_id` | UUID | Foreign key to friendships |
| `sender_profile_id` | UUID | Profile who sent message |
| `content` | TEXT | Message content |
| `created_at` | TIMESTAMP | Creation timestamp |

---

## Lovable Dependencies to Remove

The following Lovable.dev-specific items need to be removed or updated:

### 1. NPM Package
- **`lovable-tagger`** in `devDependencies` (package.json line 77)

### 2. Vite Configuration
- Import statement for `componentTagger` (vite.config.ts line 4)
- Plugin usage in development mode (vite.config.ts line 12)

### 3. Documentation
- **README.md** - Contains Lovable-specific instructions and links

### 4. OpenGraph Images
- **index.html** - References Lovable.dev images (lines 14, 18)

### 5. Code Comments
- **src/integrations/supabase/client.ts** - "automatically generated" comment (line 1)

---

## Step-by-Step Migration Instructions

### Step 1: Remove the `lovable-tagger` Package

```bash
npm uninstall lovable-tagger
```

### Step 2: Update `vite.config.ts`

Replace the current content with:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Step 3: Update `index.html` OpenGraph Images

Replace the Lovable.dev OpenGraph images with your own or remove them:

```html
<!-- Replace these lines -->
<meta property="og:image" content="/placeholder.svg" />
<meta name="twitter:image" content="/placeholder.svg" />
```

### Step 4: Create `.env.example`

Create a template for environment variables (without actual values):

```bash
# Supabase Configuration
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
```

### Step 5: Update the Supabase Client Comment

In `src/integrations/supabase/client.ts`, update line 1:

```typescript
// Supabase client configuration
import { createClient } from '@supabase/supabase-js';
// ... rest of the file
```

### Step 6: Install Dependencies

```bash
npm install
```

### Step 7: Verify the Build

```bash
npm run build
```

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
```

### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project or use an existing one
3. Navigate to **Settings > API**
4. Copy the **Project URL** for `VITE_SUPABASE_URL`
5. Copy the **anon public** key for `VITE_SUPABASE_PUBLISHABLE_KEY`
6. The Project ID is in the URL: `https://supabase.com/dashboard/project/[PROJECT_ID]`

---

## Running Locally

### Prerequisites

- Node.js 18+ (recommended: use nvm)
- npm or bun

### Development Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Production Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run build:dev` | Create development build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Supabase Setup Options

### Option A: Use Existing Supabase Project (Current)

The app is currently configured to use an existing Supabase project. You can continue using it or migrate to your own project.

**To use your own project:**
1. Create a new Supabase project
2. Run the migrations in the `supabase/migrations/` folder
3. Deploy the edge function in `supabase/functions/delete-account/`
4. Update the `.env` file with your new credentials

### Option B: Run Supabase Locally

For full local development with Supabase:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize (if not already done)
supabase init

# Start local Supabase
supabase start

# Apply migrations
supabase db reset
```

This will start:
- PostgreSQL database on port 54322
- Supabase Studio on port 54323
- Auth server, Storage, and Edge Functions

Update your `.env`:
```env
VITE_SUPABASE_URL="http://localhost:54321"
VITE_SUPABASE_PUBLISHABLE_KEY="your-local-anon-key"
```

### Running Database Migrations

The migrations are in chronological order in `supabase/migrations/`:

1. `20251202024819_...sql` - Creates profiles table and triggers
2. `20251202232742_...sql` - Adds journal entries
3. `20251202234609_...sql` - Adds community posts
4. `20251203030339_...sql` - Adds friendships
5. `20251203032440_...sql` - Adds messages
6. `20251203032945_...sql` - Additional schema updates
7. `20251203033153_...sql` - More updates
8. `20251203035641_...sql` - Additional changes
9. `20251203225130_...sql` - Latest updates

To apply migrations to a new Supabase project:
```bash
supabase db push
```

### Deploying Edge Functions

```bash
# Deploy the delete-account function
supabase functions deploy delete-account
```

---

## Troubleshooting

### Common Issues

#### 1. "Module not found" errors after removing lovable-tagger

Make sure you've updated `vite.config.ts` to remove the `componentTagger` import and usage.

#### 2. Authentication not working

- Verify your Supabase URL and anon key in `.env`
- Check that the environment variables are prefixed with `VITE_`
- Ensure Supabase email auth is enabled in your project settings

#### 3. Database queries failing

- Verify RLS policies are correctly set up
- Check that the user is authenticated before making queries
- Review browser console for specific error messages

#### 4. Build errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

#### 5. TypeScript errors in Supabase types

If you modify the database schema, regenerate types:
```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

---

## Next Steps After Migration

1. **Update branding** - Replace OpenGraph images in `index.html`
2. **Set up CI/CD** - Configure GitHub Actions or similar
3. **Add testing** - Consider adding Vitest or Jest
4. **Configure deployment** - Set up Vercel, Netlify, or similar
5. **Review security** - Audit RLS policies and edge function permissions

---

## Support

If you encounter issues:
1. Check the browser developer console for errors
2. Review Supabase logs in the dashboard
3. Verify environment variables are correctly set
4. Ensure all dependencies are installed

---

*Generated for SafeSpace migration from Lovable.dev to local development*
