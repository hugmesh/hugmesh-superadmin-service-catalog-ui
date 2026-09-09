import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ServiceCatalogService, ServiceCuration, ServiceCatalogApiError } from './service-catalog.service';
import { StepUpChallengeComponent } from './step-up-challenge.component';

type CurationAction = 'offer' | 'withdraw';

/** A paused offer/withdraw awaiting a step-up token: what to retry, and how to describe it. */
interface CurationStepUpChallenge {
  kind: CurationAction;
  key: string;
  action: string;
}

/**
 * The CURATION view — the SUPERADMIN's per-domain offered catalog over
 * /bff/superadmin/service-store/{domain} (ServiceCurationController). The
 * superadmin TYPES/selects a domain (the explicit PATH target), then offers or
 * withdraws a service_key for it, and the current offered set for that domain is
 * shown.
 *
 *   load     → GET  /bff/superadmin/service-store/{domain}          (the per-domain catalog)
 *   offer    → POST /bff/superadmin/service-store/{domain}/offer    {serviceKey}
 *   withdraw → POST /bff/superadmin/service-store/{domain}/withdraw {serviceKey}
 *
 * The domain is the path segment (never a body field). loading / empty / error
 * states; a 403/404 degrades gracefully. The form controls each carry a <label> +
 * aria-describedby help; the offered list announces its state.
 *
 * STEP-UP: offer and withdraw are candidates for the platform's step-up gate. When the
 * bff answers either with the "requires step-up" 403 contract
 * ({@link ServiceCatalogApiError.isStepUpRequired}) the action is PAUSED, not failed:
 * the shared token challenge is shown, and confirming a token retries the SAME
 * offer/withdraw carrying it in X-ServiceStore-StepUp. A token-less call is unchanged,
 * so until the bff gates these endpoints nothing here is reachable.
 */
@Component({
  selector: 'hug-service-catalog-curation',
  standalone: true,
  imports: [FormsModule, StepUpChallengeComponent],
  templateUrl: './service-catalog-curation.component.html',
  styleUrl: './service-catalog-curation.component.scss',
})
export class ServiceCatalogCurationComponent {
  private readonly serviceCatalog = inject(ServiceCatalogService);

  // ── Domain selector ────────────────────────────────────────────────────
  /** The domain currently typed in the input (not yet loaded into the list). */
  readonly domain = signal('');
  /**
   * The domain whose catalog is currently shown in the offered-list. Kept separately
   * from `domain` so the heading stays stable while the superadmin is mid-type:
   * the heading reads "Offered catalog for X" using the LOADED domain, not the
   * typed-but-not-yet-fetched one.
   */
  readonly loadedDomain = signal('');

  // ── Offered catalog list ────────────────────────────────────────────────
  /** All curation rows for the loaded domain (offered + withdrawn audit trail), or null while loading. */
  readonly rows = signal<ServiceCuration[] | null>(null);
  /** True while the catalog GET is in flight. */
  readonly listLoading = signal(false);
  /** Error from the catalog load — displayed in an aria-live region. */
  readonly listError = signal('');

  // ── Offer / Withdraw action form ────────────────────────────────────────
  /** The `serviceKey` to offer to or withdraw from the loaded domain. */
  readonly serviceKey = signal('');
  /** True while an offer/withdraw POST is in flight (disables action buttons). */
  readonly busy = signal(false);
  /** Error from the last offer/withdraw action — displayed in an aria-live region. */
  readonly actionError = signal('');
  /** Success notice from the last offer/withdraw action — displayed in an aria-live region. */
  readonly notice = signal('');
  /** Whether the DOMAIN form has been submitted at least once (activates the
   *  domain-field inline validation display). */
  readonly touched = signal(false);
  /**
   * Whether the OFFER form's service-key field has been submitted at least once.
   * Kept SEPARATE from `touched` so merely LOADING a domain (which sets `touched`
   * to validate the domain input) does NOT spuriously flag the still-empty service
   * key as invalid — that premature `role=alert` "A service key is required" fired
   * on every catalog load and announced a spurious error to screen readers.
   */
  readonly keyTouched = signal(false);

  // ── Step-up (offer / withdraw) ───────────────────────────────────────────
  /** The confirmed step-up token, carried in X-ServiceStore-StepUp on the retried
   *  offer/withdraw. Memory-only; cleared whenever the bff re-raises the challenge. */
  readonly stepUpToken = signal('');
  /** The paused offer/withdraw awaiting a token, or null. */
  readonly stepUpChallenge = signal<CurationStepUpChallenge | null>(null);

  /** The currently-offered (live, non-withdrawn) rows — the visible offered-catalog view. */
  readonly offeredRows = computed(() => (this.rows() ?? []).filter((r) => r.state === 'offered'));

  /** `ngFor` track-by by database id (avoids DOM churn on catalog reload). */
  trackId = (_: number, r: ServiceCuration): string => r.id;

