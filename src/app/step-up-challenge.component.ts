import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * The STEP-UP TOKEN CHALLENGE — the interaction the create-service wizard renders inline
 * for its scaffold/federate legs, lifted into one reusable control so the OTHER
 * step-up-gated Service Catalog mutations (offer / withdraw / provision) share it.
 *
 * A host shows this when the bff answers a write with the platform's "requires step-up"
 * 403 contract ({@code ServiceCatalogApiError.isStepUpRequired}), and on {@link confirm}
 * retries the SAME write carrying the confirmed token in {@code X-ServiceStore-StepUp}.
 * On {@link cancel} the host reports the write as not performed. The token is held only in
 * memory, only for the host's lifetime, and is never persisted — the same posture as the
 * wizard. The bff is the authoritative gate: an operator whose session already carries a
 * fresh MFA never sees this (the gate is satisfied without a token), and a wrong token is
 * simply another "requires step-up" 403, which re-raises the challenge.
 */
@Component({
  selector: 'hug-step-up-challenge',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './step-up-challenge.component.html',
  styleUrl: './step-up-challenge.component.scss',
})
export class StepUpChallengeComponent {
  /** What the operator was doing, as a gerund phrase — "Offering “owncast” to acme.test". */
  readonly action = input.required<string>();
  /** The data-testid / element-id prefix, unique per host so two challenges never collide. */
  readonly testId = input.required<string>();
  /** Emits the trimmed token when the operator confirms (never emits an empty token). */
  readonly confirm = output<string>();
  /** Emits when the operator cancels. */
  readonly cancel = output<void>();

  /** The token typed into the challenge (cleared on confirm/cancel). */
  readonly tokenInput = signal('');

  submit(): void {
    const token = this.tokenInput().trim();
    if (token.length === 0) return;
    this.tokenInput.set('');
    this.confirm.emit(token);
  }

  dismiss(): void {
    this.tokenInput.set('');
    this.cancel.emit();
  }
}
