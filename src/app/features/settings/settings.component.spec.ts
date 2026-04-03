import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let authServiceMock: {
    currentUser: ReturnType<typeof signal>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    localStorage.clear();

    authServiceMock = {
      currentUser: signal({ id: '1', email: 'test@example.com', name: 'Test User' }),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: AuthService, useValue: authServiceMock },
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
      expect(component.settings.currency).toBe('USD');
      expect(component.settings.language).toBe('en');
      expect(component.settings.emailNotifications).toBe(true);
    });

    it('should save settings to localStorage', () => {
      component.settings.currency = 'EUR';
      component.saveSettings();

      const saved = localStorage.getItem('appSettings');
      expect(saved).toBeTruthy();
      expect(JSON.parse(saved!).currency).toBe('EUR');
    });

    it('should toggle boolean settings', () => {
      const initialValue = component.settings.emailNotifications;
      component.toggleSetting('emailNotifications');
      expect(component.settings.emailNotifications).toBe(!initialValue);

      const saved = JSON.parse(localStorage.getItem('appSettings')!);
      expect(saved.emailNotifications).toBe(!initialValue);
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
