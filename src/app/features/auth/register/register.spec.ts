import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RegisterPage } from './register';
import { provideTranslateService } from '@ngx-translate/core';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideHttpClient(), provideRouter([]), provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders the reactive registration form', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('form')).toBeTruthy();
    expect(element.querySelector('[formControlName="fullName"]')).toBeTruthy();
    expect(element.querySelector('[formControlName="email"]')).toBeTruthy();
    expect(element.querySelector('[formControlName="password"]')).toBeTruthy();
  });
});
