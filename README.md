# ScopeGen - Contractor Proposal Generator

<p align="center">
  <strong>Create professional contractor proposals in 60 seconds</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#scripts">Scripts</a> •
  <a href="#testing">Testing</a>
</p>

---

## Overview

ScopeGen is a modern web application designed to help contractors and home service companies generate professional proposals quickly and efficiently. Built by **Lead Ledger Pro LLC** (Houston, Texas), ScopeGen streamlines the proposal process with pre-built scopes, consistent pricing, and professional formatting.

## Features

### 🏠 Trade Support
Generate proposals for 17+ contractor trades:
- Bathroom & Kitchen Remodeling
- Roofing & Siding
- HVAC, Plumbing & Electrical
- Painting & Drywall
- Landscaping & Concrete
- Flooring, Fencing, Decks & more

### 📝 Proposal Generation
- **Instant Price Calculator** - Quick estimates for common job types
- **Pre-built Scope Templates** - Professional line items for every trade
- **PDF Export** - Download branded, client-ready proposals
- **Email Delivery** - Send proposals directly to clients
- **E-Signatures** - Get proposals signed digitally (Pro+)

### 📸 ScopeScan (AI-Powered)
- Photo capture and analysis
- AI-powered scope suggestions
- Automatic issue detection
- Smart pricing recommendations

### 👥 Team Features (Crew Plan)
- Multi-user accounts
- Crew management
- Shared templates
- Team analytics

### 📊 Business Tools
- Dashboard with proposal tracking
- Pricing insights and market data
- Analytics and reporting
- Customer management

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Frontend** | React 19, Tailwind CSS 4 |
| **UI Components** | Radix UI, Lucide Icons |
| **State Management** | React Query (TanStack) |
| **Database** | PostgreSQL with Drizzle ORM |
| **Authentication** | Clerk |
| **Payments** | Stripe |
| **AI** | OpenAI, Anthropic Claude |
| **Cloud Storage** | AWS S3 |
| **Image Analysis** | AWS Rekognition |
| **Maps** | Google Maps API |
| **Testing** | Playwright (E2E), Lighthouse |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Required API keys (see Environment Variables)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jtheoc80/Scope-Generator-.git
cd Scope-Generator-
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables (see below)

5. Set up the database:
```bash
npm run db:push
```

6. Start the development server:
```bash
npm run dev
```

### Environment Variables

The application requires the following environment variables:

```env
# Database
DATABASE_URL=

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Stripe Payments
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# AI Services
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── (landing)/         # Landing pages
│   ├── dashboard/         # User dashboard
│   ├── generator/         # Proposal generator
│   ├── m/                 # Mobile web app
│   └── ...
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Radix-based)
│   ├── marketing/        # Marketing components
│   └── pricing/          # Pricing components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configs
├── drizzle/              # Database schema and migrations
├── src/lib/              # Core business logic
│   ├── learning/         # AI learning systems
│   ├── mobile/           # Mobile-specific logic
│   └── similar-jobs/     # Job matching
├── tests/                # Test files
├── qa/                   # QA automation scripts
└── scripts/              # Build and utility scripts
```

## Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

### Database
```bash
npm run db:push      # Push schema changes
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
npm run db:check     # Check database status
```

### Testing
```bash
npm run test:e2e     # Run Playwright E2E tests
npm run e2e:ui       # Run E2E tests with UI
npm run e2e:headed   # Run E2E tests in headed mode
npm run e2e:debug    # Debug E2E tests
npm run test:smoke   # Run smoke tests only
npm run lighthouse   # Run Lighthouse performance audit
```

### SEO & QA
```bash
npm run seo:audit    # Run SEO audit
npm run seo:scan     # Scan pages for SEO issues
npm run qa           # Run QA automation
```

## Testing

### E2E Testing with Playwright

Run the full test suite:
```bash
npm run test:e2e
```

Run specific tests:
```bash
npx playwright test --grep "proposal"
```

### Performance Testing

Run Lighthouse audits:
```bash
npm run lighthouse
```

## Pricing Plans

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | $9/proposal | Pay per use, PDF export, email delivery |
| **Pro** | $29/month | Unlimited proposals, e-signatures, priority support |
| **Crew** | $79/month | Team accounts, shared templates, analytics |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Email**: support@leadledgerpro.com
- **Business Hours**: Monday - Friday, 9am - 5pm CST

## License

Private - All rights reserved by Lead Ledger Pro LLC

---

<p align="center">
  Built with ❤️ by <a href="https://leadledgerpro.com">Lead Ledger Pro LLC</a> in Houston, Texas
</p>
