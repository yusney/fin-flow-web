import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import { PreferencesService } from '../../core/services/preferences.service';
import { LanguageService } from '../../core/services/language.service';
import { UserService } from '../../core/services/user.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let httpMock: HttpTestingController;
  let authServiceMock: {
    currentUser: ReturnType<typeof signal>;
    logout: ReturnType<typeof vi.fn>;
    updateCurrentUser: ReturnType<typeof vi.fn>;
  };
  let preferencesServiceMock: {
    getPreferences: ReturnType<typeof vi.fn>;
    updatePreferences: ReturnType<typeof vi.fn>;
    setPreferences: ReturnType<typeof vi.fn>;
  };
  let languageServiceMock: { setLanguage: ReturnType<typeof vi.fn> };
  let userServiceMock: { updateMe: ReturnType<typeof vi.fn> };

  const defaultPrefs = {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    language: 'en',
    emailNotifications: true,
    pushNotifications: false,
    budgetAlerts: true,
    subscriptionReminders: true,
  };

  beforeEach(async () => {
    localStorage.clear();

    authServiceMock = {
      currentUser: signal({ id: '1', email: 'test@example.com', name: 'Test User' }),
      logout: vi.fn(),
      updateCurrentUser: vi.fn(),
    };
    preferencesServiceMock = {
      getPreferences: vi.fn().mockReturnValue(of(defaultPrefs)),
      updatePreferences: vi.fn().mockReturnValue(of(defaultPrefs)),
      setPreferences: vi.fn(),
    };
    languageServiceMock = { setLanguage: vi.fn() };
    userServiceMock = { updateMe: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [
        SettingsComponent,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: PreferencesService, useValue: preferencesServiceMock },
        { provide: LanguageService, useValue: languageServiceMock },
        { provide: UserService, useValue: userServiceMock },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
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

    it('should save settings via updateSetting', () => {
      component.updateSetting('currency', 'EUR');
      expect(preferencesServiceMock.updatePreferences).toHaveBeenCalled();
    });

    it('should toggle boolean settings via updateSetting', () => {
      const initialValue = component.settings().emailNotifications;
      component.updateSetting('emailNotifications', !initialValue);
      expect(component.settings().emailNotifications).toBe(!initialValue);
      expect(preferencesServiceMock.updatePreferences).toHaveBeenCalled();
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
