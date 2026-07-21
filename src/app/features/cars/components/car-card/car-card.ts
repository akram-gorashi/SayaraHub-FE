import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CarSummary } from '../../../../core/models/car.models';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { CarsService } from '../../../../core/services/cars.service';
import { CarViewMode } from '../../models/car-view-mode';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedCurrencyPipe, LocalizedDatePipe, LocalizedNumberPipe } from '../../../../shared/i18n/localized-value.pipe';

@Component({
  selector: 'app-car-card',
  imports: [RouterLink, TranslatePipe, LocalizedCurrencyPipe, LocalizedDatePipe, LocalizedNumberPipe],
  templateUrl: './car-card.html',
  styleUrl: './car-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarCard {
  private readonly carsService = inject(CarsService);
  private readonly authSession = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);
  private messageTimer?: ReturnType<typeof setTimeout>;

  readonly car = input.required<CarSummary>();
  readonly viewMode = input<CarViewMode>('grid');
  readonly showActions = input(true);
  protected readonly isFavorite = signal(false);
  protected readonly favoriteLoading = signal(false);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly imageLoaded = signal(false);

  protected useFallbackImage(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/img/car/01-v2.jpg';
    this.imageLoaded.set(true);
  }

  protected markImageLoaded(): void { this.imageLoaded.set(true); }

  protected isNewCondition(): boolean {
    return this.car().condition.trim().toLowerCase() === 'new';
  }

  protected toggleFavorite(event: Event): void {
    event.preventDefault();

    if (this.favoriteLoading()) {
      return;
    }
    if (!this.authSession.isAuthenticated()) {
      this.showMessage('Please log in to use favorites.');
      return;
    }

    this.favoriteLoading.set(true);
    const request = this.isFavorite()
      ? this.carsService.removeFavorite(this.car().id)
      : this.carsService.addFavorite(this.car().id);

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.favoriteLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.showMessage(response.message || 'Unable to update favorites.');
            return;
          }
          this.isFavorite.update((value) => !value);
          this.showMessage(response.message || (this.isFavorite() ? 'Added to favorites.' : 'Removed from favorites.'));
        },
        error: () => this.showMessage('Unable to update favorites.'),
      });
  }

  protected async shareCar(event: Event): Promise<void> {
    event.preventDefault();
    const car = this.car();
    const url = new URL(`/cars/${car.id}`, globalThis.location.href).toString();

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: car.title, text: `${car.brand} ${car.model}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      this.showMessage('Car link copied.');
    } catch (error: unknown) {
      if ((error as DOMException)?.name !== 'AbortError') {
        this.showMessage('Unable to share this car.');
      }
    }
  }

  private showMessage(message: string): void {
    clearTimeout(this.messageTimer);
    this.actionMessage.set(message);
    this.messageTimer = setTimeout(() => this.actionMessage.set(null), 2500);
  }
}
