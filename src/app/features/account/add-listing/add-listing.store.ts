import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { CreateCarRequest, UpdateCarRequest } from '../../../core/models/car.models';
import { CarModelMasterData, MasterData } from '../../../core/models/master-data.models';
import { SellerCarDetails } from '../../../core/models/seller-dashboard.models';
import { CarsService } from '../../../core/services/cars.service';
import { MasterDataService } from '../../../core/services/master-data.service';
import { SellerDashboardService } from '../../../core/services/seller-dashboard.service';
import { LocalizedApiErrorService } from '../../../core/services/localized-api-error.service';

@Injectable()
export class AddListingStore {
  private readonly carsService = inject(CarsService);
  private readonly masterDataService = inject(MasterDataService);
  private readonly sellerDashboard = inject(SellerDashboardService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly localizedError = inject(LocalizedApiErrorService);
  private readonly masterDataState = signal<MasterData | null>(null);
  private readonly modelsState = signal<CarModelMasterData[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadingModelsState = signal(false);
  private readonly submittingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly carState = signal<SellerCarDetails | null>(null);
  private readonly uploadProgressState = signal(0);

  readonly loading = this.loadingState.asReadonly();
  readonly loadingModels = this.loadingModelsState.asReadonly();
  readonly submitting = this.submittingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly car = this.carState.asReadonly();
  readonly uploadProgress = this.uploadProgressState.asReadonly();
  readonly models = this.modelsState.asReadonly();
  readonly brands = computed(() => this.masterDataState()?.carBrands.items ?? []);
  readonly bodyTypes = computed(() => this.masterDataState()?.bodyTypes.items ?? []);
  readonly conditions = computed(() => this.masterDataState()?.carConditions.items ?? []);
  readonly fuelTypes = computed(() => this.masterDataState()?.fuelTypes.items ?? []);
  readonly transmissions = computed(() => this.masterDataState()?.transmissions.items ?? []);
  readonly features = computed(() => this.masterDataState()?.features.items ?? []);

  load(carId?: number): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.masterDataService.getAll({ pageNumber: 1, pageSize: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) this.masterDataState.set(response.data);
          else this.errorState.set(response.message);
        },
        error: (error: unknown) => this.errorState.set(this.errorMessage(error, 'Unable to load car options.')),
      });
    if (carId) {
      this.sellerDashboard.getCar(carId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          if (response.success && response.data) this.carState.set(response.data);
          else this.errorState.set(response.message);
        },
        error: (error: unknown) => this.errorState.set(this.errorMessage(error, 'Unable to load the car.')),
      });
    }
  }

  loadModels(carBrandId: number): void {
    this.modelsState.set([]);
    if (!carBrandId) return;
    this.loadingModelsState.set(true);
    this.masterDataService.getCarModelsByBrand(carBrandId, { pageNumber: 1, pageSize: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingModelsState.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) this.modelsState.set(response.data.items);
          else this.errorState.set(response.message);
        },
        error: (error: unknown) => this.errorState.set(this.errorMessage(error, 'Unable to load car models.')),
      });
  }

  create(request: CreateCarRequest, onSuccess?: () => void): void {
    this.submittingState.set(true);
    this.uploadProgressState.set(0);
    this.errorState.set(null);
    this.carsService.create(request, (progress) => this.uploadProgressState.set(progress))
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.submittingState.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) { onSuccess?.(); void this.router.navigate(['/account/listings']); }
          else this.errorState.set(response.message);
        },
        error: (error: unknown) => this.errorState.set(this.errorMessage(error, 'Unable to submit the car.')),
      });
  }

  update(carId: number, request: UpdateCarRequest): void {
    this.submittingState.set(true);
    this.uploadProgressState.set(0);
    this.errorState.set(null);
    this.carsService.update(carId, request, (progress) => this.uploadProgressState.set(progress))
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.submittingState.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) void this.router.navigate(['/account/listings', carId]);
          else this.errorState.set(response.message);
        },
        error: (error: unknown) => this.errorState.set(this.errorMessage(error, 'Unable to update the car.')),
      });
  }

  private errorMessage(error: unknown, fallback: string): string {
    return this.localizedError.message(error, fallback);
  }
}
