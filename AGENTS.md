# Agent Coding Standards — FinFlow Angular

## Build, Test & Lint Commands

```bash
# Development
pnpm start              # Start dev server (http://localhost:4200)
pnpm run watch          # Watch mode for development

# Production
pnpm run build         # Production build
pnpm run build --configuration development  # Dev build

# Testing (Jasmine + jsdom via Angular test runner)
pnpm test                           # Run all tests (headless)
pnpm test -- --no-watch            # Run tests once (CI mode)
pnpm test -- --include="**/auth.service.spec.ts"   # Single test file
pnpm test -- --include="**/auth.guard.spec.ts"    # Specific spec

# Manual test runner (Vitest-style output)
npx vitest run --reporter=verbose

# Format & Lint
npx prettier --write "src/**/*.ts"     # Format all TS files
npx prettier --write "src/**/*.html"    # Format all HTML files
```

> **Note**: Use `pnpm` as the package manager (configured in `angular.json`).

---

## TypeScript Guidelines

### Strict Mode Enabled

This project uses strict TypeScript. Do not disable strict flags.

```json
{
  "strict": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "noImplicitReturns": true,
  "noFalltype": true
}
```

### Types & Interfaces

- Use `interface` for object shapes; `type` for unions, intersections, primitives
- Never use `any` — use `unknown` and narrow appropriately
- Use `Readonly<T>` for immutable data
- Use `Partial<T>`, `Required<T>`, `Pick<T>`, `Omit<T>` for type transformations

```typescript
// ✅ Correct
interface User {
  readonly id: string;
  email: string;
  name: string;
}

type UserRole = 'admin' | 'user' | 'guest';

// ❌ Avoid
const user: any = { ... };
```

### Naming Conventions

| Element             | Convention                    | Example                                        |
| ------------------- | ----------------------------- | ---------------------------------------------- |
| Classes             | PascalCase                    | `AuthService`, `TransactionService`            |
| Interfaces          | PascalCase (no I prefix)      | `User`, `LoginResponse`                        |
| Types               | PascalCase                    | `JwtPayload`, `BalanceSummary`                 |
| Variables           | camelCase                     | `currentUser`, `monthlyIncome`                 |
| Constants           | UPPER_SNAKE_CASE              | `API_URL`, `MAX_RETRY_COUNT`                   |
| Private props       | \_prefix OR no prefix         | `_currentUser` or `currentUser`                |
| Signals (Angular)   | camelCase, readonly           | `currentUser`, `isAuthenticated`               |
| Files               | kebab-case                    | `auth.service.ts`, `balance-card.component.ts` |
| Component selectors | kebab-case with `app-` prefix | `app-balance-card`                             |

### Null & Undefined

- Use optional chaining (`?.`) and nullish coalescing (`??`) over manual checks
- Prefer `undefined` over `null` for optional values
- Use `!` assertion only when absolutely certain (avoid)

---

## Angular Patterns

### Dependency Injection

Use `inject()` function instead of constructor injection for clarity and tree-shaking:

```typescript
// ✅ Preferred
export class BalanceCardComponent {
  private readonly txService = inject(TransactionService);
}

// ❌ Avoid
export class BalanceCardComponent {
  constructor(private readonly txService: TransactionService) {}
}
```

### Signals (Angular Signals API)

- Use `signal()` for writable state
- Use `computed()` for derived state (auto-memoized)
- Use `toSignal()` to convert Observables to signals

```typescript
private readonly _currentUser = signal<User | null>(null);
readonly currentUser: Signal<User | null> = this._currentUser.asReadonly();
readonly isAuthenticated = computed(() => this._currentUser() !== null);
```

### Standalone Components

All components are standalone (Angular 14+ style):

```typescript
@Component({
  selector: 'app-balance-card',
  standalone: true, // implicit in Angular 17+
  imports: [CommonModule, RouterLink, TranslocoDirective],
  template: `...`,
})
export class BalanceCardComponent {}
```

### Component Structure

- Use `readonly` for all injected services and signals
- Use `private readonly` for internal state signals
- Group related logic in computed signals
- Keep templates under 100 lines; extract sub-templates if needed

---

## Imports

### Order (enforced by IDE/Prettier)

1. Angular core imports (`@angular/*`)
2. Third-party imports (`rxjs`, `tailwindcss`, etc.)
3. App imports (relative paths starting with `../../` or absolute `src/`)

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user.model';
```

### Barrel Exports

Use `index.ts` files for clean public APIs:

```typescript
// src/app/shared/models/index.ts
export * from './user.model';
export * from './transaction.model';
```

---

## Error Handling

### Service Layer

- Throw typed errors with descriptive messages
- Catch HTTP errors with `catchError` and rethrow as custom errors

```typescript
// ✅ Correct
if (!payload) {
  throw new Error('Invalid token received');
}

// ❌ Avoid
if (!payload) return null; // Swallowing errors
```

### Template Error Handling

- Use `@if`, `@else`, `@for` (Angular 17+ control flow) over `*ngIf`, `*ngFor`
- Handle empty states explicitly in templates

---

## Styling (Tailwind CSS)

### Configuration

Tailwind CSS 4 with custom Material Design 3-inspired theme:

```typescript
// tailwind.config.ts
colors: {
  primary: '#4144e5',
  surface: '#f9f9fc',
  // ... custom palette
}
```

### Usage

- Use CSS custom properties: `bg-[var(--radius-card)]`, `shadow-[var(--shadow-card)]`
- Use Tailwind utility classes; avoid raw CSS unless necessary
- Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- Use `font-headline` and `font-body` from custom theme

---

## i18n (Transloco)

```html
<ng-container *transloco="let t">
  <span>{{ t('dashboard.balance') }}</span>
</ng-container>
```

Keys are in `public/i18n/{lang}.json`.

---

## Formatting (Prettier)

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "overrides": [{ "files": "*.html", "options": { "parser": "angular" } }]
}
```

Run `npx prettier --write .` before committing.

---

## Git Conventions

### Commit Messages

- **All commit messages MUST be in English**
- Use Conventional Commits format: `type: description`
- Types: `feat`, `fix`, `docs`, `config`, `refactor`, `test`, `chore`
- Keep subject line under 72 characters
- Use imperative mood: "add feature" not "added feature"

```bash
# ✅ Correct
git commit -m "feat: add user authentication with JWT"

# ❌ Avoid
git commit -m "Agregué autenticación de usuario"
```

---

## File Structure

```
src/
├── app/
│   ├── core/               # Singleton services, guards, interceptors
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── services/
│   ├── features/           # Feature modules (lazy-loaded)
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   └── subscriptions/
│   ├── shared/             # Reusable components, models, pipes
│   │   ├── components/
│   │   ├── models/
│   │   └── pipes/
│   └── app.routes.ts       # Root routing config
├── environments/           # Environment-specific config
└── styles/                 # Global styles
```
