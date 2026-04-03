import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User } from '../../shared/models/user.model';

describe('AuthService with Token Expiration', () => {
  // Mock JWT token that expires in far future (9999 year)
  const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2NTkzNDA1MDAsImV4cCI6OTk5OTk5OTk5OX0.test';

  // Mock JWT token that expired in 2022
  const expiredToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2NTkzNDA1MDAsImV4cCI6MTY1OTQyNjkwMH0.test';

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    name: 'test',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  function configureTestingModule() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService],
    });
  }

  describe('token validation', () => {
    it('should have isTokenValid method', () => {
      configureTestingModule();
      const service = TestBed.inject(AuthService);
      expect(typeof service.isTokenValid).toBe('function');
    });

    it('should return false when no token exists', () => {
      configureTestingModule();
      const service = TestBed.inject(AuthService);
      expect(service.isTokenValid()).toBe(false);
    });

    it('should return false for malformed token', () => {
      localStorage.setItem('token', 'invalid-token');
      configureTestingModule();
      const service = TestBed.inject(AuthService);
      expect(service.isTokenValid()).toBe(false);
    });

    it('should return false for token without exp claim', () => {
      const tokenWithoutExp =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.test';
      localStorage.setItem('token', tokenWithoutExp);
      configureTestingModule();
      const service = TestBed.inject(AuthService);
      expect(service.isTokenValid()).toBe(false);
    });
  });

  describe('token expiration', () => {
    it('should return true for valid token', () => {
      // Setup localStorage BEFORE creating the service
      localStorage.setItem('token', validToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      configureTestingModule();
      const service = TestBed.inject(AuthService);

      expect(service.isTokenValid()).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false for expired token', () => {
      // Setup localStorage BEFORE creating the service
      localStorage.setItem('token', expiredToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      configureTestingModule();
      const service = TestBed.inject(AuthService);

      expect(service.isTokenValid()).toBe(false);
    });

    it('should clear session when token is expired on init', () => {
      // Setup localStorage BEFORE creating the service with expired token
      localStorage.setItem('token', expiredToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      configureTestingModule();
      const service = TestBed.inject(AuthService);

      // Token should be cleared by checkTokenExpiration in constructor
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear localStorage and reset auth state', () => {
      // Setup authenticated state before creating service
      localStorage.setItem('token', validToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      configureTestingModule();
      const service = TestBed.inject(AuthService);

      expect(service.isAuthenticated()).toBe(true);

      // Logout
      service.logout();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('decodeJwt', () => {
    it('should decode valid JWT', () => {
      localStorage.setItem('token', validToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      configureTestingModule();
      const service = TestBed.inject(AuthService);

      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.email).toBe('test@example.com');
    });
  });
});
