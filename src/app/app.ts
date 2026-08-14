import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Header } from "./core/layout/header/header";
import { Footer } from "./core/layout/footer/footer";
import { AuthSessionService } from './core/services/auth-session.service';
import { DjangoNotificationCenterService } from './core/services/django-notification-center.service';
import { LanguageService } from './core/services/language.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [Header, RouterLink, RouterLinkActive, RouterOutlet, Footer, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('sayara-hub-FE');
  protected readonly isLoading = signal(true);
  protected readonly session = inject(AuthSessionService);
  protected readonly notifications = inject(DjangoNotificationCenterService);
  protected readonly language = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.isLoading.set(true);
          return;
        }

        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.isLoading.set(false);
        }
      });

    afterNextRender(() => {
      document.querySelector('#boot-preloader')?.remove();
      if (this.router.navigated) this.isLoading.set(false);

      document.querySelectorAll<HTMLElement>('[data-background]').forEach(element => {
        const image = element.dataset['background'];
        if (image) element.style.backgroundImage = `url(${image})`;
      });

      const scrollTop = document.querySelector<HTMLElement>('#scroll-top');
      const navbar = document.querySelector<HTMLElement>('.navbar');
      const handleScroll = (): void => {
        const offset = window.scrollY || document.documentElement.scrollTop;
        scrollTop?.classList.toggle('active', offset > 100);
        navbar?.classList.toggle('fixed-top', offset > 50);
      };
      const returnToTop = (event: Event): void => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      scrollTop?.addEventListener('click', returnToTop);
      handleScroll();

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', handleScroll);
        scrollTop?.removeEventListener('click', returnToTop);
      });
    });
  }
}
