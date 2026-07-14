import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CarCard } from '../../cars/components/car-card/car-card';
import { AccountCarsStore } from '../data-access/account-cars.store';

@Component({
  selector: 'app-account-favorites', imports: [CarCard], templateUrl: './account-favorites.html',
  styleUrl: './account-favorites.scss', changeDetection: ChangeDetectionStrategy.OnPush, providers: [AccountCarsStore],
})
export class AccountFavorites {
  protected readonly store = inject(AccountCarsStore);
  constructor() { this.store.loadFavorites(); }
}
