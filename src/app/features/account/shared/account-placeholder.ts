import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-account-placeholder',
  template: `
    <div class="user-profile-card">
      <h2 class="user-profile-card-title">{{ title }}</h2>
      <p>This account section is ready for its API integration.</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPlaceholder {
  protected readonly title = inject(ActivatedRoute).snapshot.data['accountTitle'] as string;
}
