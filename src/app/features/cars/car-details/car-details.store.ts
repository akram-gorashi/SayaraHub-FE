import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, finalize } from 'rxjs';

import { CarDetails, CarSummary } from '../../../core/models/car.models';
import { Review } from '../../../core/models/review.models';
import { CarsService } from '../../../core/services/cars.service';
import { ContactMessagesService } from '../../../core/services/contact-messages.service';
import { ReviewsService } from '../../../core/services/reviews.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { UserSafetyService } from '../../../core/services/user-safety.service';

interface ContactFormState {
  name: string;
  email: string;
  message: string;
}

@Injectable()
export class CarDetailsStore {
  private readonly carsService = inject(CarsService);
  private readonly contactMessagesService = inject(ContactMessagesService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly safetyService = inject(UserSafetyService);
  private readonly session = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly carState = signal<CarDetails | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly selectedImageState = signal('');
  private readonly relatedCarsState = signal<CarSummary[]>([]);
  private readonly reviewsState = signal<Review[]>([]);
  private readonly contactFormState = signal<ContactFormState>({ name: '', email: '', message: '' });
  private readonly contactSendingState = signal(false);
  private readonly contactSuccessState = signal<string | null>(null);
  private readonly contactErrorState = signal<string | null>(null);
  private readonly reportSendingState = signal(false);
  private readonly reportSuccessState = signal<string | null>(null);
  private readonly reportErrorState = signal<string | null>(null);
  private request?: Subscription;
  private relatedRequest?: Subscription;
  private reviewsRequest?: Subscription;
  private contactRequest?: Subscription;

  readonly car = this.carState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly selectedImage = this.selectedImageState.asReadonly();
  readonly relatedCars = this.relatedCarsState.asReadonly();
  readonly reviews = this.reviewsState.asReadonly();
  readonly contactForm = this.contactFormState.asReadonly();
  readonly contactSending = this.contactSendingState.asReadonly();
  readonly contactSuccess = this.contactSuccessState.asReadonly();
  readonly contactError = this.contactErrorState.asReadonly();
  readonly reportSending = this.reportSendingState.asReadonly();
  readonly reportSuccess = this.reportSuccessState.asReadonly();
  readonly reportError = this.reportErrorState.asReadonly();
  readonly isAuthenticated = this.session.isAuthenticated;

  load(id: number): void {
    this.request?.unsubscribe();
    this.carState.set(null);
    this.relatedCarsState.set([]);
    this.reviewsState.set([]);
    this.errorState.set(null);

    if (!Number.isInteger(id) || id < 1) {
      this.errorState.set('The requested car ID is invalid.');
      return;
    }

    this.loadingState.set(true);
    this.request = this.carsService
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingState.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.errorState.set(response.message || 'Car not found.');
            return;
          }
          this.carState.set(response.data);
          this.selectedImageState.set(response.data.images[0] || 'assets/img/car/01-v2.jpg');
          this.loadRelated(id);
          this.loadReviews(response.data.seller.id);
        },
        error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
      });
  }

  selectImage(imageUrl: string): void {
    this.selectedImageState.set(imageUrl);
  }

  previousImage(): void {
    this.moveImage(-1);
  }

  nextImage(): void {
    this.moveImage(1);
  }

  updateContactField(key: keyof ContactFormState, value: string): void {
    this.contactFormState.update((form) => ({ ...form, [key]: value }));
  }

  sendContact(): void {
    const car = this.carState();
    const form = this.contactFormState();
    this.contactSuccessState.set(null);
    this.contactErrorState.set(null);

    if (!car || !form.name.trim() || !form.email.trim() || !form.message.trim()) {
      this.contactErrorState.set('Name, email, and message are required.');
      return;
    }

    this.contactRequest?.unsubscribe();
    this.contactSendingState.set(true);
    this.contactRequest = this.contactMessagesService
      .create(car.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: `Inquiry about ${car.title}`,
        message: form.message.trim(),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.contactSendingState.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.contactErrorState.set(response.message || 'Unable to send your message.');
            return;
          }
          this.contactSuccessState.set(response.message || 'Your message was sent to the seller.');
          this.contactFormState.set({ name: '', email: '', message: '' });
        },
        error: (error: unknown) => this.contactErrorState.set(this.errorMessage(error)),
      });
  }

  reportListing(reason: string, details: string): void {
    const car = this.carState();
    if (!car || !reason.trim() || this.reportSendingState()) return;
    this.reportSendingState.set(true);
    this.reportErrorState.set(null);
    this.reportSuccessState.set(null);
    this.safetyService.report({ targetType: 'Car', targetId: car.id, reason: reason.trim(), details: details.trim() || null })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.reportSendingState.set(false)))
      .subscribe({
        next: response => this.reportSuccessState.set(response.message || 'The car ad was reported for review.'),
        error: (error: unknown) => this.reportErrorState.set(this.errorMessage(error)),
      });
  }

  private moveImage(offset: -1 | 1): void {
    const images = this.carState()?.images ?? [];
    if (images.length < 2) {
      return;
    }
    const selectedIndex = Math.max(0, images.indexOf(this.selectedImageState()));
    const nextIndex = (selectedIndex + offset + images.length) % images.length;
    this.selectedImageState.set(images[nextIndex]);
  }

  private loadRelated(id: number): void {
    this.relatedRequest?.unsubscribe();
    this.relatedRequest = this.carsService
      .getRelated(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.relatedCarsState.set(response.data ?? []),
        error: () => this.relatedCarsState.set([]),
      });
  }

  private loadReviews(sellerId: number): void {
    this.reviewsRequest?.unsubscribe();
    this.reviewsRequest = this.reviewsService
      .getBySeller(sellerId, { pageNumber: 1, pageSize: 5 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.reviewsState.set(response.data?.items ?? []),
        error: () => this.reviewsState.set([]),
      });
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        return 'This car is no longer available.';
      }
      return (error.error as { message?: string } | null)?.message || 'Unable to load this car.';
    }
    return 'Something went wrong while loading the car.';
  }
}
