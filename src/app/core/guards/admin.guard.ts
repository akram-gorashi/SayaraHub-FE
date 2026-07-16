import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthSessionService } from '../services/auth-session.service';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const adminGuard: CanActivateFn = (_, state) => {
  const session = inject(AuthSessionService);
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!session.hasValidAccessToken()) {
    return auth.ensureActiveSession().pipe(map(active => {
      if (!active) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      return session.isAdmin() ? true : router.createUrlTree(['/404']);
    }));
  }

  return session.isAdmin() ? true : router.createUrlTree(['/404']);
};
