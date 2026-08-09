import { afterNextRender, effect, inject, Injectable } from '@angular/core';

import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root',
})
export class TemplatePluginsService {
  private readonly language = inject(LanguageService);
  private lastCarouselDirection = this.language.isRtl();

  constructor() {
    effect(() => {
      const rtl = this.language.isRtl();
      if (rtl === this.lastCarouselDirection) return;
      this.lastCarouselDirection = rtl;

      // Owl calculates stage coordinates differently for RTL. Rebuild after
      // the document direction changes instead of retaining stale LTR offsets.
      queueMicrotask(() => this.reinitializeHomeCarousels());
    });
  }

  initializeGlobalPlugins(): void {
    afterNextRender(() => {
      this.initializeNiceSelect();
      this.initializeTooltips();
    });
  }

  initializeHomePlugins(): void {
    afterNextRender(() => {
      this.initializeRevealAnimations();
      this.initializeCounters();
      void this.loadHomeDependencies().then(() => {
        this.initializeHeroSlider();
        this.initializeCarousels();
      }).catch(() => this.showStaticCarousels());
    });
  }

  initializeGalleryPlugins(): void {
    afterNextRender(() => {
      this.initializeMagnificPopup();
    });
  }

  initializeListingPlugins(): void {
    afterNextRender(() => {
      this.initializeIsotope();
    });
  }

  private initializeNiceSelect(): void {
    const jquery = this.jquery();
    if (!jquery) {
      return;
    }

    const selects = jquery('select.nice-select');

    if (typeof selects.niceSelect === 'function') {
      selects.niceSelect();
    }
  }

  private initializeHeroSlider(): void {
    const jquery = this.jquery();
    if (!jquery) {
      return;
    }

    const slider = jquery('.hero-slider');

    if (
      slider.length &&
      typeof slider.owlCarousel === 'function' &&
      !slider.hasClass('owl-loaded')
    ) {
      slider.owlCarousel({
        items: 1,
        loop: true,
        rtl: this.language.isRtl(),
        autoplay: true,
        autoplayHoverPause: true,
        autoplayTimeout: 5000,
        nav: true,
        navText: [
          "<i class='far fa-long-arrow-left' aria-hidden='true'></i>",
          "<i class='far fa-long-arrow-right' aria-hidden='true'></i>",
        ],
        dots: false,
        onInitialized: (event: unknown) => this.animateHeroSlide(jquery, event),
        onChanged: (event: unknown) => this.animateHeroSlide(jquery, event),
      });
    }
  }

  private initializeCarousels(): void {
    const jquery = this.jquery();
    if (!jquery) {
      return;
    }

    jquery('.car-slider').each((_index: number, element: HTMLElement) => {
      const carousel = jquery(element);

      if (
        typeof carousel.owlCarousel === 'function' &&
        !carousel.hasClass('owl-loaded')
      ) {
        carousel.owlCarousel({
          loop: true,
          rtl: this.language.isRtl(),
          margin: 20,
          nav: true,
          dots: false,
          responsive: {
            0: {
              items: 1,
            },
            576: {
              items: 2,
            },
            992: {
              items: 3,
            },
          },
        });
      }
    });

    jquery('.testimonial-slider').each((_index: number, element: HTMLElement) => {
      const carousel = jquery(element);
      if (typeof carousel.owlCarousel === 'function' && !carousel.hasClass('owl-loaded')) {
        carousel.owlCarousel({
          loop: true,
          rtl: this.language.isRtl(),
          margin: 20,
          nav: true,
          dots: true,
          autoplay: true,
          autoplayHoverPause: true,
          autoplayTimeout: 5000,
          responsive: { 0: { items: 1 }, 768: { items: 2 }, 1200: { items: 3 } },
        });
      }
    });
  }

  private initializeMagnificPopup(): void {
    const jquery = this.jquery();
    if (!jquery) {
      return;
    }

    const gallery = jquery('.popup-gallery');

    if (
      gallery.length &&
      typeof gallery.magnificPopup === 'function'
    ) {
      gallery.magnificPopup({
        delegate: 'a',
        type: 'image',
        gallery: {
          enabled: true,
        },
      });
    }
  }

