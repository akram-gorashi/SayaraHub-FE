import { Routes } from '@angular/router';

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
  { path: '**', redirectTo: '' },
];
