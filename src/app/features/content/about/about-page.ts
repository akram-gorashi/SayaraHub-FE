import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHero } from '../shared/page-hero';

@Component({
  selector: 'app-about-page',
  imports: [PageHero, RouterLink, TranslatePipe],
  templateUrl: './about-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  protected readonly highlights = [
    'content.about.highlightVehicle',
    'content.about.highlightTools',
    'content.about.highlightSecure',
  ];
  protected readonly counters = [
    { icon: 'flaticon-car-rental', value: '25K+', label: 'content.about.availableCars' },
    { icon: 'flaticon-car-key', value: '15K+', label: 'content.about.happyCustomers' },
    { icon: 'flaticon-screwdriver', value: '150+', label: 'content.about.trustedSellers' },
    { icon: 'flaticon-review', value: '10+', label: 'content.about.yearsExperience' },
  ];
}