  private initializeCounters(): void {
    const counters = Array.from(document.querySelectorAll<HTMLElement>('.counter'));
    if (!counters.length) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = (counter: HTMLElement): void => {
      if (counter.dataset['animated'] === 'true') return;
      counter.dataset['animated'] = 'true';
      const target = Number(counter.dataset['to'] ?? counter.textContent?.replace(/\D/g, '') ?? 0);
      const duration = Math.min(Number(counter.dataset['speed'] ?? 1200), 3000);
      const suffix = counter.dataset['count'] ?? '';
      if (reducedMotion || !Number.isFinite(target)) {
        counter.textContent = `${target}${suffix}`;
        return;
      }

      const startedAt = performance.now();
      const tick = (now: number): void => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = `${Math.round(target * eased).toLocaleString()}${suffix}`;
        if (progress < 1 && counter.isConnected) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) {
      counters.forEach(start);
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        start(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: .2 });
    counters.forEach(counter => observer.observe(counter));
  }

  private initializeRevealAnimations(): void {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.wow'))
      .filter(element => element.dataset['revealReady'] !== 'true');
    if (!elements.length) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    elements.forEach(element => {
      element.dataset['revealReady'] = 'true';
      element.style.animationDelay = element.dataset['wowDelay'] ?? '0s';
      element.style.animationDuration = element.dataset['wowDuration'] ?? '.8s';
      if (!reducedMotion) element.style.visibility = 'hidden';
    });

    const reveal = (element: HTMLElement): void => {
      element.style.visibility = 'visible';
      if (!reducedMotion) element.classList.add('animated');
    };

    if (reducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reveal(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    elements.forEach(element => observer.observe(element));
  }

  private animateHeroSlide(jquery: any, event: any): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const index = event?.item?.index;
    const target = event?.target;
    if (index === undefined || !target) return;

    jquery(target).find('.owl-item').eq(index).find('[data-animation]')
      .each((_itemIndex: number, item: HTMLElement) => {
        const animation = item.dataset['animation'];
        if (!animation) return;
        item.style.animationDelay = item.dataset['delay'] ?? '0s';
        item.style.animationDuration = item.dataset['duration'] ?? '.8s';
        item.classList.remove('animated', animation);
        void item.offsetWidth;
        item.classList.add('animated', animation);
        item.addEventListener('animationend', () => item.classList.remove('animated', animation), { once: true });
      });
  }

  private initializeIsotope(): void {
    const jquery = this.jquery();
    if (!jquery) {
      return;
    }

    const grid = jquery('.isotope-grid');

    if (!grid.length || typeof grid.isotope !== 'function') {
      return;
    }

    grid.imagesLoaded(() => {
      grid.isotope({
        itemSelector: '.isotope-item',
        layoutMode: 'fitRows',
      });
    });
  }

  private initializeTooltips(): void {
    const bootstrapApi = (window as any).bootstrap;

    if (!bootstrapApi?.Tooltip) {
      return;
    }

    document
      .querySelectorAll<HTMLElement>('[data-bs-toggle="tooltip"]')
      .forEach(element => {
        bootstrapApi.Tooltip.getOrCreateInstance(element);
      });
  }

  private reinitializeHomeCarousels(): void {
    const jquery = this.jquery();
    if (!jquery || typeof jquery.fn?.owlCarousel !== 'function') return;

    jquery('.hero-slider, .car-slider, .testimonial-slider').each(
      (_index: number, element: HTMLElement) => {
        const carousel = jquery(element);
        if (carousel.hasClass('owl-loaded')) carousel.trigger('destroy.owl.carousel');
      },
    );

    this.initializeHeroSlider();
    this.initializeCarousels();
  }

  private jquery(): any | null {
    return (window as Window & { jQuery?: any }).jQuery ?? null;
  }

  private async loadHomeDependencies(): Promise<void> {
    if (!this.jquery())
      await this.loadScript('assets/js/jquery-3.6.0.min.js', 'jquery');
    if (typeof this.jquery()?.fn?.owlCarousel !== 'function')
      await this.loadScript('assets/js/owl.carousel.min.js', 'owl-carousel');
  }

  private loadScript(source: string, key: string): Promise<void> {
    const selector = `script[data-template-plugin="${key}"]`;
    const existing = document.querySelector<HTMLScriptElement>(selector);
    if (existing?.dataset['loaded'] === 'true') return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = existing ?? document.createElement('script');
      const loaded = (): void => { script.dataset['loaded'] = 'true'; resolve(); };
      script.addEventListener('load', loaded, { once: true });
      script.addEventListener('error', () => reject(new Error(`Unable to load ${source}`)), { once: true });
      if (!existing) {
        script.src = source;
        script.async = true;
        script.dataset['templatePlugin'] = key;
        document.body.appendChild(script);
      }
    });
  }

  private showStaticCarousels(): void {
    document.querySelectorAll<HTMLElement>('.owl-carousel')
      .forEach(carousel => carousel.classList.add('owl-loaded'));
  }
}
