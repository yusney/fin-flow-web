import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Functional route guard.
 * Allows navigation if authenticated and token is valid; redirects to /login otherwise.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Check both authentication state AND token validity
  if (auth.isAuthenticated() && auth.isTokenValid()) {
    return true;
  }

  // If token is invalid or expired, clear session and redirect
  auth.logout();
  return router.createUrlTree(['/login']);
};
