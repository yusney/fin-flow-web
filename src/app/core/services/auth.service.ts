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
    this.checkTokenExpiration();
  }

  /**
   * Checks if the current token is expired.
   * If expired, clears the session and redirects to login.
   */
  private checkTokenExpiration(): void {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = this.decodeJwt(token);
      if (payload && payload.exp) {
        const expirationDate = new Date(payload.exp * 1000);
        if (expirationDate < new Date()) {
          // Token expired
          this.logout();
        }
      }
    }
  }

  /**
   * Returns true if token exists and is not expired.
   */
  isTokenValid(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const payload = this.decodeJwt(token);
    if (!payload || !payload.exp) return false;

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
      return JSON.parse(jsonPayload) as JwtPayload;
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
          if (!payload) {
            throw new Error('Invalid token received');
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
   * Called in constructor so auth state persists across page reloads.
   */
  loadFromStorage(): void {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');

    if (token && userRaw) {
      try {
        const user: User = JSON.parse(userRaw);
        this._currentUser.set(user);
      } catch {
        // Corrupted storage — clear and reset
        this.logout();
      }
    }
  }
}
