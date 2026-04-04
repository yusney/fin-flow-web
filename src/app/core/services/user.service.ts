import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User, UpdateProfileDto } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  /**
   * Returns the current authenticated user's profile.
   * GET /api/users/me
   */
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      catchError((error) => {
        console.error('Error fetching user profile:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Updates the current authenticated user's profile.
   * PATCH /api/users/me
   */
  updateMe(dto: UpdateProfileDto): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/me`, dto).pipe(
      catchError((error) => {
        console.error('Error updating user profile:', error);
        return throwError(() => error);
      }),
    );
  }
}
