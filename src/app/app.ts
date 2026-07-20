import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Header } from "./core/layout/header/header";
import { Footer } from "./core/layout/footer/footer";
import { AuthSessionService } from './core/services/auth-session.service';

@Component({
  selector: 'app-root',
  imports: [Header, RouterLink, RouterLinkActive, RouterOutlet, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('sayara-hub-FE');
  protected readonly session = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      document.querySelector('.preloader')?.remove();

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
