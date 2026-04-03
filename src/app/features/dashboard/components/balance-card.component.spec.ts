import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BalanceCardComponent } from './balance-card.component';

describe('BalanceCardComponent', () => {
  let component: BalanceCardComponent;
  let fixture: ComponentFixture<BalanceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BalanceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display total balance', () => {
    const balanceAmount = fixture.nativeElement.textContent;
    expect(balanceAmount).toContain('$142,580.42');
  });

  it('should display monthly income', () => {
    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Monthly Income');
    expect(content).toContain('+$12,400.00');
  });

  it('should display monthly expenses', () => {
    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Monthly Expenses');
    expect(content).toContain('-$4,822.15');
  });

  it('should have add transaction button', () => {
    const addButton = fixture.debugElement.query(By.css('button[aria-label="Add transaction"]'));
    expect(addButton).toBeTruthy();
    expect(addButton.nativeElement.textContent).toContain('Add');
  });

  it('should apply correct styling classes', () => {
    const cardContainer = fixture.debugElement.query(By.css('.bg-surface-container-lowest'));
    expect(cardContainer).toBeTruthy();
  });

  it('should use tabular nums for balance display', () => {
    const balanceAmount = fixture.debugElement.query(By.css('.tabular-nums'));
    expect(balanceAmount).toBeTruthy();
  });
});
