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
  { path: '**', redirectTo: '' },
];
