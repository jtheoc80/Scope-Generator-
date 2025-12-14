# ScopeGen Next.js Migration Guide

## Overview
This guide helps you complete the migration from React + Vite (Replit) to Next.js + Vercel.

**All source files have been copied to this folder!** You just need to complete a few conversion steps.

## File Structure (Already Set Up)

```
nextjs-app/
├── src/
│   ├── app/                    # Next.js App Router (home page ready)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/             # ✅ All components copied
│   │   ├── ui/                 # ✅ 50+ UI components (with 'use client')
│   │   └── *.tsx               # ✅ Custom components (modals, layouts)
│   ├── hooks/                  # ✅ All hooks copied (with 'use client')
│   ├── lib/                    # ✅ Utilities + services
│   │   ├── db.ts               # Database connection
│   │   ├── schema.ts           # Drizzle schema
│   │   └── services/           # ✅ AI, email, stripe, 1build services
│   ├── pages-to-convert/       # ✅ All pages ready to convert
│   │   ├── home.tsx            # → Move to src/app/page.tsx
│   │   ├── dashboard.tsx       # → Move to src/app/dashboard/page.tsx
│   │   ├── generator.tsx       # → Move to src/app/generator/page.tsx
│   │   ├── settings.tsx        # → Move to src/app/settings/page.tsx
│   │   └── ... (25+ pages)
│   └── api-to-convert/         # ✅ Express routes to convert
│       ├── routes.ts           # Original Express routes
│       └── storage.ts          # Database operations
├── middleware.ts               # Clerk auth middleware
├── drizzle.config.ts           # Database config
└── package.json                # All dependencies ready
```

## Pre-Migration Checklist
- [ ] Create a Neon or Supabase PostgreSQL database
- [ ] Create a Clerk account at clerk.com
- [ ] Have your Stripe API keys ready

## Step 1: Install Dependencies

```bash
cd nextjs-app
npm install
```

## Step 2: Environment Variables

Create `.env.local` file:

```env
# Database (Neon/Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional APIs
ONEBUILD_EXTERNAL_KEY=your_key
MAILGUN_API_KEY=your_key
MAILGUN_DOMAIN=your_domain
```

## Step 3: Push Database Schema

```bash
npm run db:push
```

## Step 4: Convert Pages to App Router

For each page in `pages-to-convert/`, create a folder in `src/app/`:

### Quick Conversion Steps:

1. **Home Page** (already done):
   - `pages-to-convert/home.tsx` → Content already in `src/app/page.tsx`

2. **Dashboard**:
   ```bash
   mkdir -p src/app/dashboard
   # Copy dashboard.tsx content to src/app/dashboard/page.tsx
   ```

3. **Generator**:
   ```bash
   mkdir -p src/app/generator
   # Copy generator.tsx content to src/app/generator/page.tsx
   ```

4. **Other pages**: Repeat for settings, pricing, blog, etc.

### Page Conversion Pattern:

**Before (wouter):**
```tsx
// pages-to-convert/dashboard.tsx
export default function Dashboard() {
  return <div>...</div>
}
```

**After (Next.js):**
```tsx
// src/app/dashboard/page.tsx
'use client';

export default function DashboardPage() {
  return <div>...</div>
}
```

## Step 5: Convert API Routes

Convert Express routes from `api-to-convert/routes.ts` to Next.js API routes:

### Example Conversion:

**Before (Express):**
```typescript
app.get('/api/proposals', isAuthenticated, async (req, res) => {
  const proposals = await storage.getProposalsByUserId(req.user.id);
  res.json(proposals);
});
```

**After (Next.js):**
```typescript
// src/app/api/proposals/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const proposals = await db.query.proposals.findMany({
    where: (proposals, { eq }) => eq(proposals.userId, userId),
  });
  
  return NextResponse.json(proposals);
}
```

### API Routes to Create:

```
src/app/api/
├── proposals/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE by ID
├── user/
│   └── route.ts              # GET user profile
├── stripe/
│   ├── create-checkout/
│   │   └── route.ts
│   ├── portal/
│   │   └── route.ts
│   └── webhook/
│       └── route.ts
└── email/
    └── route.ts              # Send proposal emails
```

## Step 6: Add Clerk Auth Pages

Create sign-in and sign-up pages:

```bash
mkdir -p "src/app/sign-in/[[...sign-in]]"
mkdir -p "src/app/sign-up/[[...sign-up]]"
```

**src/app/sign-in/[[...sign-in]]/page.tsx:**
```tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return <SignIn />
}
```

**src/app/sign-up/[[...sign-up]]/page.tsx:**
```tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return <SignUp />
}
```

## Step 7: Update Import Paths

Find and replace these import patterns:

| Old Import | New Import |
|------------|------------|
| `@/components/ui/*` | Works as-is |
| `@/hooks/*` | Works as-is |
| `@/lib/*` | Works as-is |
| `wouter` imports | Remove (use Next.js Link) |
| `useLocation()` | `useRouter()` from next/navigation |

## Step 8: Replace Auth Hook

**Before (Replit Auth):**
```tsx
import { useAuth } from '@/hooks/useAuth';
const { user, isAuthenticated } = useAuth();
```

**After (Clerk):**
```tsx
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs';
const { user, isLoaded } = useUser();
```

## Step 9: Run Development Server

```bash
npm run dev
```

## Step 10: Deploy to Vercel

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial Next.js migration"
git remote add origin https://github.com/yourusername/scope-generator.git
git push -u origin main
```

2. Connect to Vercel:
   - Go to vercel.com
   - Import your GitHub repository
   - Add environment variables
   - Deploy

## Key Changes Summary

| Before (Replit) | After (Vercel) |
|-----------------|----------------|
| Replit Auth | Clerk Auth |
| Express.js | Next.js API Routes |
| Replit Postgres | Neon/Supabase |
| Vite | Next.js |
| wouter | Next.js App Router |
| client/server folders | Single Next.js app |

## Clerk Auth Components

Replace Replit Auth buttons with Clerk:

```tsx
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  )
}
```

## Need Help?

Refer to:
- [Next.js Docs](https://nextjs.org/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Drizzle Docs](https://orm.drizzle.team)
- [Vercel Docs](https://vercel.com/docs)
