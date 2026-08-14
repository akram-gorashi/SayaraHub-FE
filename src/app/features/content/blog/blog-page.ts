import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../shared/page-hero';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-blog-page',
  imports: [PageHero, RouterLink, TranslatePipe],
  templateUrl: './blog-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPage {
  protected readonly posts = [
    { image: '01.jpg', title: 'content.blog.post1' },
    { image: '02.jpg', title: 'content.blog.post2' },
    { image: '03.jpg', title: 'content.blog.post3' },
    { image: '01.jpg', title: 'content.blog.post4' },
    { image: '02.jpg', title: 'content.blog.post5' },
    { image: '03.jpg', title: 'content.blog.post6' },
  ];
}
