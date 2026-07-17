import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('toggles the pages menu without Bootstrap JavaScript', () => {
    const button = fixture.nativeElement.querySelector('.dropdown-toggle') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.navbar-nav .dropdown-menu').classList)
      .toContain('show');
  });

  it('toggles the mobile navigation without Bootstrap JavaScript', () => {
    const button = fixture.nativeElement.querySelector('.navbar-toggler') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('#main_nav').classList).toContain('show');
  });
});
