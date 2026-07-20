import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedListingChanges {
  canDeactivate(): boolean;
}

export const unsavedListingGuard: CanDeactivateFn<HasUnsavedListingChanges> = component => component.canDeactivate();
