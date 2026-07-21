import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedListingChanges {
  canDeactivate(): boolean | Promise<boolean>;
}

export const unsavedListingGuard: CanDeactivateFn<HasUnsavedListingChanges> = component => component.canDeactivate();
