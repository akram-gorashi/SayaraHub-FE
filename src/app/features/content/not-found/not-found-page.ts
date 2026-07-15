import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../shared/page-hero';

@Component({ selector: 'app-not-found-page', imports: [PageHero, RouterLink], templateUrl: './not-found-page.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class NotFoundPage {}
