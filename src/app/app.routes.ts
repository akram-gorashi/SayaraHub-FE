import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

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
    path: 'sellers/:id',
    title: 'Seller Profile | SayaraHub',
    loadComponent: () =>
      import('./features/sellers/profile/seller-profile').then(({ SellerProfilePage }) => SellerProfilePage),
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
    path: 'about',
    title: 'About Us | SayaraHub',
    loadComponent: () =>
      import('./features/content/about/about-page').then(({ AboutPage }) => AboutPage),
  },
  {
    path: 'team',
    title: 'Our Team | SayaraHub',
    loadComponent: () =>
      import('./features/content/team/team-page').then(({ TeamPage }) => TeamPage),
  },
  {
    path: 'blog',
    title: 'Blog | SayaraHub',
    loadComponent: () =>
      import('./features/content/blog/blog-page').then(({ BlogPage }) => BlogPage),
  },
  {
    path: 'contact',
    title: 'Contact Us | SayaraHub',
    loadComponent: () =>
      import('./features/content/contact/contact-page').then(({ ContactPage }) => ContactPage),
  },
  {
    path: 'faq',
    title: 'Frequently Asked Questions | SayaraHub',
    loadComponent: () =>
      import('./features/content/faq/faq-page').then(({ FaqPage }) => FaqPage),
  },
  {
    path: 'privacy',
    title: 'Privacy Policy | SayaraHub',
    data: { document: 'privacy' },
    loadComponent: () =>
      import('./features/content/legal/legal-page').then(({ LegalPage }) => LegalPage),
  },
  {
    path: 'terms',
    title: 'Terms Of Service | SayaraHub',
    data: { document: 'terms' },
    loadComponent: () =>
      import('./features/content/legal/legal-page').then(({ LegalPage }) => LegalPage),
  },
  {
    path: 'coming-soon',
    title: 'Coming Soon | SayaraHub',
    loadComponent: () =>
      import('./features/content/coming-soon/coming-soon-page').then(({ ComingSoonPage }) => ComingSoonPage),
  },
  {
    path: '404',
    title: 'Page Not Found | SayaraHub',
    loadComponent: () =>
      import('./features/content/not-found/not-found-page').then(({ NotFoundPage }) => NotFoundPage),
  },
  {
    path: 'admin/moderation',
    canActivate: [adminGuard],
    title: 'Listing Moderation | SayaraHub',
    loadComponent: () =>
      import('./features/admin/moderation/admin-moderation-page').then(({ AdminModerationPage }) => AdminModerationPage),
  },
  {
    path: 'admin/operations',
    canActivate: [adminGuard],
    title: 'Safety & Operations | SayaraHub',
    loadComponent: () =>
      import('./features/admin/operations/admin-operations-page').then(({ AdminOperationsPage }) => AdminOperationsPage),
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
        path: 'listings/:id/edit', title: 'Edit Listing | SayaraHub', data: { accountTitle: 'Edit Listing' },
        loadComponent: () =>
          import('./features/account/add-listing/account-add-listing').then(({ AccountAddListing }) => AccountAddListing),
      },
      {
        path: 'listings/:id', title: 'Listing Details | SayaraHub', data: { accountTitle: 'Listing Details' },
        loadComponent: () =>
          import('./features/account/listing-details/account-listing-details').then(({ AccountListingDetails }) => AccountListingDetails),
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
        path: 'inquiries', title: 'Contact Inquiries | SayaraHub', data: { accountTitle: 'Contact Inquiries' },
        loadComponent: () =>
          import('./features/account/inquiries/account-inquiries').then(({ AccountInquiries }) => AccountInquiries),
      },
      {
        path: 'safety', title: 'Safety Center | SayaraHub', data: { accountTitle: 'Safety Center' },
        loadComponent: () =>
          import('./features/account/safety/account-safety').then(({ AccountSafety }) => AccountSafety),
      },
      {
        path: 'settings', title: 'Settings | SayaraHub', data: { accountTitle: 'Settings' },
        loadComponent: () =>
          import('./features/account/settings/account-settings').then(({ AccountSettings }) => AccountSettings),
      },
      {
        path: 'sessions', title: 'Login Sessions | SayaraHub', data: { accountTitle: 'Login Sessions' },
        loadComponent: () =>
          import('./features/account/sessions/account-sessions').then(({ AccountSessions }) => AccountSessions),
      },
      {
        path: 'notifications', title: 'Notifications | SayaraHub', data: { accountTitle: 'Notifications' },
        loadComponent: () =>
          import('./features/account/notifications/account-notifications').then(({ AccountNotifications }) => AccountNotifications),
      },
      {
        path: 'add-listing', title: 'Add Listing | SayaraHub', data: { accountTitle: 'Add Listing' },
        loadComponent: () =>
          import('./features/account/add-listing/account-add-listing').then(({ AccountAddListing }) => AccountAddListing),
      },
    ],
  },
  {
    path: '**',
    title: 'Page Not Found | SayaraHub',
    loadComponent: () =>
      import('./features/content/not-found/not-found-page').then(({ NotFoundPage }) => NotFoundPage),
  },
];
