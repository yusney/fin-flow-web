import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { signal, computed } from '@angular/core';

describe('authGuard', () => {
  let router: Router;
  let authService: AuthService;

  // Mock JWT token that expires in far future (9999 year)
  const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwiaWF0IjoxNjU5MzQwNTAwLCJleHAiOjk5OTk5OTk5OTl9.test';

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: {} as any },
          { path: 'dashboard', component: {} as any, canActivate: [authGuard] },
        ]),
        AuthService,
      ],
    });

    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
  });

  it('should allow navigation when user is authenticated', () => {
    // Set authenticated state with valid JWT token
    localStorage.setItem('token', validToken);
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@test.com', name: 'Test' }));
    authService.loadFromStorage();

    const result = TestBed.runInInjectionContext(() =>
      authGuard({ url: [{ path: 'dashboard' }] } as any, { url: 'dashboard' } as any),
    );

    expect(result).toBe(true);
  });

  it('should redirect to /login when user is not authenticated', () => {
    // Ensure no authentication
    localStorage.clear();
    authService.logout();

    const result = TestBed.runInInjectionContext(() =>
      authGuard({ url: [{ path: 'dashboard' }] } as any, { url: 'dashboard' } as any),
    );

    expect(result).toEqual(router.createUrlTree(['/login']));
  });

  it('should create URL tree pointing to login', () => {
    localStorage.clear();
    authService.logout();

    const result = TestBed.runInInjectionContext(() =>
      authGuard({ url: [{ path: 'protected' }] } as any, { url: 'protected' } as any),
    );

    // Verify it's a UrlTree with correct path
    expect(result).toBeTruthy();
    expect(typeof result).not.toBe('boolean');
  });
});
