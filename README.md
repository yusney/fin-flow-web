# Fin Flow — Angular Frontend

Personal finance management application built with Angular 21. Connects to the [fin-flow-api](https://github.com/yusney/fin-flow-api) backend.

## Features

- **Dashboard** — Overview of balance, active subscriptions, recent transactions, and budget progress in a responsive bento grid layout
- **Transactions** — Full CRUD with filters (search, type, category, date range), income/expense statistics, and current-month defaults
- **Budgets** — Monthly budget tracking per category with progress bars and status indicators (on track / warning / exceeded)
- **Subscriptions** — Full CRUD with edit history (SCD Type 2 versioning), active/inactive toggle, and delete confirmation. Supports monthly and annual billing frequencies
- **Settings** — User profile view and preferences (currency, date format, language, notifications)
- **Authentication** — JWT-based login with automatic logout on token expiration and route protection via auth guard
- **Internationalization** — Full English and Spanish support via Transloco

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 (standalone components, Signals) |
| Styling | Tailwind CSS v4 |
| Reactive | RxJS 7 |
| i18n | Transloco 8 |
| Testing | Vitest |
| Package manager | pnpm |
| Language | TypeScript 5.9 |

## Prerequisites

- Node.js 20+
- pnpm 10+
- [fin-flow-api](https://github.com/yusney/fin-flow-api) running on `http://localhost:3000`

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start
```

Open `http://localhost:4200` in your browser.

## Available Scripts

```bash
pnpm start          # Development server
pnpm build          # Production build
pnpm test           # Run tests with Vitest
pnpm watch          # Watch mode build
```

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Auth guard
│   │   ├── interceptors/    # JWT auth interceptor
│   │   └── services/        # Auth, Transaction, Budget, Subscription, Category services
│   ├── features/
│   │   ├── dashboard/       # Dashboard page + layout shell + sidebar
│   │   ├── transactions/    # Transactions CRUD page
│   │   ├── budgets/         # Budgets CRUD page
│   │   ├── subscriptions/   # Subscriptions CRUD page
│   │   ├── settings/        # Settings page
│   │   └── login/           # Login page
│   └── shared/
│       └── models/          # TypeScript interfaces (Transaction, Budget, Subscription, User)
├── environments/            # API URL configuration per environment
└── public/
    └── i18n/                # Translation files (en.json, es.json)
```

## Environment Configuration

| File | Purpose |
|------|---------|
| `src/environments/environment.ts` | Development — API at `http://localhost:3000/api` |
| `src/environments/environment.prod.ts` | Production — set your API URL here |

## Architecture Notes

- All components are **standalone** — no NgModules
- State management via **Angular Signals** (`signal()`, `computed()`, `toSignal()`)
- Routes are **lazy-loaded** per feature
- JWT token is injected automatically via an HTTP interceptor
- Expired tokens trigger automatic logout and redirect to `/login`
