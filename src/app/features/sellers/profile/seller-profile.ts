import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Breadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { CarCard } from '../../cars/components/car-card/car-card';
import { SellerProfileStore } from './seller-profile.store';

@Component({
  selector: 'app-seller-profile',
  imports: [Breadcrumb, CarCard, DatePipe, FormsModule],
  templateUrl: './seller-profile.html',
  styleUrl: './seller-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SellerProfileStore],
})
export class SellerProfilePage {
  readonly id = input.required<string>();
  protected readonly store = inject(SellerProfileStore);
  protected readonly rating = signal(5);
  protected readonly comment = signal('');
  protected readonly reportReason = signal('Misleading profile or listings');
  protected readonly reportDetails = signal('');
  protected readonly reportOpen = signal(false);

  constructor() {
    effect(() => this.store.load(Number(this.id())));
    effect(() => {
      const review = this.store.myReview();
      this.rating.set(review?.rating ?? 5);
      this.comment.set(review?.comment ?? '');
    });
  }

  protected saveReview(): void {
    if (this.comment().trim().length >= 5) this.store.saveReview({ rating: this.rating(), comment: this.comment().trim() });
  }

  protected deleteReview(): void {
    if (globalThis.confirm?.('Delete your review?')) this.store.deleteReview();
  }

  protected submitReport(): void {
    if (!this.reportReason().trim()) return;
    this.store.report(this.reportReason().trim(), this.reportDetails().trim());
    this.reportOpen.set(false);
  }
}
