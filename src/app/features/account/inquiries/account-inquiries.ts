import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContactMessage } from '../../../core/models/contact-message.models';
import { InquiriesStore } from './inquiries.store';

@Component({
  selector: 'app-account-inquiries',
  imports: [DatePipe, RouterLink],
  templateUrl: './account-inquiries.html',
  styleUrl: './account-inquiries.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InquiriesStore],
})
export class AccountInquiries {
  protected readonly store = inject(InquiriesStore);

  constructor() { this.store.load(); }

  protected filter(value: string): void {
    this.store.load({ isRead: value === '' ? undefined : value === 'read', pageNumber: 1 });
  }

  protected page(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.store.totalPages()) this.store.load({ pageNumber });
  }

  protected remove(item: ContactMessage): void {
    if (globalThis.confirm?.('Delete this inquiry permanently?')) this.store.delete(item);
  }
}
