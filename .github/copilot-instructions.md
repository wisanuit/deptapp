<!-- Copilot Instructions for Debt Management SaaS -->

## Project Overview
This is a multi-tenant SaaS debt management application built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Validation**: Zod

## Architecture

### Multi-tenant Design
- Each user can belong to multiple Workspaces
- All data is scoped to Workspace (workspaceId foreign key)
- Role-based access: OWNER, ADMIN, MEMBER

### Core Entities
1. **Contact** - Borrowers and lenders
2. **Loan** - Debt contracts with interest policies
3. **InterestPolicy** - Monthly or daily interest rates
4. **Payment** - Payment records with allocations
5. **CreditCard** - Credit card management

### Interest Calculation
- Monthly mode: Prorates first partial month, then monthly rate
- Daily mode: Simple daily rate × days
- Mid-month payments split calculation periods

### Payment Allocation
- One payment can allocate to multiple loans
- Separate principal and interest tracking
- Auto-allocation methods: INTEREST_FIRST, PRINCIPAL_FIRST, FIFO

## Code Conventions

### API Routes
- Located in `src/app/api/`
- Use `getServerSession` for auth
- Check workspace membership before data access
- Return proper HTTP status codes

### Components
- UI components in `src/components/ui/`
- Use shadcn/ui patterns
- Server components by default, "use client" when needed

### Services
- Business logic in `src/services/`
- Pure functions for calculations
- Database operations in route handlers

### Validation
- Zod schemas in `src/lib/validations.ts`
- Validate on API routes before processing

## File Structure Guidelines
```
src/
├── app/           # Pages and API routes
├── components/    # Reusable components
├── lib/           # Utilities and configs
├── services/      # Business logic
└── types/         # TypeScript declarations
```

## Thai Language Support
- UI text is in Thai
- Use `th-TH` locale for number/date formatting
- Currency: THB (Thai Baht)

## Key Formulas

### Monthly Interest (Prorate)
```typescript
daily_rate = monthly_rate / days_in_month
interest = principal * daily_rate * days
```

### Daily Interest
```typescript
interest = principal * daily_rate * days
```

### Credit Card Minimum Payment
```typescript
minimum = max(balance * percent_rate, fixed_amount)
```
