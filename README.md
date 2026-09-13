# LedgerFlow

A fully functional accounting automation platform: record sales, purchases, expenses, invoices, and payments, and LedgerFlow automatically generates the correct double-entry journal entries, keeps the General Ledger, and produces P&L, Balance Sheet, Cash Flow, and Tax reports — no AI/OCR involved, just a deterministic accounting rules engine.

## Stack

- **Next.js 15 (App Router) + TypeScript** — UI and application logic
- **Firebase Auth** — authentication
- **Firestore** — transactions, ledger, invoices, accounts, audit trail
- **Firebase Storage** — uploaded receipts/documents
- **Recharts** — dashboard charts
- **Tailwind CSS** — styling
- **Vercel** — deployment target

## Two run modes, one codebase

LedgerFlow works out of the box with **zero setup** and is also ready for real
production use the moment you add Firebase credentials:

| | Local demo mode (default) | Firebase mode |
|---|---|---|
| Activated by | No `NEXT_PUBLIC_FIREBASE_*` env vars set | Valid Firebase config in `.env.local` |
| Storage | Browser `localStorage` | Firestore + Firebase Storage |
| Auth | Simple local email/password (per-browser) | Firebase Authentication |
| Data on signup | Seeds ~90 days of realistic sales, purchases, expenses, invoices, and a reconciled bank feed for a demo coffee-roasting business | Empty business with a standard Chart of Accounts, ready for real entries |

Both modes run through the **exact same** accounting rules engine, ledger, and
report calculations (`src/lib/accounting/*`) via a shared `DataProvider`
interface (`src/lib/data/provider.ts`), so nothing about how the numbers are
computed changes between demo and production.

### Switching to real Firebase

1. Create a Firebase project → enable **Authentication (Email/Password)**,
   **Firestore**, and **Storage**.
2. Copy `.env.local.example` to `.env.local` and fill in your project's web
   app config.
3. `npm run dev` — the app now runs entirely against Firebase.
4. Deploy `firestore.rules` and `storage.rules` (`firebase deploy --only firestore:rules,storage`)
   so each business's data is only readable/writable by its owner.

## Core automation

```
User enters transaction (sale / purchase / expense / receipt / payment)
        ↓
Accounting rules engine (src/lib/accounting/rules.ts)
        ↓
Balanced debit/credit journal lines
        ↓
Validation (total debits === total credits)
        ↓
Posted to the General Ledger
        ↓
Automatic account balances, Trial Balance, Aging, and Reports
        ↓
P&L | Balance Sheet | Cash Flow | Tax Summary | Receivables | Payables
```

## Features

- Business setup with a standard Chart of Accounts, seeded automatically
- Sales & purchase recording (cash, bank, or credit) with automatic tax calculation
- Expense tracking against categorized expense accounts
- Invoice (receivable) and bill (payable) generation and payment tracking, with aging
- Automatic double-entry journal entries for every transaction type
- General Ledger with expandable journal entries and a live Trial Balance
- Accounts Receivable / Accounts Payable views with 30/60/90-day aging
- Bank transaction CSV import (Date/Description/Amount or Debit/Credit columns)
- Deterministic bank reconciliation (amount + date proximity matching, manual override)
- Automatic Profit & Loss, Balance Sheet, indirect-method Cash Flow, and Tax Summary — all recomputed live from posted journal entries for any date range
- Full audit trail of every create/update/post/reconcile action
- Dashboard with cash position, net income, AR/AP, revenue/expense trend, and overdue invoices

## Development

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
```

## Project structure

```
src/
  lib/
    types.ts                  Core domain types
    accounting/
      chartOfAccounts.ts       Default Chart of Accounts
      rules.ts                 Transaction type -> journal line generation
      ledger.ts                Balance/ledger/trial-balance calculations
      reports.ts                P&L, Balance Sheet, Cash Flow, Tax Summary
      reconciliation.ts         Bank-matching engine
    data/
      provider.ts               DataProvider interface
      localProvider.ts          Local demo-mode implementation
      firebaseProvider.ts       Firestore/Auth/Storage implementation
    demoData.ts                Realistic demo dataset generator
  contexts/                   Auth + business data React contexts
  components/                 UI primitives and feature components
  app/
    (app)/                    Authenticated routes (dashboard, transactions, ...)
    login/, signup/, onboarding/
```
