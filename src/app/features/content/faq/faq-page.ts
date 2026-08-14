import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PageHero } from '../shared/page-hero';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-faq-page',
  imports: [PageHero, TranslatePipe],
  templateUrl: './faq-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqPage {
  protected readonly activeQuestion = signal(0);
  protected readonly questions = [
    { question: 'content.faq.q1', answer: 'content.faq.a1' },
    { question: 'content.faq.q2', answer: 'content.faq.a2' },
    { question: 'content.faq.q3', answer: 'content.faq.a3' },
    { question: 'content.faq.q4', answer: 'content.faq.a4' },
    { question: 'content.faq.q5', answer: 'content.faq.a5' },
  ];

  protected toggle(index: number): void {
    this.activeQuestion.update((active) => active === index ? -1 : index);
  }
}
