import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../shared/page-hero';

@Component({
  selector: 'app-about-page',
  imports: [PageHero, RouterLink],
  templateUrl: './about-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  protected readonly highlights = [
    'Verified vehicle information and transparent listings.',
    'Simple tools for buyers and independent sellers.',
    'Secure accounts, private messaging, and saved favorites.',
  ];
  protected readonly counters = [
    { icon: 'flaticon-car-rental', value: '25K+', label: 'Available Cars' },
    { icon: 'flaticon-car-key', value: '15K+', label: 'Happy Customers' },
    { icon: 'flaticon-screwdriver', value: '150+', label: 'Trusted Sellers' },
    { icon: 'flaticon-review', value: '10+', label: 'Years Experience' },
  ];
}
