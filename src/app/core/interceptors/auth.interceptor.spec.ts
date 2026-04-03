import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add Authorization header when token exists', () => {
    const mockToken = 'test-token-123';
    localStorage.setItem('token', mockToken);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    req.flush({});
  });

  it('should not add Authorization header when token does not exist', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should forward the request unchanged when no token', () => {
    httpClient.post('/api/data', { test: 'value' }).subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.body).toEqual({ test: 'value' });
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should clone request and preserve other headers when adding token', () => {
    const mockToken = 'test-token-123';
    localStorage.setItem('token', mockToken);

    httpClient
      .get('/api/test', {
        headers: { 'X-Custom-Header': 'custom-value' },
      })
      .subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    expect(req.request.headers.has('X-Custom-Header')).toBe(true);
    expect(req.request.headers.get('X-Custom-Header')).toBe('custom-value');
    req.flush({});
  });
});
