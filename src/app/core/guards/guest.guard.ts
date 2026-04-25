import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Prevents authenticated users from accessing guest-only routes (login, register).
 * Redirects to /dashboard if the user is already authenticated with a valid token.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.isTokenValid()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
