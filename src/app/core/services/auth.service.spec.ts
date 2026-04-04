import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  // Mock JWT token con payload: { sub: '123', email: 'test@example.com', iat: 1234567890, exp: 9999999999 }
  const mockToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjEyMzQ1Njc4OTAsImV4cCI6OTk5OTk5OTk5OX0.test';

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    name: 'test',
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [],
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should not be authenticated initially when no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });

    it('should load user from localStorage via loadFromStorage', () => {
      // Setup: store valid user data
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      // Act: manually call loadFromStorage
      service.loadFromStorage();

      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).toEqual(mockUser);
    });

    it('should clear storage if user data is corrupted', () => {
      // Setup: store invalid user data
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', 'invalid-json');

      // Act: manually call loadFromStorage
      service.loadFromStorage();

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('login', () => {
    it('should authenticate user and store token on successful login', () => {
      const email = 'test@example.com';
      const password = 'password123';

      service.login(email, password).subscribe((user) => {
        expect(user).toEqual(mockUser);
        expect(service.isAuthenticated()).toBe(true);
        expect(service.currentUser()).toEqual(mockUser);
        expect(localStorage.getItem('token')).toBe(mockToken);
        expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password });
      req.flush({ access_token: mockToken });
    });

    it('should throw error for invalid token', () => {
      const email = 'test@example.com';
      const password = 'password123';
      const invalidToken = 'invalid.token.here';

      service.login(email, password).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid token received');
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ access_token: invalidToken });
    });

    it('should handle HTTP error responses', () => {
      const email = 'test@example.com';
      const password = 'wrong-password';

      service.login(email, password).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should clear authentication state and storage', () => {
      // Setup: authenticate first
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      service.loadFromStorage();

      expect(service.isAuthenticated()).toBe(true);

      // Act: logout
      service.logout();

      // Assert
      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('computed signals', () => {
    it('should update isAuthenticated when user changes', () => {
      expect(service.isAuthenticated()).toBe(false);

      // Simulate login by setting user directly
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      service.loadFromStorage();

      expect(service.isAuthenticated()).toBe(true);

      // Logout
      service.logout();
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
