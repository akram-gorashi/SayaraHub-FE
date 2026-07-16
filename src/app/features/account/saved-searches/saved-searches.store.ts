import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { CarModelMasterData, MasterDataItem } from '../../../core/models/master-data.models';
import { SavedSearch, SavedSearchRequest } from '../../../core/models/saved-search.models';
import { MasterDataService } from '../../../core/services/master-data.service';
import { SavedSearchService } from '../../../core/services/saved-search.service';

@Injectable()
export class SavedSearchesStore {
  private readonly service = inject(SavedSearchService);
  private readonly masterData = inject(MasterDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchesState = signal<SavedSearch[]>([]);
  private readonly brandsState = signal<MasterDataItem[]>([]);
  private readonly modelsState = signal<CarModelMasterData[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly processingState = signal<number | null>(null);
  private readonly errorState = signal<string | null>(null);
  private readonly successState = signal<string | null>(null);

  readonly searches = this.searchesState.asReadonly();
  readonly brands = this.brandsState.asReadonly();
  readonly models = this.modelsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly processing = this.processingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();

  load(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.service.getAll().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: response => response.success && response.data
        ? this.searchesState.set(response.data)
        : this.errorState.set(response.message),
      error: error => this.errorState.set(this.errorMessage(error)),
    });
    this.masterData.getCarBrands({ pageSize: 100 }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({ next: response => this.brandsState.set(response.data?.items ?? []) });
  }

  loadModels(brandId: number | null): void {
    this.modelsState.set([]);
    if (!brandId) return;
    this.masterData.getCarModelsByBrand(brandId, { pageSize: 100 }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({ next: response => this.modelsState.set(response.data?.items ?? []) });
  }

  save(id: number | null, request: SavedSearchRequest, completed: () => void): void {
    this.savingState.set(true);
    this.clearMessages();
    const operation = id ? this.service.update(id, request) : this.service.create(request);
    operation.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.savingState.set(false)),
    ).subscribe({
      next: response => {
        if (!response.success || !response.data) {
          this.errorState.set(response.message);
          return;
        }
        this.searchesState.update(items => id
          ? items.map(item => item.id === id ? response.data! : item)
          : [response.data!, ...items]);
        this.successState.set(response.message);
        completed();
      },
      error: error => this.errorState.set(this.errorMessage(error)),
    });
  }

  toggle(search: SavedSearch): void {
    this.save(search.id, { ...search, isEnabled: !search.isEnabled }, () => undefined);
  }

  delete(search: SavedSearch): void {
    this.processingState.set(search.id);
    this.clearMessages();
    this.service.delete(search.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.processingState.set(null)),
    ).subscribe({
      next: response => {
        if (!response.success) {
          this.errorState.set(response.message);
          return;
        }
        this.searchesState.update(items => items.filter(item => item.id !== search.id));
        this.successState.set(response.message);
      },
      error: error => this.errorState.set(this.errorMessage(error)),
    });
  }

  private clearMessages(): void {
    this.errorState.set(null);
    this.successState.set(null);
  }

  private errorMessage(error: unknown): string {
    return error instanceof HttpErrorResponse
      ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || 'Unable to manage saved searches.'
      : 'Unable to manage saved searches.';
  }
}
