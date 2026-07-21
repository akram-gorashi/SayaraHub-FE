import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { AccountStore } from '../data-access/account.store';
import { InquiryCenterService } from '../../../core/services/inquiry-center.service';

@Component({
  selector: 'app-account-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './account-sidebar.html',
  styleUrl: './account-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSidebar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');

  protected readonly store = inject(AccountStore);
  protected readonly inquiries = inject(InquiryCenterService);
  protected readonly mobileMenuOpen = signal(false);

  constructor() {
    this.store.load();
  }

  protected chooseImage(): void {
    this.imageInput()?.nativeElement.click();
  }

  protected openMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  protected closeMenu(): void {
    this.mobileMenuOpen.set(false);
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
