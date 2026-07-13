import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'SayaraHub | Find your next car',
    loadComponent: () =>
      import('./core/layout/main-layout/main-layout').then(({ MainLayout }) => MainLayout),
  },
];
