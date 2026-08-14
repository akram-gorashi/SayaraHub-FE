import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageHero } from '../shared/page-hero';
import { TranslatePipe } from '@ngx-translate/core';

type LegalDocument = 'privacy' | 'terms';

const LEGAL_CONTENT = {
  privacy: {
    title: 'content.legal.privacy.title',
    sections: [
      { heading: 'content.legal.privacy.heading1', body: 'content.legal.privacy.body1' },
      { heading: 'content.legal.privacy.heading2', body: 'content.legal.privacy.body2' },
      { heading: 'content.legal.privacy.heading3', body: 'content.legal.privacy.body3' },
      { heading: 'content.legal.privacy.heading4', body: 'content.legal.privacy.body4' },
      { heading: 'content.legal.privacy.heading5', body: 'content.legal.privacy.body5' },
    ],
  },
  terms: {
    title: 'content.legal.terms.title',
    sections: [
      { heading: 'content.legal.terms.heading1', body: 'content.legal.terms.body1' },
      { heading: 'content.legal.terms.heading2', body: 'content.legal.terms.body2' },
      { heading: 'content.legal.terms.heading3', body: 'content.legal.terms.body3' },
      { heading: 'content.legal.terms.heading4', body: 'content.legal.terms.body4' },
      { heading: 'content.legal.terms.heading5', body: 'content.legal.terms.body5' },
      { heading: 'content.legal.terms.heading6', body: 'content.legal.terms.body6' },
    ],
  },
} as const;

@Component({
  selector: 'app-legal-page',
  imports: [PageHero, TranslatePipe],
  templateUrl: './legal-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPage {
  private readonly route = inject(ActivatedRoute);
  private readonly documentType = signal(this.route.snapshot.data['document'] as LegalDocument);
  protected readonly document = computed(() => LEGAL_CONTENT[this.documentType()]);
}
