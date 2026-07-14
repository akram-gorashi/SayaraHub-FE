import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'SayaraHub | Find your next car',
    loadComponent: () =>
      import('./core/layout/main-layout/main-layout').then(({ MainLayout }) => MainLayout),
  },
  {
    path: 'cars',
    title: 'Cars | SayaraHub',
    loadComponent: () =>
      import('./features/cars/car-listing/car-listing').then(({ CarListing }) => CarListing),
  },
  {
    path: 'cars/:id',
    title: 'Car Details | SayaraHub',
    loadComponent: () =>
      import('./features/cars/car-details/car-details').then(({ CarDetailsPage }) => CarDetailsPage),
  },
  {
    path: 'login',
    title: 'Login | SayaraHub',
    loadComponent: () =>
      import('./features/auth/login/login').then(({ LoginPage }) => LoginPage),
  },
  {
    path: 'register',
    title: 'Register | SayaraHub',
    loadComponent: () =>
      import('./features/auth/register/register').then(({ RegisterPage }) => RegisterPage),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/account/layout/account-shell').then(({ AccountShell }) => AccountShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard | SayaraHub',
        data: { accountTitle: 'Dashboard' },
        loadComponent: () =>
          import('./features/account/dashboard/account-dashboard').then(({ AccountDashboard }) => AccountDashboard),
      },
      {
        path: 'profile',
        title: 'My Profile | SayaraHub',
        data: { accountTitle: 'My Profile' },
        loadComponent: () =>
          import('./features/account/profile/account-profile').then(({ AccountProfile }) => AccountProfile),
      },
      {
        path: 'listings', title: 'My Listing | SayaraHub', data: { accountTitle: 'My Listing' },
        loadComponent: () =>
          import('./features/account/listings/account-listings').then(({ AccountListings }) => AccountListings),
      },
      {
        path: 'favorites', title: 'My Favorites | SayaraHub', data: { accountTitle: 'My Favorites' },
        loadComponent: () =>
          import('./features/account/favorites/account-favorites').then(({ AccountFavorites }) => AccountFavorites),
      },
      {
        path: 'messages', title: 'Messages | SayaraHub', data: { accountTitle: 'Messages' },
        loadComponent: () =>
          import('./features/account/messages/account-messages').then(({ AccountMessages }) => AccountMessages),
      },
      {
        path: 'settings', title: 'Settings | SayaraHub', data: { accountTitle: 'Settings' },
        loadComponent: () =>
          import('./features/account/settings/account-settings').then(({ AccountSettings }) => AccountSettings),
      },
      {
        path: 'add-listing', title: 'Add Listing | SayaraHub', data: { accountTitle: 'Add Listing' },
        loadComponent: () =>
          import('./features/account/shared/account-placeholder').then(({ AccountPlaceholder }) => AccountPlaceholder),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
