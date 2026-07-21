import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Breadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { CarCard } from '../components/car-card/car-card';
import { CarDetailsStore } from './car-details.store';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { CarsService } from '../../../core/services/cars.service';
import { ChatsService } from '../../../core/services/chats.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LocalizedCurrencyPipe, LocalizedDatePipe, LocalizedNumberPipe } from '../../../shared/i18n/localized-value.pipe';

@Component({
  selector: 'app-car-details',
  imports: [Breadcrumb, CarCard, RouterLink, TranslatePipe, LocalizedCurrencyPipe, LocalizedDatePipe, LocalizedNumberPipe],
  templateUrl: './car-details.html',
  styleUrl: './car-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CarDetailsStore],
})
export class CarDetailsPage {
  readonly id = input.required<string>();
  protected readonly store = inject(CarDetailsStore);
  protected readonly reportOpen = signal(false);
  protected readonly reportReason = signal('');
  protected readonly reportDetails = signal('');
  protected readonly specsOpen = signal(false);
  protected readonly overviewOpen = signal(false);
  protected readonly favoriteLoading = signal(false);
  protected readonly messageLoading = signal(false);
  protected readonly actionMessage = signal<string | null>(null);
  private readonly auth = inject(AuthSessionService);
  private readonly cars = inject(CarsService);
  private readonly chats = inject(ChatsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private touchStartX = 0;

  constructor() {
    effect(() => this.store.load(Number(this.id())));
  }

  protected useFallbackImage(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/img/car/01-v2.jpg';
  }

  protected useAvatarFallback(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/img/car/author-v2.jpg';
  }

  protected updateContactField(key: 'name' | 'email' | 'message', event: Event): void {
    const control = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.store.updateContactField(key, control.value);
  }

  protected submitContact(event: Event): void {
    event.preventDefault();
    this.store.sendContact();
  }

  protected submitReport(event: Event): void {
    event.preventDefault();
    this.store.reportListing(this.reportReason(), this.reportDetails());
  }

  protected startSwipe(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? 0;
  }

  protected endSwipe(event: TouchEvent): void {
    const distance = (event.changedTouches[0]?.clientX ?? this.touchStartX) - this.touchStartX;
    if (Math.abs(distance) < 45) return;
    distance < 0 ? this.store.nextImage() : this.store.previousImage();
  }

  protected messageSeller(): void {
    const car = this.store.car();
    if (!car || this.messageLoading()) return;
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: `/cars/${car.id}` } });
      return;
    }
    this.messageLoading.set(true);
    this.chats.create(car.id, { message: this.translate.instant('details.defaultChatMessage', { title: car.title }) }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.messageLoading.set(false)),
    ).subscribe({
      next: response => response.success
        ? void this.router.navigate(['/account/messages'])
        : this.actionMessage.set(response.message || this.translate.instant('details.startConversationFailed')),
      error: () => this.actionMessage.set(this.translate.instant('details.startConversationFailed')),
    });
  }

  protected addFavorite(): void {
    const car = this.store.car();
    if (!car || this.favoriteLoading()) return;
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: `/cars/${car.id}` } });
      return;
    }
    this.favoriteLoading.set(true);
    this.cars.addFavorite(car.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.favoriteLoading.set(false)),
    ).subscribe({
      next: response => this.actionMessage.set(response.message || this.translate.instant('details.addedToFavorites')),
      error: () => this.actionMessage.set(this.translate.instant('details.favoriteUpdateFailed')),
    });
  }

  protected scrollToContact(): void {
    document.querySelector('#seller-contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
