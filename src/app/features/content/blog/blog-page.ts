import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../shared/page-hero';

@Component({
  selector: 'app-blog-page',
  imports: [PageHero, RouterLink],
  templateUrl: './blog-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPage {
  protected readonly posts = [
    { image: '01.jpg', title: 'A practical checklist for buying your next used car' },
    { image: '02.jpg', title: 'How to create a vehicle listing buyers can trust' },
    { image: '03.jpg', title: 'Understanding mileage, service records, and value' },
    { image: '01.jpg', title: 'The questions to ask before arranging a test drive' },
    { image: '02.jpg', title: 'Simple steps that make selling a car safer' },
    { image: '03.jpg', title: 'What modern drivers should know about hybrid cars' },
  ];
}
