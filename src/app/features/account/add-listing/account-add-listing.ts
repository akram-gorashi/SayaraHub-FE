import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import imageCompression from 'browser-image-compression';

import { CreateCarRequest, UpdateCarRequest } from '../../../core/models/car.models';
import { SellerCarImage } from '../../../core/models/seller-dashboard.models';
import { AddListingStore } from './add-listing.store';
import { AuthSessionService } from '../../../core/services/auth-session.service';

type ImagePreviewStatus = 'processing' | 'ready' | 'failed';
type ImagePreview = { file: File; url: string; status: ImagePreviewStatus; originalSize: number; optimizedSize: number; error?: string };

@Component({
  selector: 'app-account-add-listing',
  imports: [ReactiveFormsModule, CdkDropList, CdkDrag, TranslatePipe, DecimalPipe],
  templateUrl: './account-add-listing.html',
  styleUrl: './account-add-listing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AddListingStore],
  host: { '(window:beforeunload)': 'preventUnsavedExit($event)' },
})
export class AccountAddListing {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly translate = inject(TranslateService);
  private readonly session = inject(AuthSessionService);
  protected readonly store = inject(AddListingStore);
  protected readonly listingId = Number(this.route.snapshot.paramMap.get('id')) || null;
  protected readonly isEditing = this.listingId !== null;
  protected readonly currentYear = new Date().getFullYear();
  protected readonly maxYear = this.currentYear + 1;
  protected readonly years = Array.from({ length: 50 }, (_, index) => this.maxYear - index);
  protected readonly selectedFeatureIds = signal<number[]>([]);
  protected readonly selectedImages = signal<File[]>([]);
  protected readonly imagePreviews = signal<ImagePreview[]>([]);
  protected readonly existingImages = signal<SellerCarImage[]>([]);
  protected readonly imageError = signal<string | null>(null);
  protected readonly optimizingImages = signal(false);
  protected readonly validationErrors = signal<string[]>([]);
  protected readonly submitAttempted = signal(false);
  protected readonly currentStep = signal(1);
  protected readonly stepError = signal<string | null>(null);
  protected readonly mobileSteps = ['listing.steps.basics', 'listing.steps.details', 'listing.steps.photos', 'listing.steps.finish'];
  protected readonly draftRestored = signal(false);
  protected readonly draftSaved = signal(false);
  protected readonly draftPromptOpen = signal(false);
  protected readonly mainExistingImageId = signal<number | null>(null);
  protected readonly mainNewImage = signal<File | null>(null);
  private readonly initialized = signal(false);
  private submissionCompleted = false;
  private lastSavedDraftPayload = '';
  private pendingDraftDecision: ((allow: boolean) => void) | null = null;
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
    if (!this.isEditing) this.restoreDraft();
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
      this.stepError.set(this.translate.instant('validation.completeStep'));
      this.focusFirstInvalid();
      return;
    }
    if (this.currentStep() === 3 && this.existingImages().length + this.selectedImages().length === 0) {
      this.imageError.set(this.translate.instant('validation.photoRequired'));
      this.stepError.set(this.translate.instant('validation.photoRequired'));
      this.elementRef.nativeElement.querySelector<HTMLElement>('#listing-images')?.focus();
      return;
    }
    this.stepError.set(null);
    this.currentStep.update(step => Math.min(4, step + 1));
    this.form.markAsDirty();
    this.scrollToWizardTop();
  }

  protected previousStep(): void {
    this.stepError.set(null);
    this.currentStep.update(step => Math.max(1, step - 1));
    this.form.markAsDirty();
    this.scrollToWizardTop();
  }

  protected toggleFeature(featureId: number, selected: boolean): void {
    this.selectedFeatureIds.update((ids) => selected ? [...ids, featureId] : ids.filter((id) => id !== featureId));
    this.form.markAsDirty();
  }

  protected async chooseImages(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const remaining = 10 - this.existingImages().length - this.selectedImages().length;
    if (files.length > remaining) { this.imageError.set(this.translate.instant('validation.maxImages', { count: remaining })); input.value = ''; return; }
    if (files.some(file => !file.type.startsWith('image/'))) { this.imageError.set(this.translate.instant('validation.imagesOnly')); input.value = ''; return; }
    if (!files.length) return;
    this.optimizingImages.set(true);
    this.imageError.set(null);
    try {
      const optimized = await Promise.all(files.map(file => imageCompression(file, {
        maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true,
        fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
      }).then(optimizedFile => ({ original: file, optimized: this.normalizeImageFile(file, optimizedFile) }))));
      const optimizedFiles = optimized.map(item => item.optimized);
      this.selectedImages.update(images => [...images, ...optimizedFiles]);
      this.imagePreviews.update(previews => [...previews, ...optimized.map(item => ({
        file: item.optimized,
        url: URL.createObjectURL(item.optimized),
        status: 'ready' as const,
        originalSize: item.original.size,
        optimizedSize: item.optimized.size,
      }))]);
      if (!this.mainExistingImageId() && !this.mainNewImage()) this.mainNewImage.set(optimizedFiles[0]);
      this.form.markAsDirty();
      if (this.submitAttempted()) this.updateValidationErrors();
    } catch {
      this.imageError.set(this.translate.instant('validation.photoProcessing'));
    } finally {
      this.optimizingImages.set(false);
      input.value = '';
    }
  }

  protected dropExisting(event: CdkDragDrop<SellerCarImage[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.existingImages.update(images => { const reordered = [...images]; moveItemInArray(reordered, event.previousIndex, event.currentIndex); return reordered; });
    this.form.markAsDirty();
  }

  protected dropNew(event: CdkDragDrop<ImagePreview[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.imagePreviews.update(previews => { const reordered = [...previews]; moveItemInArray(reordered, event.previousIndex, event.currentIndex); return reordered; });
    this.selectedImages.set(this.imagePreviews().map(preview => preview.file));
    this.form.markAsDirty();
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
      if (this.existingImages().length + this.selectedImages().length === 0) this.imageError.set(this.translate.instant('validation.photoRequired'));
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
      this.store.update(this.listingId, updateRequest, () => this.finishSuccessfulSubmit());
    } else {
      this.store.create(request, () => this.finishSuccessfulSubmit());
    }
  }

  protected discardDraft(): void {
    this.clearDraft();
    this.form.reset();
    this.selectedFeatureIds.set([]);
    this.currentStep.set(1);
    this.draftRestored.set(false);
    this.form.markAsPristine();
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (!this.hasUnsavedChanges()) return true;
    this.draftPromptOpen.set(true);
    return new Promise<boolean>(resolve => {
      this.pendingDraftDecision = resolve;
    });
  }

  protected preventUnsavedExit(event: BeforeUnloadEvent): void {
    if (!this.hasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = '';
  }

  protected saveDraftAndLeave(): void {
    this.persistDraft();
    this.resolveDraftDecision(true);
  }

  protected discardAndLeave(): void {
    this.clearDraft();
    this.resolveDraftDecision(true);
  }

  protected keepEditing(): void {
    this.resolveDraftDecision(false);
  }

  private move<T>(items: T[], index: number, offset: -1 | 1): T[] {
    const target = index + offset;
    if (target < 0 || target >= items.length) return items;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    return reordered;
  }

  private updateValidationErrors(): void {
    const errors = Object.entries(this.form.controls)
      .filter(([, control]) => control.invalid)
      .map(([name, control]) => this.controlError(name, control));
    if (this.existingImages().length + this.selectedImages().length === 0) {
      errors.push(this.translate.instant('validation.photoRequired'));
    }
    this.validationErrors.set(errors);
  }

  private stepControls(step: number): Array<keyof typeof this.form.controls> {
    if (step === 1) return ['title', 'carConditionId', 'bodyTypeId', 'carBrandId', 'carModelId', 'price', 'year', 'transmissionId', 'fuelTypeId'];
    if (step === 2) return ['mileage', 'engineSize', 'cylinders', 'color', 'doors', 'vin'];
    if (step === 4) return ['address', 'city', 'description'];
    return [];
  }

  protected fieldError(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    if (!control || !control.invalid || (!control.touched && !this.submitAttempted())) return null;
    return this.controlError(name, control);
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

  private persistDraft(): void {
    if (this.isEditing || !this.form.dirty) return;
    const draft = {
      form: this.form.getRawValue(),
      featureIds: this.selectedFeatureIds(),
      step: this.currentStep(),
      updatedAt: new Date().toISOString(),
    };
    const payload = JSON.stringify(draft);
    if (payload === this.lastSavedDraftPayload) return;
    try {
      localStorage.setItem(this.draftKey(), payload);
      this.lastSavedDraftPayload = payload;
      this.draftSaved.set(true);
      this.form.markAsPristine();
      setTimeout(() => this.draftSaved.set(false), 1800);
    } catch { /* Draft saving is a convenience; form submission still works. */ }
    if (this.session.session()) {
      this.store.saveDraft(payload, this.currentStep());
    }
  }

  private restoreDraft(): void {
    try {
      const raw = localStorage.getItem(this.draftKey());
      if (raw) this.applyDraft(raw);
    } catch { this.clearDraft(); }
    if (this.session.session()) {
      this.store.loadDraft((payload) => this.applyDraft(payload));
    }
  }

  private clearDraft(): void {
    try { localStorage.removeItem(this.draftKey()); } catch { /* Ignore unavailable storage. */ }
    this.lastSavedDraftPayload = '';
    if (this.session.session()) this.store.deleteDraft();
  }

  private finishSuccessfulSubmit(): void {
    this.submissionCompleted = true;
    this.clearDraft();
    this.form.markAsPristine();
    this.selectedImages.set([]);
    this.imagePreviews().forEach(({ url }) => URL.revokeObjectURL(url));
    this.imagePreviews.set([]);
    this.mainNewImage.set(null);
    this.optimizingImages.set(false);
    this.draftPromptOpen.set(false);
  }

  private applyDraft(raw: string): void {
    const draft = JSON.parse(raw) as { form?: Partial<Omit<CreateCarRequest, 'images' | 'featureIds' | 'mainImageIndex'>>; featureIds?: number[]; step?: number };
    if (!draft.form) return;
    this.form.patchValue(draft.form);
    this.selectedFeatureIds.set(draft.featureIds ?? []);
    this.currentStep.set(Math.min(4, Math.max(1, draft.step ?? 1)));
    if (draft.form.carBrandId) this.store.loadModels(Number(draft.form.carBrandId));
    this.draftRestored.set(true);
    this.form.markAsPristine();
    this.lastSavedDraftPayload = raw;
  }

  private draftKey(): string {
    const user = this.session.session()?.email?.trim().toLowerCase() || 'guest';
    return `sayaraMatch.carDraft.${user}`;
  }

  private hasUnsavedChanges(): boolean {
    if (this.submissionCompleted) return false;
    return this.form.dirty || this.selectedImages().length > 0 || this.optimizingImages();
  }

  private controlError(name: string, control: { hasError(errorCode: string): boolean }): string {
    const labels: Record<string, string> = {
      title: 'listing.title', carConditionId: 'listing.condition', bodyTypeId: 'listing.bodyType',
      carBrandId: 'listing.brand', carModelId: 'listing.model', price: 'listing.price', year: 'listing.year',
      transmissionId: 'listing.transmission', fuelTypeId: 'listing.fuelType', mileage: 'listing.mileage',
      engineSize: 'listing.engineSize', cylinders: 'listing.cylinders', color: 'listing.color', doors: 'listing.doors',
      vin: 'listing.vin', address: 'listing.address', city: 'listing.city', description: 'listing.description',
    };
    const label = labels[name] ? this.translate.instant(labels[name]) : name;
    if (control.hasError('required')) return this.translate.instant('validation.required', { field: label });
    if (name === 'vin') return this.translate.instant('validation.vin');
    if (control.hasError('min')) return this.translate.instant('validation.min', { field: label });
    if (control.hasError('max')) return this.translate.instant('validation.max', { field: label });
    if (control.hasError('maxlength')) return this.translate.instant('validation.maxLength', { field: label });
    return this.translate.instant('validation.invalid', { field: label });
  }

  private normalizeImageFile(original: File, optimized: File): File {
    const type = optimized.type || original.type || 'image/jpeg';
    const extension = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
    const base = (original.name || 'car-photo').replace(/\.[^.]+$/, '') || 'car-photo';
    return new File([optimized], `${base}.${extension}`, { type, lastModified: Date.now() });
  }

  private resolveDraftDecision(allow: boolean): void {
    const resolve = this.pendingDraftDecision;
    this.pendingDraftDecision = null;
    this.draftPromptOpen.set(false);
    resolve?.(allow);
  }
}
