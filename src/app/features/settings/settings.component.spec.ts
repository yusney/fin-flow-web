import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { SettingsComponent } from './settings.component';
import { AuthService } from '../../core/services/auth.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { LanguageService } from '../../core/services/language.service';
import { UserService } from '../../core/services/user.service';
import { UserPreferences } from '../../shared/models/user-preferences.model';
import { provideTranslocoTesting } from '../../testing';

const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };

const mockPreferences: UserPreferences = {
  id: 'pref-1',
  userId: '1',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  language: 'en',
  emailNotifications: true,
  pushNotifications: false,
  budgetAlerts: true,
  subscriptionReminders: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  let authServiceMock: ReturnType<typeof createAuthServiceMock>;
  let preferencesServiceMock: ReturnType<typeof createPreferencesServiceMock>;
  let languageServiceMock: ReturnType<typeof createLanguageServiceMock>;
  let userServiceMock: ReturnType<typeof createUserServiceMock>;

  function createAuthServiceMock() {
    return {
      currentUser: signal(mockUser),
      logout: vi.fn(),
      updateCurrentUser: vi.fn(),
    };
  }

  function createPreferencesServiceMock() {
    return {
      getPreferences: vi.fn().mockReturnValue(of(mockPreferences)),
      updatePreferences: vi.fn().mockReturnValue(of(mockPreferences)),
      setPreferences: vi.fn(),
    };
  }

  function createLanguageServiceMock() {
    return {
      setLanguage: vi.fn(),
      getActiveLang: vi.fn().mockReturnValue('en'),
    };
  }

  function createUserServiceMock() {
    return {
      updateMe: vi.fn().mockReturnValue(of(mockUser)),
    };
  }

  beforeEach(async () => {
    localStorage.clear();

    authServiceMock = createAuthServiceMock();
    preferencesServiceMock = createPreferencesServiceMock();
    languageServiceMock = createLanguageServiceMock();
    userServiceMock = createUserServiceMock();

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        provideTranslocoTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: PreferencesService, useValue: preferencesServiceMock },
        { provide: LanguageService, useValue: languageServiceMock },
        { provide: UserService, useValue: userServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display current user info', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test User');
    expect(compiled.textContent).toContain('test@example.com');
  });

  describe('settings', () => {
    it('should load default settings', () => {
      expect(component.settings().currency).toBe('USD');
      expect(component.settings().language).toBe('en');
      expect(component.settings().emailNotifications).toBe(true);
    });

    it('should update a setting and call saveSettings', () => {
      component.updateSetting('currency', 'EUR');

      expect(component.settings().currency).toBe('EUR');
      expect(preferencesServiceMock.updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'EUR' }),
      );
    });

    it('should toggle boolean settings via updateSetting', () => {
      const initialValue = component.settings().emailNotifications;
      component.updateSetting('emailNotifications', !initialValue);

      expect(component.settings().emailNotifications).toBe(!initialValue);
    });
  });

  describe('clear local data', () => {
    it('should clear localStorage except auth keys', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', 'test-user');
      localStorage.setItem('appSettings', '{}');
      localStorage.setItem('someOtherKey', 'value');

      component.clearLocalData();

      expect(localStorage.getItem('token')).toBe('test-token');
      expect(localStorage.getItem('user')).toBe('test-user');
      expect(localStorage.getItem('appSettings')).toBeNull();
      expect(localStorage.getItem('someOtherKey')).toBeNull();
    });
  });

  describe('logout', () => {
    it('should call auth service logout', () => {
      component.logout();
      expect(authServiceMock.logout).toHaveBeenCalled();
    });
  });

  describe('toast notifications', () => {
    it('should show toast message', () => {
      component.showToast('Test message', 'success');
      expect(component.toast()).toEqual({ message: 'Test message', type: 'success' });
    });

    it('should clear toast after 3 seconds', () => {
      vi.useFakeTimers();
      component.showToast('Test message', 'success');
      expect(component.toast()).not.toBeNull();

      vi.advanceTimersByTime(3000);
      expect(component.toast()).toBeNull();
      vi.useRealTimers();
    });
  });
});