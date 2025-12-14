# ScopeGen Next.js Migration Guide

## Overview
This guide helps you complete the migration from React + Vite (Replit) to Next.js + Vercel.

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

# 1build API (optional)
ONEBUILD_EXTERNAL_KEY=your_key
```

## Step 3: Push Database Schema

```bash
npm run db:push
```

## Step 4: Copy Components

Copy these folders from the original project:
- `client/src/components/ui/*` → `nextjs-app/src/components/ui/`
- `client/src/lib/*` → `nextjs-app/src/lib/` (merge with existing)
- `client/src/hooks/*` → `nextjs-app/src/hooks/`

## Step 5: Convert Pages to App Router

For each page in `client/src/pages/`:
1. Create folder in `nextjs-app/src/app/`
2. Add `page.tsx` file
3. Add `'use client'` directive if it uses useState/useEffect/onClick

Example structure:
```
src/app/
  page.tsx          (home)
  dashboard/
    page.tsx
  generator/
    page.tsx
  settings/
    page.tsx
  market-pricing/
    page.tsx
  sign-in/
    [[...sign-in]]/
      page.tsx      (Clerk sign-in)
  sign-up/
    [[...sign-up]]/
      page.tsx      (Clerk sign-up)
  api/
    proposals/
      route.ts
    stripe/
      webhook/
        route.ts
```

## Step 6: Components Requiring 'use client'

Add `'use client'` to the top of these files:
- All files using `useState`, `useEffect`, `useRef`
- All files with `onClick`, `onChange`, `onSubmit` handlers
- Files using React Query hooks
- Form components

## Step 7: Convert API Routes

Express routes → Next.js API routes example:

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

## Step 8: Run Development Server

```bash
npm run dev
```

## Step 9: Deploy to Vercel

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

Replace Replit Auth with Clerk:

```tsx
// In layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}

// In components
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
