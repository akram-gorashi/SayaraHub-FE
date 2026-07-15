import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthSessionService } from '../services/auth-session.service';

export const adminGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  const router = inject(Router);

  if (!session.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: '/admin/moderation' } });
  }

  return session.isAdmin() ? true : router.createUrlTree(['/404']);
};
