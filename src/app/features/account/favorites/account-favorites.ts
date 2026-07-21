import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CarCard } from '../../cars/components/car-card/car-card';
import { AccountCarsStore } from '../data-access/account-cars.store';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-account-favorites', imports: [CarCard, TranslatePipe], templateUrl: './account-favorites.html',
  styleUrl: './account-favorites.scss', changeDetection: ChangeDetectionStrategy.OnPush, providers: [AccountCarsStore],
})
export class AccountFavorites {
  protected readonly store = inject(AccountCarsStore);
  constructor() { this.store.loadFavorites(); }
}
