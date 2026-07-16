import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, of } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { CarSummary } from '../../../core/models/car.models';
import { Review, SaveReviewRequest } from '../../../core/models/review.models';
import { PublicUserProfile } from '../../../core/models/user.models';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { CarsService } from '../../../core/services/cars.service';
import { ReviewsService } from '../../../core/services/reviews.service';
import { UserSafetyService } from '../../../core/services/user-safety.service';
import { UsersService } from '../../../core/services/users.service';

@Injectable()
export class SellerProfileStore {
  private readonly users = inject(UsersService);
  private readonly cars = inject(CarsService);
  private readonly reviewsApi = inject(ReviewsService);
  private readonly safety = inject(UserSafetyService);
  private readonly session = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly profileState = signal<PublicUserProfile | null>(null);
  private readonly listingsState = signal<CarSummary[]>([]);
  private readonly reviewsState = signal<Review[]>([]);
  private readonly myReviewState = signal<Review | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly blockedState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly successState = signal<string | null>(null);

  readonly profile = this.profileState.asReadonly();
  readonly listings = this.listingsState.asReadonly();
  readonly reviews = this.reviewsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly blocked = this.blockedState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();
  readonly isAuthenticated = this.session.isAuthenticated;
  readonly isOwnProfile = computed(() => this.session.userId() === this.profileState()?.id);
  readonly myReview = this.myReviewState.asReadonly();

  load(sellerId: number): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    forkJoin({
      profile: this.users.getPublicProfile(sellerId),
      listings: this.cars.getBySeller(sellerId, { pageNumber: 1, pageSize: 12, sortBy: 'listedDate', sortDirection: 'desc' }),
      reviews: this.reviewsApi.getBySeller(sellerId, { pageNumber: 1, pageSize: 50 }),
      mine: this.session.isAuthenticated() && this.session.userId() !== sellerId
        ? this.reviewsApi.getMine(sellerId)
        : of(null),
      blocked: this.session.isAuthenticated()
        ? this.safety.getBlocked({ pageNumber: 1, pageSize: 100 })
        : of(null),
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingState.set(false))).subscribe({
      next: ({ profile, listings, reviews, mine, blocked }) => {
        this.profileState.set(profile.data ?? null);
        this.listingsState.set(listings.data?.items ?? []);
        this.reviewsState.set(reviews.data?.items ?? []);
        this.myReviewState.set(mine?.data ?? null);
        this.blockedState.set(blocked?.data?.items.some(user => user.userId === sellerId) ?? false);
      },
      error: error => this.errorState.set(this.message(error, 'Unable to load this seller.')),
    });
  }

  saveReview(request: SaveReviewRequest): void {
    const sellerId = this.profileState()?.id;
    if (!sellerId) return;
    this.savingState.set(true);
    this.errorState.set(null);
    this.successState.set(null);
    const current = this.myReview();
    const operation = current
      ? this.reviewsApi.update(current.id, request)
      : this.reviewsApi.create(sellerId, request);
    operation.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.savingState.set(false))).subscribe({
      next: response => {
        if (response.data) {
          this.myReviewState.set(response.data);
          this.reviewsState.update(items => response.data!.status === 'Approved'
            ? [response.data!, ...items.filter(item => item.id !== response.data!.id)]
            : items.filter(item => item.id !== response.data!.id));
          this.successState.set(current ? 'Review updated and sent for moderation.' : 'Review sent for moderation.');
        }
      },
      error: error => this.errorState.set(this.message(error, 'Unable to save your review.')),
    });
  }

  deleteReview(): void {
    const review = this.myReview();
    if (!review) return;
    this.reviewsApi.delete(review.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.myReviewState.set(null); this.reviewsState.update(items => items.filter(item => item.id !== review.id)); this.successState.set('Review deleted.'); },
      error: error => this.errorState.set(this.message(error, 'Unable to delete your review.')),
    });
  }

  toggleBlock(): void {
    const sellerId = this.profileState()?.id;
    if (!sellerId) return;
    if (this.blockedState()) {
      this.safety.unblock(sellerId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => { this.blockedState.set(false); this.successState.set('Seller unblocked.'); },
        error: (error: unknown) => this.errorState.set(this.message(error, 'Unable to unblock this seller.')),
      });
      return;
    }
    this.safety.block(sellerId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.blockedState.set(true); this.successState.set('Seller blocked.'); },
      error: (error: unknown) => this.errorState.set(this.message(error, 'Unable to block this seller.')),
    });
  }

  report(reason: string, details: string): void {
    const sellerId = this.profileState()?.id;
    if (!sellerId) return;
    this.safety.report({ targetType: 'User', targetId: sellerId, reason, details: details || null })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.successState.set('Report submitted for administrator review.'),
        error: error => this.errorState.set(this.message(error, 'Unable to submit the report.')),
      });
  }

  reportReview(reviewId: number): void {
    this.safety.report({ targetType: 'Review', targetId: reviewId, reason: 'Inappropriate or misleading review' })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.successState.set('Review reported for administrator review.'),
        error: error => this.errorState.set(this.message(error, 'Unable to report this review.')),
      });
  }

  private message(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse
      ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || fallback
      : fallback;
  }
}
