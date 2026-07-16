import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SavedSearch, SavedSearchRequest } from '../../../core/models/saved-search.models';
import { SavedSearchesStore } from './saved-searches.store';

@Component({
  selector: 'app-account-saved-searches',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './account-saved-searches.html',
  styleUrl: './account-saved-searches.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SavedSearchesStore],
})
export class AccountSavedSearches {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(SavedSearchesStore);
  protected readonly editingId = signal<number | null>(null);
  protected readonly deleting = signal<SavedSearch | null>(null);
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    carBrandId: [null as number | null],
    carModelId: [null as number | null],
    minPrice: [null as number | null, Validators.min(0)],
    maxPrice: [null as number | null, Validators.min(0)],
    city: ['', Validators.maxLength(100)],
    notifyNewListings: this.fb.control(true, { nonNullable: true }),
    notifyPriceDrops: this.fb.control(true, { nonNullable: true }),
    notifySold: this.fb.control(true, { nonNullable: true }),
    isEnabled: this.fb.control(true, { nonNullable: true }),
  });

  constructor() {
    this.store.load();
    this.form.controls.carBrandId.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(brandId => {
      this.form.controls.carModelId.setValue(null, { emitEvent: false });
      this.store.loadModels(brandId);
    });
  }

  protected edit(search: SavedSearch): void {
    this.editingId.set(search.id);
    this.store.loadModels(search.carBrandId);
    this.form.setValue({
      name: search.name,
      carBrandId: search.carBrandId,
      carModelId: search.carModelId,
      minPrice: search.minPrice,
      maxPrice: search.maxPrice,
      city: search.city ?? '',
      notifyNewListings: search.notifyNewListings,
      notifyPriceDrops: search.notifyPriceDrops,
      notifySold: search.notifySold,
      isEnabled: search.isEnabled,
    }, { emitEvent: false });
    globalThis.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (value.minPrice !== null && value.maxPrice !== null && value.minPrice > value.maxPrice) {
      this.form.controls.maxPrice.setErrors({ range: true });
      return;
    }
    const request: SavedSearchRequest = {
      ...value,
      name: value.name!.trim(),
      city: value.city?.trim() || null,
    };
    this.store.save(this.editingId(), request, () => this.reset());
  }

  protected reset(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      carBrandId: null,
      carModelId: null,
      minPrice: null,
      maxPrice: null,
      city: '',
      notifyNewListings: true,
      notifyPriceDrops: true,
      notifySold: true,
      isEnabled: true,
    });
    this.store.loadModels(null);
  }

  protected browseParams(search: SavedSearch): Record<string, string | number | null> {
    return {
      brandIds: search.carBrandId,
      modelIds: search.carModelId,
      minPrice: search.minPrice,
      maxPrice: search.maxPrice,
      city: search.city,
    };
  }

  protected confirmDelete(): void {
    const search = this.deleting();
    this.deleting.set(null);
    if (search) this.store.delete(search);
  }
}
