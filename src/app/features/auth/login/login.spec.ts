import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LoginPage } from './login';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders the reactive login form', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('form')).toBeTruthy();
    expect(element.querySelector('[formControlName="email"]')).toBeTruthy();
    expect(element.querySelector('[formControlName="password"]')).toBeTruthy();
  });
});