  /** True when the domain input is empty and the domain form has been touched. */
  domainInvalid(): boolean {
    return this.touched() && this.domain().trim().length === 0;
  }
  /** True when the serviceKey input is empty and the OFFER form has been touched. */
  serviceKeyInvalid(): boolean {
    return this.keyTouched() && this.serviceKey().trim().length === 0;
  }
  /**
   * True when an offer/withdraw action may proceed. Both `loadedDomain` and `serviceKey`
   * must be non-blank, and no call must be in flight.
   *
   * A domain must be LOADED (not just typed) so accidental actions against an unconfirmed
   * domain are prevented, and a pending step-up challenge holds every action until it is
   * confirmed or cancelled.
   */
  canAct(): boolean {
    return (
      this.loadedDomain().trim().length > 0 &&
      this.serviceKey().trim().length > 0 &&
      !this.busy() &&
      this.stepUpChallenge() === null
    );
  }

  /** Fetch the catalog for the typed domain, validate input, and update `loadedDomain`. */
  async loadDomain(): Promise<void> {
    this.touched.set(true);
    // Loading a domain must NOT pre-flag the offer form's (empty) key field — reset
    // the offer-form touched state so no premature "service key required" alert shows.
    this.keyTouched.set(false);
    this.actionError.set('');
    this.notice.set('');
    this.stepUpChallenge.set(null); // a pending challenge belonged to the previous domain
    await this.fetchCatalog();
  }

  /**
   * Fetch the offered catalog for the domain in the input — WITHOUT clearing the success
   * notice (so a prior offer/withdraw's confirmation persists through the list reload).
   * Sets `loadedDomain` even on a graceful 403/404 so the heading shows the attempted domain.
   */
  private async fetchCatalog(): Promise<void> {
    const d = this.domain().trim();
    if (d.length === 0) return;
    this.listLoading.set(true);
    this.listError.set('');
    try {
      const res = await this.serviceCatalog.listCuration(d);
      this.rows.set(res);
      this.loadedDomain.set(d);
    } catch (e) {
      this.rows.set(null);
      this.loadedDomain.set(d);
      if (e instanceof ServiceCatalogApiError && (e.isForbidden || e.isNotFound)) {
        this.rows.set([]); // degrade: show the empty state, not a scary error
      } else {
        this.listError.set(`Could not load the catalog for ${d}. Please try again.`);
      }
    } finally {
      this.listLoading.set(false);
    }
  }

  async offer(): Promise<void> {
    await this.act('offer');
  }
  async withdraw(key?: string): Promise<void> {
    await this.act('withdraw', key);
  }

  private async act(kind: CurationAction, keyArg?: string): Promise<void> {
    // Only flag the OFFER form's key field when the action came FROM that form (no
    // explicit keyArg) — a per-row Withdraw carries its own key and must not mark the
    // typed-key input touched.
    const usingFormKey = keyArg === undefined;
    if (usingFormKey) this.keyTouched.set(true);
    this.actionError.set('');
    this.notice.set('');
    const domain = this.loadedDomain().trim();
    const key = (keyArg ?? this.serviceKey()).trim();
    if (domain.length === 0 || key.length === 0) return;
    this.busy.set(true);
    try {
      if (kind === 'offer') {
        await this.serviceCatalog.offer(domain, key, ...this.stepUpArgs());
        this.notice.set(`Offered “${key}” to ${domain}.`);
        this.serviceKey.set('');
        // The field is intentionally cleared for the next offer — reset its touched
        // state too so the now-empty field isn't flagged after a SUCCESSFUL offer.
        this.keyTouched.set(false);
      } else {
        await this.serviceCatalog.withdraw(domain, key, ...this.stepUpArgs());
        this.notice.set(`Withdrew “${key}” from ${domain}.`);
      }
      await this.fetchCatalog(); // refresh WITHOUT clearing the success notice
    } catch (e) {
      if (e instanceof ServiceCatalogApiError && e.isStepUpRequired) {
        // Pause, don't fail: any previously-confirmed token is evidently stale.
        this.stepUpToken.set('');
        this.stepUpChallenge.set({
          kind,
          key,
          action: kind === 'offer' ? `Offering “${key}” to ${domain}` : `Withdrawing “${key}” from ${domain}`,
        });
      } else {
        this.actionError.set(this.message(e, kind));
      }
    } finally {
      this.busy.set(false);
    }
  }

  /** The optional trailing step-up argument for the service call: present only when a
   *  token has been confirmed, so a token-less call keeps its exact pre-step-up shape. */
  private stepUpArgs(): [] | [string] {
    const token = this.stepUpToken();
    return token.length > 0 ? [token] : [];
  }

  /** The operator confirmed a step-up token: retry the paused offer/withdraw with it. */
  async submitStepUp(token: string): Promise<void> {
    const challenge = this.stepUpChallenge();
    if (!challenge || token.trim().length === 0) return;
    this.stepUpToken.set(token.trim());
    this.stepUpChallenge.set(null);
    await this.act(challenge.kind, challenge.key);
  }

  /** The operator dismissed the challenge: the paused action did not happen — say so. */
  cancelStepUp(): void {
    const challenge = this.stepUpChallenge();
    this.stepUpChallenge.set(null);
    if (challenge) {
      const verb = challenge.kind === 'offer' ? 'offered' : 'withdrawn';
      this.actionError.set(`Step-up cancelled — “${challenge.key}” was not ${verb}.`);
    }
  }

  private message(e: unknown, kind: CurationAction): string {
    if (e instanceof ServiceCatalogApiError && e.isForbidden) {
      return 'The server denied this action — superadmin is required to curate the catalog.';
    }
    return `Could not ${kind} the service. Please try again.`;
  }
}
