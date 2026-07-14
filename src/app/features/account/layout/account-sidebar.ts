import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { AccountStore } from '../data-access/account.store';

@Component({
  selector: 'app-account-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './account-sidebar.html',
  styleUrl: './account-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSidebar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');

  protected readonly store = inject(AccountStore);

  constructor() {
    this.store.load();
  }

  protected chooseImage(): void {
    this.imageInput()?.nativeElement.click();
  }

  protected imageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.store.replaceImage(file);
    }
    input.value = '';
  }

  protected logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }
}
