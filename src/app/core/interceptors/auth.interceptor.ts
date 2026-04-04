import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Functional HTTP interceptor.
 * Attaches `Authorization: Bearer <token>` header when a token exists in localStorage.
 * Handles 401 errors by redirecting to login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  // Clone request with auth header if token exists
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      // Handle 401 Unauthorized - redirect to login
      if (error.status === 401) {
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to login
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
