import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-hero',
  imports: [RouterLink],
  template: `
    <div class="site-breadcrumb" style="background: url(assets/img/breadcrumb/01.jpg)">
      <div class="container">
        <h1 class="breadcrumb-title">{{ title() }}</h1>
        <ul class="breadcrumb-menu">
          <li><a routerLink="/">Home</a></li>
          <li class="active">{{ title() }}</li>
        </ul>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHero {
  readonly title = input.required<string>();
}
