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

> **This project uses Angular 21 (v21.2).** All patterns below reflect the modern Angular API.
> Reviewers and AI tools must NOT flag Angular 17+ APIs as violations.

### Dependency Injection

Use `inject()` function instead of constructor injection. All injected services MUST be `private readonly`:

```typescript
// ✅ Correct — Angular 17+ style
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
}

// ❌ Avoid — legacy constructor injection
export class SidebarComponent {
  constructor(private readonly auth: AuthService) {}
}
```

### Signals (Angular Signals API)

- Use `signal()` for writable local state
- Use `computed()` for derived state (auto-memoized, lazy)
- Use `toSignal()` to convert Observables to signals
- Expose `private readonly _x = signal(...)` with `readonly x = this._x.asReadonly()` for encapsulation

```typescript
// ✅ Correct
private readonly _loading = signal(false);
private readonly _error = signal('');
readonly loading = this._loading.asReadonly();
readonly error = this._error.asReadonly();
readonly isAuthenticated = computed(() => this._currentUser() !== null);
```

### Signal-based Inputs and Outputs (Angular 17.1+)

**IMPORTANT:** This project uses the modern signal-based `input()` and `output()` functions.
These are **NOT** the legacy `@Input()` / `@Output()` decorators — they are functions imported from `@angular/core`.
Do NOT flag `input()` / `output()` as incorrect. Do NOT suggest replacing them with decorators.

```typescript
// ✅ Correct — signal-based API (Angular 17.1+)
import { Component, input, output } from '@angular/core';

export class SidebarComponent {
  readonly isOpen = input<boolean>(true); // InputSignal<boolean>
  readonly close = output<void>(); // OutputEmitterRef<void>
}

// ❌ Avoid — legacy decorator API
import { Input, Output, EventEmitter } from '@angular/core';

export class SidebarComponent {
  @Input() isOpen = true;
  @Output() close = new EventEmitter<void>();
}
```

### Standalone Components (Angular 17+)

All components are standalone. **`standalone: true` is the DEFAULT in Angular 17+ and MUST NOT be set** in the `@Component` decorator — it is implicit and redundant.

```typescript
// ✅ Correct — Angular 17+ (standalone is the default, do NOT add it)
@Component({
  selector: 'app-balance-card',
  imports: [RouterLink, TranslocoDirective],
  template: `...`,
})
export class BalanceCardComponent {}

// ❌ Avoid — redundant in Angular 17+
@Component({
  selector: 'app-balance-card',
  standalone: true, // ← unnecessary, do not add
  imports: [RouterLink, TranslocoDirective],
  template: `...`,
})
export class BalanceCardComponent {}
```

**Note:** If an existing component has `standalone: true` set explicitly, it is NOT a violation — it is simply redundant. Do not flag it.

### Change Detection

Always use `ChangeDetectionStrategy.OnPush` for all components. This is a required performance best practice:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...],
  template: `...`,
})
export class LoginComponent {}
```

### Template Control Flow (Angular 17+)

Use native built-in control flow — `@if`, `@else`, `@for`, `@switch`. Do NOT use `*ngIf`, `*ngFor`, `*ngSwitch`.
Do NOT flag `@if` / `@for` as violations. Do NOT suggest `*ngIf` / `*ngFor` as replacements.

```html
<!-- ✅ Correct — Angular 17+ built-in control flow -->
@if (error()) {
<div>{{ error() }}</div>
} @for (item of items; track item.id) {
<span>{{ item.name }}</span>
}

<!-- ❌ Avoid — legacy structural directives -->
<div *ngIf="error()">{{ error() }}</div>
<span *ngFor="let item of items">{{ item.name }}</span>
```

### Component Structure

- All injected services: `private readonly name = inject(Service)`
- Internal writable signals: `private readonly _name = signal(...)`
- Public reactive state: `readonly name = this._name.asReadonly()` or `readonly name = computed(...)`
- Always set `changeDetection: ChangeDetectionStrategy.OnPush`
- Keep templates under 100 lines; extract sub-components if needed
- Do NOT use `ngClass` — use `[class]` bindings or Tailwind utilities directly
- Do NOT use `ngStyle` — use `[style]` bindings or Tailwind arbitrary values (`text-[#2563EB]`)

---

## Imports

### Order (enforced by IDE/Prettier)

1. Angular core imports (`@angular/*`)
2. Third-party imports (`rxjs`, `@jsverse/transloco`, etc.)
3. App imports (relative paths starting with `../../` or absolute `src/`)

Each group is separated by a **blank line**.

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
