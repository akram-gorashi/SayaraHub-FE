import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { CreateCarRequest, UpdateCarRequest } from '../../../core/models/car.models';
import { SellerCarImage } from '../../../core/models/seller-dashboard.models';
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
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly store = inject(AddListingStore);
  protected readonly listingId = Number(this.route.snapshot.paramMap.get('id')) || null;
  protected readonly isEditing = this.listingId !== null;
  protected readonly currentYear = new Date().getFullYear();
  protected readonly maxYear = this.currentYear + 1;
  protected readonly years = Array.from({ length: 50 }, (_, index) => this.maxYear - index);
  protected readonly selectedFeatureIds = signal<number[]>([]);
  protected readonly selectedImages = signal<File[]>([]);
  protected readonly imagePreviews = signal<{ file: File; url: string }[]>([]);
  protected readonly existingImages = signal<SellerCarImage[]>([]);
  protected readonly imageError = signal<string | null>(null);
  protected readonly validationErrors = signal<string[]>([]);
  protected readonly submitAttempted = signal(false);
  protected readonly currentStep = signal(1);
  protected readonly stepError = signal<string | null>(null);
  protected readonly mobileSteps = ['Basics', 'Details', 'Photos', 'Finish'];
  protected readonly mainExistingImageId = signal<number | null>(null);
  protected readonly mainNewImage = signal<File | null>(null);
  private readonly initialized = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    carConditionId: [0, [Validators.required, Validators.min(1)]],
    bodyTypeId: [0, [Validators.required, Validators.min(1)]],
    carBrandId: [0, [Validators.required, Validators.min(1)]],
    carModelId: [0, [Validators.required, Validators.min(1)]],
    price: [0, [Validators.required, Validators.min(1)]],
    year: [this.currentYear, [Validators.required, Validators.min(1990), Validators.max(this.maxYear)]],
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

  constructor() {
    this.store.load(this.listingId ?? undefined);
    effect(() => {
      const car = this.store.car();
      if (!car || this.initialized()) return;
      this.form.patchValue({
        title: car.title,
        carConditionId: car.carConditionId,
        bodyTypeId: car.bodyTypeId,
        carBrandId: car.carBrandId,
        carModelId: car.carModelId,
        price: car.price,
        year: car.year,
        transmissionId: car.transmissionId,
        fuelTypeId: car.fuelTypeId,
        mileage: car.mileage,
        engineSize: car.engineSize,
        cylinders: car.cylinders,
        color: car.color,
        doors: car.doors,
        vin: car.vin,
        address: car.address,
        city: car.city,
        description: car.description,
      });
      this.selectedFeatureIds.set(car.featureIds);
      this.existingImages.set(car.imageProcessing);
      this.mainExistingImageId.set(car.imageProcessing.find((image) => image.isMain)?.id ?? car.imageProcessing[0]?.id ?? null);
      this.store.loadModels(car.carBrandId);
      this.initialized.set(true);
    });
    this.form.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.submitAttempted()) this.updateValidationErrors();
    });
    this.destroyRef.onDestroy(() => this.imagePreviews().forEach(({ url }) => URL.revokeObjectURL(url)));
  }

  protected brandChanged(): void {
    this.form.controls.carModelId.setValue(0);
    this.store.loadModels(Number(this.form.controls.carBrandId.value));
  }

  protected nextStep(): void {
    const controls = this.stepControls(this.currentStep());
    controls.forEach(name => this.form.controls[name].markAsTouched());
    if (controls.some(name => this.form.controls[name].invalid)) {
      this.stepError.set('Please complete the required fields before continuing.');
      this.focusFirstInvalid();
      return;
    }
    if (this.currentStep() === 3 && this.existingImages().length + this.selectedImages().length === 0) {
      this.imageError.set('Add at least one car photo.');
      this.stepError.set('Add at least one photo before continuing.');
      this.elementRef.nativeElement.querySelector<HTMLElement>('#listing-images')?.focus();
      return;
    }
    this.stepError.set(null);
    this.currentStep.update(step => Math.min(4, step + 1));
    this.scrollToWizardTop();
  }

  protected previousStep(): void {
    this.stepError.set(null);
    this.currentStep.update(step => Math.max(1, step - 1));
    this.scrollToWizardTop();
  }

  protected toggleFeature(featureId: number, selected: boolean): void {
    this.selectedFeatureIds.update((ids) => selected ? [...ids, featureId] : ids.filter((id) => id !== featureId));
  }

  protected chooseImages(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    if (this.existingImages().length + files.length > 10) { this.imageError.set('Choose no more than 10 images in total.'); return; }
    if (files.some((file) => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)) {
      this.imageError.set('Each file must be an image no larger than 5 MB.'); return;
    }
    this.imageError.set(files.length ? null : 'Add at least one car photo.');
    this.imagePreviews().forEach(({ url }) => URL.revokeObjectURL(url));
    this.selectedImages.set(files);
    this.imagePreviews.set(files.map((file) => ({ file, url: URL.createObjectURL(file) })));
    if (!this.mainExistingImageId() && files.length) this.mainNewImage.set(files[0]);
    if (this.submitAttempted()) this.updateValidationErrors();
  }

  protected removeExistingImage(imageId: number): void {
    this.existingImages.update((images) => images.filter((image) => image.id !== imageId));
    if (this.mainExistingImageId() === imageId) {
      this.mainExistingImageId.set(this.existingImages()[0]?.id ?? null);
      if (!this.mainExistingImageId()) this.mainNewImage.set(this.selectedImages()[0] ?? null);
    }
    if (this.submitAttempted()) this.updateValidationErrors();
  }

  protected removeNewImage(file: File): void {
    const preview = this.imagePreviews().find((item) => item.file === file);
    if (preview) URL.revokeObjectURL(preview.url);
    this.imagePreviews.update((previews) => previews.filter((item) => item.file !== file));
    this.selectedImages.update((images) => images.filter((image) => image !== file));
    if (this.mainNewImage() === file) {
      this.mainNewImage.set(this.selectedImages()[0] ?? null);
      if (!this.mainNewImage()) this.mainExistingImageId.set(this.existingImages()[0]?.id ?? null);
    }
    if (this.submitAttempted()) this.updateValidationErrors();
  }

  protected setMainExisting(imageId: number): void {
    this.mainExistingImageId.set(imageId);
    this.mainNewImage.set(null);
  }

  protected setMainNew(file: File): void {
    this.mainNewImage.set(file);
    this.mainExistingImageId.set(null);
  }

  protected moveExisting(index: number, offset: -1 | 1): void {
    this.existingImages.update((images) => this.move(images, index, offset));
  }

  protected moveNew(index: number, offset: -1 | 1): void {
    this.imagePreviews.update((previews) => this.move(previews, index, offset));
    this.selectedImages.set(this.imagePreviews().map((preview) => preview.file));
  }

  protected submit(): void {
    this.submitAttempted.set(true);
    if (this.form.invalid || this.existingImages().length + this.selectedImages().length === 0) {
      this.form.markAllAsTouched();
      if (this.existingImages().length + this.selectedImages().length === 0) this.imageError.set('Add at least one car photo.');
      this.updateValidationErrors();
      queueMicrotask(() => {
        const firstInvalid = this.elementRef.nativeElement.querySelector<HTMLElement>('.form-control.ng-invalid, #listing-images');
        firstInvalid?.focus();
        firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    this.validationErrors.set([]);
    const request: CreateCarRequest = {
      ...this.form.getRawValue(), featureIds: this.selectedFeatureIds(), images: this.selectedImages(),
      mainImageIndex: Math.max(0, this.selectedImages().indexOf(this.mainNewImage() ?? this.selectedImages()[0])),
    };
    if (this.listingId) {
      const updateRequest: UpdateCarRequest = {
        ...request,
        existingImageIds: this.existingImages().map((image) => image.id),
        imageOrder: [
          ...this.existingImages().map((image) => `existing:${image.id}`),
          ...this.selectedImages().map((_, index) => `new:${index}`),
        ],
        mainImageKey: this.mainExistingImageId()
          ? `existing:${this.mainExistingImageId()}`
          : `new:${Math.max(0, this.selectedImages().indexOf(this.mainNewImage() ?? this.selectedImages()[0]))}`,
      };
      this.store.update(this.listingId, updateRequest);
    } else {
      this.store.create(request);
    }
  }

  private move<T>(items: T[], index: number, offset: -1 | 1): T[] {
    const target = index + offset;
    if (target < 0 || target >= items.length) return items;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    return reordered;
  }

  private updateValidationErrors(): void {
    const labels: Record<string, string> = {
      title: 'Car ad title', carConditionId: 'Condition', bodyTypeId: 'Body type',
      carBrandId: 'Make/brand', carModelId: 'Model', price: 'Price', year: 'Year',
      transmissionId: 'Transmission', fuelTypeId: 'Fuel type', mileage: 'Mileage',
      engineSize: 'Engine size', cylinders: 'Cylinders', color: 'Color', doors: 'Doors',
      vin: 'VIN', address: 'Address', city: 'City', description: 'Description',
    };
    const errors = Object.entries(this.form.controls)
      .filter(([, control]) => control.invalid)
      .map(([name, control]) => {
        const label = labels[name] ?? name;
        if (control.hasError('required')) return `${label} is required.`;
        if (name === 'vin') return 'VIN must contain exactly 17 characters.';
        if (control.hasError('min')) return `${label} must be greater than the minimum allowed value.`;
        if (control.hasError('max')) return `${label} exceeds the maximum allowed value.`;
        return `${label} is invalid.`;
      });
    if (this.existingImages().length + this.selectedImages().length === 0) {
      errors.push('At least one car photo is required.');
    }
    this.validationErrors.set(errors);
  }

  private stepControls(step: number): Array<keyof typeof this.form.controls> {
    if (step === 1) return ['title', 'carConditionId', 'bodyTypeId', 'carBrandId', 'carModelId', 'price', 'year', 'transmissionId', 'fuelTypeId'];
    if (step === 2) return ['mileage', 'engineSize', 'cylinders', 'color', 'doors', 'vin'];
    if (step === 4) return ['address', 'city', 'description'];
    return [];
  }

  private focusFirstInvalid(): void {
    queueMicrotask(() => {
      const firstInvalid = this.elementRef.nativeElement.querySelector<HTMLElement>(`.mobile-step-${this.currentStep()} .form-control.ng-invalid`);
      firstInvalid?.focus();
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private scrollToWizardTop(): void {
    queueMicrotask(() => this.elementRef.nativeElement.querySelector<HTMLElement>('.mobile-listing-stepper')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
}
