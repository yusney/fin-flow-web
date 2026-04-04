import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { SubscriptionService, CreateSubscriptionRequest } from './subscription.service';
import { environment } from '../../../environments/environment';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/subscriptions`;

  const mockSubscriptions = [
    {
      id: 'sub-1',
      description: 'Netflix',
      amount: 15.99,
      billingDay: 1,
      startDate: '2024-01-01',
      frequency: 'MONTHLY' as const,
      type: 'DIGITAL_SERVICE' as const,
      isActive: true,
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Entertainment', type: 'expense' },
    },
    {
      id: 'sub-2',
      description: 'Spotify',
      amount: 9.99,
      billingDay: 15,
      startDate: '2024-01-15',
      frequency: 'MONTHLY' as const,
      type: 'DIGITAL_SERVICE' as const,
      isActive: false,
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Entertainment', type: 'expense' },
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), SubscriptionService],
    });

    service = TestBed.inject(SubscriptionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSubscriptions', () => {
    it('should fetch subscriptions from API', async () => {
      const promise = firstValueFrom(service.getSubscriptions());

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockSubscriptions);

      const subscriptions = await promise;
      expect(subscriptions.length).toBe(2);
      expect(subscriptions[0].description).toBe('Netflix');
      expect(subscriptions[0].isActive).toBe(true);
      expect(subscriptions[1].description).toBe('Spotify');
      expect(subscriptions[1].isActive).toBe(false);
    });
  });

  describe('createSubscription', () => {
    it('should POST to API and return new subscription', async () => {
      const request: CreateSubscriptionRequest = {
        description: 'New Service',
        amount: 29.99,
        billingDay: 5,
        categoryId: 'cat-2',
        startDate: '2026-03-01',
        frequency: 'MONTHLY',
        type: 'GENERAL',
      };

      const apiResponse = {
        id: 'sub-3',
        ...request,
        isActive: true,
        category: { id: 'cat-2', name: 'Other', type: 'expense' },
      };

      const promise = firstValueFrom(service.createSubscription(request));

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(apiResponse);

      const subscription = await promise;
      expect(subscription.description).toBe('New Service');
      expect(subscription.amount).toBe(29.99);
      expect(subscription.id).toBe('sub-3');
    });
  });

  describe('toggleStatus', () => {
    it('should PUT to toggle endpoint and return updated subscription', async () => {
      const apiResponse = { ...mockSubscriptions[0], isActive: false };

      const promise = firstValueFrom(service.toggleStatus('sub-1'));

      const req = httpMock.expectOne(`${apiUrl}/sub-1/toggle`);
      expect(req.request.method).toBe('PUT');
      req.flush(apiResponse);

      const updated = await promise;
      expect(updated.isActive).toBe(false);
    });
  });
});
