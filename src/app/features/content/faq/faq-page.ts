import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PageHero } from '../shared/page-hero';

@Component({
  selector: 'app-faq-page',
  imports: [PageHero],
  templateUrl: './faq-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqPage {
  protected readonly activeQuestion = signal(0);
  protected readonly questions = [
    { question: 'How do I contact a seller?', answer: 'Open a vehicle listing and start a conversation. Your messages remain available from your account dashboard.' },
    { question: 'How can I add my own vehicle?', answer: 'Create a seller account, choose Add Listing, complete the vehicle details, and upload clear photos for review.' },
    { question: 'Can I save cars for later?', answer: 'Yes. Select the favorite icon on a listing and find it later under My Favorites in your account.' },
    { question: 'How are listing details managed?', answer: 'Sellers manage their own listings while SayaraHub provides structured vehicle data and moderation tools.' },
    { question: 'Can I delete my account?', answer: 'Yes. Open account Settings, choose a deletion reason, confirm the action, and submit the request.' },
  ];

  protected toggle(index: number): void {
    this.activeQuestion.update((active) => active === index ? -1 : index);
  }
}
