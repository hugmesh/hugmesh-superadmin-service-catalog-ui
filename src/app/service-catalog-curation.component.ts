import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './service-catalog-curation.component.html',
  styleUrl: './service-catalog-curation.component.scss',
})
export class ServiceCatalogCurationComponent {
  private readonly serviceCatalog = inject(ServiceCatalogService);

  // ── domain selector ──
  readonly domain = signal('');
  /** The domain currently loaded into the offered list (so the heading is stable
   *  while the input is edited). */
  readonly loadedDomain = signal('');

  // ── offered catalog list ──
  readonly rows = signal<ServiceCuration[] | null>(null);
  readonly listLoading = signal(false);
  readonly listError = signal('');

  // ── offer/withdraw action form ──
  readonly serviceKey = signal('');
  readonly busy = signal(false);
  readonly actionError = signal('');
  readonly notice = signal('');
  readonly touched = signal(false);

  /** Only the live (offered) rows, for the "current offered set" view. */
  readonly offeredRows = computed(() => (this.rows() ?? []).filter((r) => r.state === 'offered'));

  trackId = (_: number, r: ServiceCuration): string => r.id;

  domainInvalid(): boolean {
    return this.touched() && this.domain().trim().length === 0;
  }
  serviceKeyInvalid(): boolean {
    return this.touched() && this.serviceKey().trim().length === 0;
  }
  /** A domain must be loaded before offer/withdraw can target it. */
  canAct(): boolean {
    return this.loadedDomain().trim().length > 0 && this.serviceKey().trim().length > 0 && !this.busy();
  }

  async loadDomain(): Promise<void> {
    this.touched.set(true);
    this.actionError.set('');
    this.notice.set('');
    await this.fetchCatalog();
  }

  /** Fetch the offered catalog for the domain in the input — WITHOUT clearing the
   *  notice (so a post-write reload keeps its success message). */
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
