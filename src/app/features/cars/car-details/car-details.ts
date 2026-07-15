import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Breadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { CarCard } from '../components/car-card/car-card';
import { CarDetailsStore } from './car-details.store';

@Component({
  selector: 'app-car-details',
  imports: [Breadcrumb, CarCard, CurrencyPipe, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './car-details.html',
  styleUrl: './car-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CarDetailsStore],
})
export class CarDetailsPage {
  readonly id = input.required<string>();
  protected readonly store = inject(CarDetailsStore);

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
}
