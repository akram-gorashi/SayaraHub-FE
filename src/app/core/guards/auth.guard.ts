import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthSessionService } from '../services/auth-session.service';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (_, state) => {
  const session = inject(AuthSessionService);
  const router = inject(Router);
  const auth = inject(AuthService);

  if (session.hasValidAccessToken()) return true;
  return auth.ensureActiveSession().pipe(map(active => active
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })));
};
