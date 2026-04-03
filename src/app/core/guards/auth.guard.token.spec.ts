import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard with Token Validation', () => {
  let authServiceMock: AuthService;
  let router: Router;

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      isTokenValid: vi.fn().mockReturnValue(false),
      logout: vi.fn(),
      currentUser: vi.fn().mockReturnValue(null),
      login: vi.fn(),
      loadFromStorage: vi.fn(),
    } as unknown as AuthService;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: {} as any },
          { path: 'dashboard', component: {} as any, canActivate: [authGuard] },
        ]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should allow navigation when authenticated and token is valid', () => {
    vi.mocked(authServiceMock.isAuthenticated).mockReturnValue(true);
    vi.mocked(authServiceMock.isTokenValid).mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({ url: [{ path: 'dashboard' }] } as any, { url: 'dashboard' } as any),
    );

    expect(result).toBe(true);
    expect(authServiceMock.logout).not.toHaveBeenCalled();
  });

  it('should redirect to login when not authenticated', () => {
    vi.mocked(authServiceMock.isAuthenticated).mockReturnValue(false);
    vi.mocked(authServiceMock.isTokenValid).mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({ url: [{ path: 'dashboard' }] } as any, { url: 'dashboard' } as any),
    );

    expect(result).toEqual(router.createUrlTree(['/login']));
    expect(authServiceMock.logout).toHaveBeenCalled();
  });

  it('should redirect to login when authenticated but token is invalid', () => {
    vi.mocked(authServiceMock.isAuthenticated).mockReturnValue(true);
    vi.mocked(authServiceMock.isTokenValid).mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({ url: [{ path: 'dashboard' }] } as any, { url: 'dashboard' } as any),
    );

    expect(result).toEqual(router.createUrlTree(['/login']));
    expect(authServiceMock.logout).toHaveBeenCalled();
  });

  it('should clear session and redirect when token expired', () => {
    // User was previously authenticated but token expired
    vi.mocked(authServiceMock.isAuthenticated).mockReturnValue(true);
    vi.mocked(authServiceMock.isTokenValid).mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({ url: [{ path: 'protected' }] } as any, { url: 'protected' } as any),
    );

    // Should logout and redirect
    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(typeof result).not.toBe('boolean');
  });
});
