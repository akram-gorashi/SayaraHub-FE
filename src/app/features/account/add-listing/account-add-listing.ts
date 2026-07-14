import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CreateCarRequest } from '../../../core/models/car.models';
import { AddListingStore } from './add-listing.store';

@Component({
  selector: 'app-account-add-listing',
  imports: [ReactiveFormsModule],
  templateUrl: './account-add-listing.html',
  styleUrl: './account-add-listing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AddListingStore],
})
export class AccountAddListing {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(AddListingStore);
  protected readonly currentYear = new Date().getFullYear() + 1;
  protected readonly years = Array.from({ length: 50 }, (_, index) => this.currentYear - index);
  protected readonly selectedFeatureIds = signal<number[]>([]);
  protected readonly selectedImages = signal<File[]>([]);
  protected readonly imageNames = computed(() => this.selectedImages().map(({ name }) => name).join(', '));
  protected readonly imageError = signal<string | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    carConditionId: [0, [Validators.required, Validators.min(1)]],
    bodyTypeId: [0, [Validators.required, Validators.min(1)]],
    carBrandId: [0, [Validators.required, Validators.min(1)]],
    carModelId: [0, [Validators.required, Validators.min(1)]],
    price: [0, [Validators.required, Validators.min(1)]],
    year: [this.currentYear, [Validators.required, Validators.min(1886)]],
    transmissionId: [0, [Validators.required, Validators.min(1)]],
    fuelTypeId: [0, [Validators.required, Validators.min(1)]],
    mileage: [0, [Validators.required, Validators.min(0)]],
    engineSize: ['', [Validators.required, Validators.maxLength(50)]],
    cylinders: [4, [Validators.required, Validators.min(0), Validators.max(16)]],
    color: ['', [Validators.required, Validators.maxLength(50)]],
    doors: [4, [Validators.required, Validators.min(1), Validators.max(8)]],
    vin: ['', [Validators.required, Validators.minLength(17), Validators.maxLength(17)]],
    address: ['', [Validators.required, Validators.maxLength(250)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.maxLength(4000)]],
  });

  constructor() { this.store.load(); }

  protected brandChanged(): void {
    this.form.controls.carModelId.setValue(0);
    this.store.loadModels(Number(this.form.controls.carBrandId.value));
  }

  protected toggleFeature(featureId: number, selected: boolean): void {
    this.selectedFeatureIds.update((ids) => selected ? [...ids, featureId] : ids.filter((id) => id !== featureId));
  }

  protected chooseImages(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    if (files.length > 10) { this.imageError.set('Choose no more than 10 images.'); return; }
    if (files.some((file) => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)) {
      this.imageError.set('Each file must be an image no larger than 5 MB.'); return;
    }
    this.imageError.set(files.length ? null : 'Add at least one listing image.');
    this.selectedImages.set(files);
  }

  protected submit(): void {
    if (this.form.invalid || this.selectedImages().length === 0) {
      this.form.markAllAsTouched();
      if (!this.selectedImages().length) this.imageError.set('Add at least one listing image.');
      return;
    }
    const request: CreateCarRequest = {
      ...this.form.getRawValue(), featureIds: this.selectedFeatureIds(), images: this.selectedImages(),
    };
    this.store.create(request);
  }
}
