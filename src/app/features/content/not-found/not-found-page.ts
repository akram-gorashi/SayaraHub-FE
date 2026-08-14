import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../shared/page-hero';
import { TranslatePipe } from '@ngx-translate/core';

@Component({ selector: 'app-not-found-page', imports: [PageHero, RouterLink, TranslatePipe], templateUrl: './not-found-page.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class NotFoundPage {}
