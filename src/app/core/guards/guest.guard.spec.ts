import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('guestGuard', () => {
  let router: Router;

  const createMock = (isAuth: boolean, isValid: boolean) => ({
    isAuthenticated: signal(isAuth),
    isTokenValid: vi.fn().mockReturnValue(isValid),
  });

  const setup = (mockOverrides: ReturnType<typeof createMock>) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: {} as never, canActivate: [guestGuard] },
          { path: 'dashboard', component: {} as never },
        ]),
        { provide: AuthService, useValue: mockOverrides },
      ],
    });
    router = TestBed.inject(Router);
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('should allow navigation when user is NOT authenticated', () => {
    setup(createMock(false, false));

    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('should redirect to /dashboard when user IS authenticated with valid token', () => {
    setup(createMock(true, true));

    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));

    expect(result).toEqual(router.createUrlTree(['/dashboard']));
  });

  it('should allow navigation when authenticated but token is invalid', () => {
    setup(createMock(true, false));

    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));

    expect(result).toBe(true);
  });
});
