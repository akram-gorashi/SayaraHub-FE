import {
  afterNextRender,
  Injectable,
} from '@angular/core';

declare const WOW: any;

@Injectable({
  providedIn: 'root',
})
export class TemplatePluginsService {
  initializeGlobalPlugins(): void {
    afterNextRender(() => {
      this.initializeWow();
      this.initializeNiceSelect();
      this.initializeTooltips();
    });
  }

  initializeHomePlugins(): void {
    afterNextRender(() => {
      void this.loadHomeDependencies().then(() => {
        this.initializeHeroSlider();
        this.initializeCarousels();
        this.initializeCounters();
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

  private initializeWow(): void {
    if (typeof WOW !== 'undefined') {
      new WOW().init();
    }
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
        autoplay: true,
        autoplayTimeout: 5000,
        nav: true,
        dots: true,
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
          margin: 20,
          nav: true,
          dots: true,
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
    const jquery = this.jquery();
    if (!jquery) {
      return;
    }

    const counters = jquery('.counter');

    if (
      counters.length &&
      typeof counters.counterUp === 'function'
    ) {
      counters.counterUp({
        delay: 10,
        time: 1000,
      });
    }
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
