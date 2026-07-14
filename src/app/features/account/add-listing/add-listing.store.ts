import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { CreateCarRequest } from '../../../core/models/car.models';
import { CarModelMasterData, MasterData } from '../../../core/models/master-data.models';
import { CarsService } from '../../../core/services/cars.service';
import { MasterDataService } from '../../../core/services/master-data.service';

@Injectable()
export class AddListingStore {
  private readonly carsService = inject(CarsService);
  private readonly masterDataService = inject(MasterDataService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly masterDataState = signal<MasterData | null>(null);
  private readonly modelsState = signal<CarModelMasterData[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadingModelsState = signal(false);
  private readonly submittingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly loading = this.loadingState.asReadonly();
  readonly loadingModels = this.loadingModelsState.asReadonly();
  readonly submitting = this.submittingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly models = this.modelsState.asReadonly();
  readonly brands = computed(() => this.masterDataState()?.carBrands.items ?? []);
  readonly bodyTypes = computed(() => this.masterDataState()?.bodyTypes.items ?? []);
  readonly conditions = computed(() => this.masterDataState()?.carConditions.items ?? []);
  readonly fuelTypes = computed(() => this.masterDataState()?.fuelTypes.items ?? []);
  readonly transmissions = computed(() => this.masterDataState()?.transmissions.items ?? []);
  readonly features = computed(() => this.masterDataState()?.features.items ?? []);

  load(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.masterDataService.getAll({ pageNumber: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) this.masterDataState.set(response.data);
          else this.errorState.set(response.message);
        },
        error: (error: unknown) => this.errorState.set(this.errorMessage(error, 'Unable to load listing options.')),
      });
  }

  loadModels(carBrandId: number): void {
    this.modelsState.set([]);
    if (!carBrandId) return;
    this.loadingModelsState.set(true);
    this.masterDataService.getCarModelsByBrand(carBrandId, { pageNumber: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingModelsState.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) this.modelsState.set(response.data.items);
          else this.errorState.set(response.message);
        },
        error: (error: unknown) => this.errorState.set(this.errorMessage(error, 'Unable to load car models.')),
      });
  }

  create(request: CreateCarRequest): void {
    this.submittingState.set(true);
    this.errorState.set(null);
    this.carsService.create(request)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.submittingState.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) void this.router.navigate(['/account/listings']);
          else this.errorState.set(response.message);
        },
        error: (error: unknown) => this.errorState.set(this.errorMessage(error, 'Unable to create the listing.')),
      });
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse
      ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || fallback
      : fallback;
  }
}
