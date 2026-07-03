import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ServiceCatalogService, ServiceCuration, ServiceCatalogApiError } from './service-catalog.service';

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
 */
@Component({
  selector: 'snap-service-catalog-curation',
  standalone: true,
  imports: [FormsModule],
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
  /** Whether the form has been submitted at least once (activates inline validation display). */
  readonly touched = signal(false);

  /** The currently-offered (live, non-withdrawn) rows — the visible offered-catalog view. */
  readonly offeredRows = computed(() => (this.rows() ?? []).filter((r) => r.state === 'offered'));

  /** `ngFor` track-by by database id (avoids DOM churn on catalog reload). */
  trackId = (_: number, r: ServiceCuration): string => r.id;

  /** True when the domain input is empty and the form has been touched. */
  domainInvalid(): boolean {
    return this.touched() && this.domain().trim().length === 0;
  }
  /** True when the serviceKey input is empty and the form has been touched. */
  serviceKeyInvalid(): boolean {
    return this.touched() && this.serviceKey().trim().length === 0;
  }
  /**
   * True when an offer/withdraw action may proceed. Both `loadedDomain` and `serviceKey`
   * must be non-blank, and no call must be in flight.
   *
   * A domain must be LOADED (not just typed) so accidental actions against an unconfirmed
   * domain are prevented.
   */
  canAct(): boolean {
    return this.loadedDomain().trim().length > 0 && this.serviceKey().trim().length > 0 && !this.busy();
  }

  /** Fetch the catalog for the typed domain, validate input, and update `loadedDomain`. */
  async loadDomain(): Promise<void> {
    this.touched.set(true);
    this.actionError.set('');
    this.notice.set('');
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

  private async act(kind: 'offer' | 'withdraw', keyArg?: string): Promise<void> {
    this.touched.set(true);
    this.actionError.set('');
    this.notice.set('');
    const domain = this.loadedDomain().trim();
    const key = (keyArg ?? this.serviceKey()).trim();
    if (domain.length === 0 || key.length === 0) return;
    this.busy.set(true);
    try {
      if (kind === 'offer') {
        await this.serviceCatalog.offer(domain, key);
        this.notice.set(`Offered “${key}” to ${domain}.`);
        this.serviceKey.set('');
      } else {
        await this.serviceCatalog.withdraw(domain, key);
        this.notice.set(`Withdrew “${key}” from ${domain}.`);
      }
      await this.fetchCatalog(); // refresh WITHOUT clearing the success notice
    } catch (e) {
      this.actionError.set(this.message(e, kind));
    } finally {
      this.busy.set(false);
    }
  }

  private message(e: unknown, kind: 'offer' | 'withdraw'): string {
    if (e instanceof ServiceCatalogApiError && e.isForbidden) {
      return 'The server denied this action — superadmin is required to curate the catalog.';
    }
    return `Could not ${kind} the service. Please try again.`;
  }
}
