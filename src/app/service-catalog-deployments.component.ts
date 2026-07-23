import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ServiceCatalogService, ServiceDeployment, AppProfile, ServiceCatalogApiError } from './service-catalog.service';

/**
 * The DEPLOYMENTS (accounting) view — the SUPERADMIN list / record / end of the
 * per-domain service_deployment lifecycle rows over
 * /bff/superadmin/service-store/{domain}/deployments (ServiceDeploymentController).
 *
 *   load   → GET  /bff/superadmin/service-store/{domain}/deployments
 *   record → POST /bff/superadmin/service-store/{domain}/deployments
 *            {serviceKey, profileRef?, endingAt?, enforceActions?}            (201)
 *   end    → POST /bff/superadmin/service-store/{domain}/deployments/{id}/end (CAS active->ended)
 *
 * IMPORTANT — this view is CATALOG + ACCOUNTING + LIFECYCLE only; it does not
 * itself provision or tear down anything. The actual provision/teardown (the
 * AddService effector) lives one tab over, on the Add a service view — SELECT
 * and GIT sources always provision there, DOCKERFILE/ZIP provision too once the
 * live in-cluster builder pre-flight (GET .../service-store/builder) confirms a
 * real build is possible. Recording a deployment here just accounts for it; it does
 * not trigger a provision. The profile dropdown is populated from the
 * app_profile library; an optional ending_at (the expiry clock) and
 * enforce_actions (the dark-emit intent) are recorded.
 *
 * loading / empty / error states; a 403/404 degrades gracefully.
 */
@Component({
  selector: 'hug-service-catalog-deployments',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './service-catalog-deployments.component.html',
  styleUrl: './service-catalog-deployments.component.scss',
})
export class ServiceCatalogDeploymentsComponent {
  private readonly serviceCatalog = inject(ServiceCatalogService);

  // ── Domain selector ────────────────────────────────────────────────────
  /** The domain currently typed in the input (not yet loaded into the list). */
  readonly domain = signal('');
  /**
   * The domain whose deployments are currently shown in the list. Kept separately from
   * `domain` so the heading stays stable while the superadmin is mid-type.
   */
  readonly loadedDomain = signal('');

  // ── Deployment list ─────────────────────────────────────────────────────
  /** All deployment rows for the loaded domain (active + ended), or null while loading. */
  readonly rows = signal<ServiceDeployment[] | null>(null);
  /** True while the deployment GET is in flight. */
  readonly listLoading = signal(false);
  /** Error from the deployment load — displayed in an aria-live region. */
  readonly listError = signal('');

  // ── Profile dropdown (informational; load failure is non-fatal) ─────────
  /** Available app profiles for the `profileRef` picker dropdown. */
  readonly profiles = signal<AppProfile[]>([]);

  // ── Record form fields ──────────────────────────────────────────────────
  /** The `serviceKey` of the service being recorded. */
  readonly serviceKey = signal('');
  /**
   * Optional reference to a named `app_profile` (the global deploy-template library).
   * Leaving it blank uses the effector's built-in defaults at provision time.
   */
  readonly profileRef = signal('');
  /**
   * `datetime-local` value (browser-local time, no timezone suffix). Converted to a
   * UTC ISO-8601 instant via `new Date(value).toISOString()` on submit; left blank for
   * a permanent deployment (no expiry clock). Validated on submit: a non-empty value
   * must parse as a valid date.
   */
  readonly endingAtLocal = signal('');
  /**
   * Opaque JSON/CSV of effects to emit at end-of-lease. SHIPS DARK — the BFF stores
   * this string but the effector that acts on it is a later increment.
   */
  readonly enforceActions = signal('');
  /** True while the record or end POST is in flight. */
  readonly busy = signal(false);
  /** Error from the last form action — displayed in an aria-live region. */
  readonly formError = signal('');
  /** Success notice from the last form action — displayed in an aria-live region. */
  readonly notice = signal('');
  /** Whether the form has been submitted at least once (activates inline validation display). */
  readonly touched = signal(false);

