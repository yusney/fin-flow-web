import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';

import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user.model';

interface LoginResponse {
  access_token: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  /** Internal writable signal — source of truth for current user */
  private readonly _currentUser = signal<User | null>(null);

  /** Public read-only signal for current user */
  readonly currentUser: Signal<User | null> = this._currentUser.asReadonly();

  /** Derived signal — true if a user is currently authenticated */
  readonly isAuthenticated: Signal<boolean> = computed(() => this._currentUser() !== null);

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Returns true if token exists and is not expired.
   */
  isTokenValid(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const payload = this.decodeJwt(token);
    if (!this.isValidPayload(payload)) return false;

    const expirationDate = new Date(payload.exp * 1000);
    return expirationDate > new Date();
  }

  /**
   * Decodes JWT payload without verification.
   */
  private decodeJwt(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      const parsed: unknown = JSON.parse(jsonPayload);
      if (parsed === null || typeof parsed !== 'object') return null;
      return parsed as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Creates User object from JWT payload.
   */
  private userFromJwt(payload: JwtPayload): User {
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.email.split('@')[0], // Fallback: use email prefix as name
    };
  }

  /**
   * Registers a new user against the API.
   * The API returns { id } on success — no token is issued.
   * The caller is responsible for redirecting to login after registration.
   */
  register(name: string, email: string, password: string): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${environment.apiUrl}/auth/register`, {
      name,
      email,
      password,
    });
  }

  /**
   * Authenticates user against the API.
   * On success: stores token in localStorage and updates signals from JWT.
   */
  login(email: string, password: string): Observable<User> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        map(({ access_token }) => {
          localStorage.setItem('token', access_token);
          const payload = this.decodeJwt(access_token);
          if (!this.isValidPayload(payload)) {
            throw new Error('auth/invalid-token');
          }
          return this.userFromJwt(payload);
        }),
        tap((user) => {
          localStorage.setItem('user', JSON.stringify(user));
          this._currentUser.set(user);
        }),
      );
  }

  /**
   * Clears session: removes token + user from localStorage, resets signals.
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._currentUser.set(null);
  }

  /**
   * Rehydrates signals from localStorage on app initialization.
   * Validates the stored token (expiry + required claims) before restoring user state.
   * Called in constructor so auth state persists across page reloads.
   * Exposed as public to allow test setup; avoid calling from production code.
   */
  loadFromStorage(): void {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');

    if (!token || !userRaw) return;

    const payload = this.decodeJwt(token);

    if (!this.isValidPayload(payload)) {
      // Token missing required claims — clear corrupted/incomplete session
      this.logout();
      return;
    }

    const expirationDate = new Date(payload.exp * 1000);
    if (expirationDate <= new Date()) {
      // Token already expired at load time — no point restoring
      this.logout();
      return;
    }

    try {
      const user: User = JSON.parse(userRaw);
      this._currentUser.set(user);
    } catch {
      // Corrupted user JSON — clear and reset
      this.logout();
    }
  }

  /**
   * Runtime validation of decoded JWT payload.
   * Requires sub, email, and exp claims to be present and non-empty.
   */
  private isValidPayload(payload: JwtPayload | null): payload is JwtPayload {
    return (
      payload !== null &&
      typeof payload.sub === 'string' &&
      payload.sub.length > 0 &&
      typeof payload.email === 'string' &&
      payload.email.length > 0 &&
      typeof payload.exp === 'number'
    );
  }

  /**
   * Updates the current user signal and localStorage.
   * Called when user updates their profile via settings.
   */
  updateCurrentUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this._currentUser.set(user);
  }
}
