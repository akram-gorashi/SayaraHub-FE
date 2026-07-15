import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({ selector: 'app-coming-soon-page', templateUrl: './coming-soon-page.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class ComingSoonPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly launchAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  private readonly now = signal(Date.now());
  private readonly remaining = computed(() => Math.max(0, this.launchAt - this.now()));
  protected readonly countdown = computed(() => {
    const totalSeconds = Math.floor(this.remaining() / 1000);
    return {
      days: Math.floor(totalSeconds / 86_400),
      hours: Math.floor(totalSeconds % 86_400 / 3_600),
      minutes: Math.floor(totalSeconds % 3_600 / 60),
      seconds: totalSeconds % 60,
    };
  });

  constructor() {
    interval(1_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.now.set(Date.now()));
  }
}
