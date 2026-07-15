import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ListingDetailsStore } from './listing-details.store';

@Component({
  selector: 'app-account-listing-details',
  imports: [CurrencyPipe, DatePipe, RouterLink, TitleCasePipe],
  templateUrl: './account-listing-details.html',
  styleUrl: './account-listing-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ListingDetailsStore],
})
export class AccountListingDetails {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(ListingDetailsStore);
  protected readonly carId = Number(this.route.snapshot.paramMap.get('id'));

  constructor() { this.store.load(this.carId); }
}