  /**
   * Deployment rows sorted for display: `active` first (current deployments at the top),
   * then within each state group by `createdAt` descending (newest first).
   */
  readonly sortedRows = computed(() => {
    const r = this.rows();
    if (!r) return null;
    return [...r].sort((a, b) => {
      // Active before ended, then newest first within each state.
      if (a.state !== b.state) return a.state === 'active' ? -1 : 1;
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });
  });

  trackId = (_: number, d: ServiceDeployment): string => d.id;

  serviceKeyInvalid(): boolean {
    return this.touched() && this.serviceKey().trim().length === 0;
  }
  endingAtInvalid(): boolean {
    const v = this.endingAtLocal();
    if (v.trim().length === 0) return false;
    return Number.isNaN(Date.parse(v));
  }
  canRecord(): boolean {
    return (
      this.loadedDomain().trim().length > 0 &&
      this.serviceKey().trim().length > 0 &&
      !this.endingAtInvalid() &&
      !this.busy()
    );
  }

  async loadDomain(): Promise<void> {
    this.touched.set(true);
    this.formError.set('');
    this.notice.set('');
    await this.fetchDeployments();
  }

  /** Fetch the deployments (+ profile options) for the domain in the input —
   *  WITHOUT clearing the notice (so a post-write reload keeps its message). */
  private async fetchDeployments(): Promise<void> {
    const d = this.domain().trim();
    if (d.length === 0) return;
    this.listLoading.set(true);
    this.listError.set('');
    // Load the deployments + (best-effort) the profile options for the dropdown.
    void this.loadProfiles();
    try {
      const res = await this.serviceCatalog.listDeployments(d);
      this.rows.set(res);
      this.loadedDomain.set(d);
    } catch (e) {
      this.rows.set(null);
      this.loadedDomain.set(d);
      if (e instanceof ServiceCatalogApiError && (e.isForbidden || e.isNotFound)) {
        this.rows.set([]);
      } else {
        this.listError.set(`Could not load deployments for ${d}. Please try again.`);
      }
    } finally {
      this.listLoading.set(false);
    }
  }

  private async loadProfiles(): Promise<void> {
    try {
      this.profiles.set(await this.serviceCatalog.listProfiles());
    } catch {
      this.profiles.set([]); // the dropdown just stays empty; not fatal
    }
  }

  async record(): Promise<void> {
    this.touched.set(true);
    this.formError.set('');
    this.notice.set('');
    if (!this.canRecord()) return;
    this.busy.set(true);
    const domain = this.loadedDomain().trim();
    const endingAt = this.endingAtLocal().trim()
      ? new Date(this.endingAtLocal()).toISOString()
      : null;
    try {
      const created = await this.serviceCatalog.createDeployment(domain, {
        serviceKey: this.serviceKey().trim(),
        profileRef: this.profileRef().trim() || null,
        endingAt,
        enforceActions: this.enforceActions().trim() || null,
      });
      this.notice.set(
        `Recorded a deployment of “${created.serviceKey}” in ${domain}. ` +
          `Note: this records the lifecycle only — to actually provision it, use the Add a service tab.`,
      );
      this.serviceKey.set('');
      this.profileRef.set('');
      this.endingAtLocal.set('');
      this.enforceActions.set('');
      await this.fetchDeployments(); // refresh WITHOUT clearing the success notice
    } catch (e) {
      this.formError.set(this.message(e, 'record'));
    } finally {
      this.busy.set(false);
    }
  }

  async end(row: ServiceDeployment): Promise<void> {
    this.busy.set(true);
    this.formError.set('');
    this.notice.set('');
    try {
      await this.serviceCatalog.endDeployment(this.loadedDomain().trim(), row.id);
      this.notice.set(`Ended the deployment of “${row.serviceKey}”.`);
      await this.fetchDeployments(); // refresh WITHOUT clearing the success notice
    } catch (e) {
      this.formError.set(this.message(e, 'end'));
    } finally {
      this.busy.set(false);
    }
  }

  private message(e: unknown, kind: 'record' | 'end'): string {
    if (e instanceof ServiceCatalogApiError && e.isForbidden) {
      return 'The server denied this action — superadmin is required to manage deployments.';
    }
    return kind === 'record'
      ? 'Could not record the deployment. Please try again.'
      : 'Could not end the deployment. Please try again.';
  }
}
