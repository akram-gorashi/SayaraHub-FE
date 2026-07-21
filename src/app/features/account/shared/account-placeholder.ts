import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-account-placeholder',
  imports: [TranslatePipe],
  template: `
    <div class="user-profile-card">
      <h2 class="user-profile-card-title">{{ title }}</h2>
      <p>{{ 'account.placeholderReady' | translate }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPlaceholder {
  protected readonly title = inject(ActivatedRoute).snapshot.data['accountTitle'] as string;
}
