import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageHero } from '../shared/page-hero';

type LegalDocument = 'privacy' | 'terms';

const LEGAL_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      { heading: 'Information We Collect', body: 'We collect account details, profile information, listing content, favorites, conversations, and technical information needed to operate and protect SayaraHub.' },
      { heading: 'How We Use Information', body: 'Information is used to provide marketplace features, connect buyers and sellers, personalize results, prevent abuse, communicate service updates, and improve reliability.' },
      { heading: 'Sharing and Visibility', body: 'Listing information is public. Private account details and conversations are only shared as required to provide the service, meet legal obligations, or protect users.' },
      { heading: 'Security and Retention', body: 'We apply access controls and security safeguards appropriate to the data we process. Information is retained only while needed for the service, security, and legal requirements.' },
      { heading: 'Your Choices', body: 'You can update profile and notification settings, manage listings and favorites, or request account deletion from your dashboard settings.' },
    ],
  },
  terms: {
    title: 'Terms Of Service',
    sections: [
      { heading: 'Using SayaraHub', body: 'You must provide accurate information, keep your account secure, and use the marketplace only for lawful vehicle-related activity.' },
      { heading: 'Listings', body: 'Sellers are responsible for listing accuracy, ownership, condition, pricing, and images. SayaraHub may review, reject, or remove misleading or unsafe content.' },
      { heading: 'Buyer and Seller Transactions', body: 'SayaraHub helps users discover vehicles and communicate. Buyers and sellers remain responsible for inspection, payment, transfer, and completing transactions safely.' },
      { heading: 'Prohibited Conduct', body: 'Fraud, harassment, impersonation, scraping, malicious uploads, unlawful goods, and attempts to interfere with the platform are prohibited.' },
      { heading: 'Account Suspension or Deletion', body: 'Accounts may be restricted for violations or security risks. You may delete your account from Settings, subject to retention required for security and legal compliance.' },
      { heading: 'Service Availability', body: 'Features may change or occasionally be unavailable. SayaraHub is provided without guarantees that every listing or user-submitted statement is accurate.' },
    ],
  },
} as const;

@Component({
  selector: 'app-legal-page',
  imports: [PageHero],
  templateUrl: './legal-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPage {
  private readonly route = inject(ActivatedRoute);
  private readonly documentType = signal(this.route.snapshot.data['document'] as LegalDocument);
  protected readonly document = computed(() => LEGAL_CONTENT[this.documentType()]);
}
