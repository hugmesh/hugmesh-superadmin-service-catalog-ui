import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ServiceCatalogService, ServiceCatalogApiError } from './service-catalog.service';
import {
  OptionalServiceView,
  OptionalServiceConfirmation,
  actionBlockedReason,
  confirmationLabel,
  confirmationOf,
  driftDetail,
  hasDrift,
  notToggleableReason,
  trackSlug,
  unconfirmedDetail,
} from './optional-service-state';

/**
 * The OPTIONAL SERVICES view — the SUPERADMIN's post-deploy control over which optional
 * cluster services a mesh runs, over
 * {@code /bff/superadmin/optional-services} (admin-bff, the CR-patching half of the
 * {@code OptionalService} reconciler):
 *
 * <pre>
 *   load   -> GET /bff/superadmin/optional-services
 *   toggle -> PUT /bff/superadmin/optional-services/&#123;slug&#125; &#123;enabled, reason?&#125;
 * </pre>
 *
 * <p>This is the second half of "an image ships with only its selected services UNTIL a
 * superadmin enables others". The first half (an image booting only its baked apps) is a
 * generator change; this screen is the enabling control.
 *
 * <h3>Why this screen is built the way it is</h3>
 *
 * <p>An {@code OptionalService} CR carries a REQUEST ({@code spec.enabled}) and a
 * separately-reported FACT ({@code status.installed}). They diverge in practice, and the
 * divergence is silent: a slug the admin-bff registry does not know is ACCEPTED by the
 * API server, reported by {@code kubectl} as {@code enabled: true}, and then ignored by
 * the reconciler — which writes neither target and skips {@code /status} entirely. The
 * measured example is {@code character-forge}.
 *
 * <p>So three things are deliberately NOT done here:
 * <ul>
 *   <li><b>No switch bound to state.</b> The controls are two explicit ACTIONS
 *       (Enable / Disable) and the state is a separate, read-only badge derived only
 *       from {@code status.installed} ({@code confirmationOf}). A switch whose position
 *       is written by a request is the defect above, wearing a UI. A 2xx from the PUT
 *       moves nothing; it only produces a notice that says a request was accepted.</li>
 *   <li><b>No enabled-looking control on a slug the server cannot actuate.</b> A row the
 *       server reports as not toggleable — or does not report on at all — has both
 *       actions disabled with the server's reason rendered beside them
 *       ({@code notToggleableReason}). Every disabled action, for any cause, carries its
 *       reason ({@code actionBlockedReason}); there is no bare disabled control.</li>
 *   <li><b>No discarded server reason.</b> A failed PUT renders the message the server
 *       sent, verbatim, alongside a plain-language prefix — never instead of it.</li>
 * </ul>
 *
 * <p>ONE deliberate divergence from the other views in this console: a 403/404 on the
 * LOAD does NOT degrade to the empty state here. Every other view's empty state ("this
 * domain offers nothing") is a truthful reading; "this mesh has no optional services"
 * never is, so a denied or missing endpoint is surfaced as an explained error instead.
 * Today {@code /bff/superadmin/optional-services} 404s on a stock admin-bff, and saying
 * so is far more useful than an empty list.
 *
 * <p>No modals: every message is inline signal state in an aria-live region.
 */
@Component({
  selector: 'hug-service-catalog-optional-services',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './service-catalog-optional-services.component.html',
  styleUrl: './service-catalog-optional-services.component.scss',
})
export class ServiceCatalogOptionalServicesComponent implements OnInit {
  private readonly serviceCatalog = inject(ServiceCatalogService);

  // ── list ────────────────────────────────────────────────────────────────
  /** The rows from `GET /bff/superadmin/optional-services`, or null when unloaded/failed. */
  readonly rows = signal<OptionalServiceView[] | null>(null);
  /** True while the list GET is in flight. */
  readonly listLoading = signal(false);
  /** Error from the list load — rendered in an `role=alert` live region. */
  readonly listError = signal('');

  // ── toggle action ───────────────────────────────────────────────────────
  /** The slug whose PUT is in flight, or '' when idle. */
  readonly busySlug = signal('');
  /** Error from the last toggle — rendered verbatim in an `role=alert` live region. */
  readonly actionError = signal('');
  /** Notice from the last accepted toggle. Worded as a REQUEST, never as a state change. */
  readonly notice = signal('');
  /** Optional audit note stamped onto the CR's `spec.reason` by the next toggle. */
  readonly note = signal('');

  /** True while any toggle PUT is in flight. */
  readonly busy = computed(() => this.busySlug().length > 0);

  /** ngFor track-by by slug (the natural key; the server's order is meaningful). */
  trackSlug = trackSlug;

  ngOnInit(): void {
    void this.reload();
  }

  // ── derivations the template reads (all delegate to the pure module) ─────

  /** The row's CONFIRMED state — derived from `status.installed` only. */
  confirmation(row: OptionalServiceView): OptionalServiceConfirmation {
    return confirmationOf(row);
  }
  /** The badge text for the row's confirmed state. */
  confirmationLabel(row: OptionalServiceView): string {
    return confirmationLabel(confirmationOf(row));
  }
  /** Why the row is unconfirmed, or null when it is confirmed. */
  unconfirmedDetail(row: OptionalServiceView): string | null {
    return unconfirmedDetail(row);
  }
  /** True when the confirmed state disagrees with the requested one. */
  hasDrift(row: OptionalServiceView): boolean {
    return hasDrift(row);
  }
  /** The drift sentence, or null. */
  driftDetail(row: OptionalServiceView): string | null {
    return driftDetail(row);
  }
  /** Why this slug cannot be toggled at all, or null when it can. */
  notToggleableReason(row: OptionalServiceView): string | null {
    return notToggleableReason(row);
  }
  /** Why the Enable/Disable action for `target` is unavailable, or null when it is live. */
  blockedReason(row: OptionalServiceView, target: boolean): string | null {
    return actionBlockedReason(row, target, this.busy());
  }
  /** The requested `spec.enabled`, as words — 'not reported' when the server omitted it. */
  requestedLabel(row: OptionalServiceView): string {
    if (row.enabled === null) return 'not reported';
    return row.enabled ? 'enabled' : 'disabled';
  }

  /**
   * Reload the list.
   *
   * @param keepNotice - true to preserve a toggle's success notice across the refresh
   *        (the offer/withdraw precedent in the curation view).
   */
  async reload(keepNotice = false): Promise<void> {
    if (!keepNotice) {
      this.notice.set('');
      this.actionError.set('');
    }
    this.listLoading.set(true);
    this.listError.set('');
    try {
      this.rows.set(await this.serviceCatalog.listOptionalServices());
    } catch (e) {
      this.rows.set(null);
      this.listError.set(this.listMessage(e));
    } finally {
      this.listLoading.set(false);
    }
  }

  /**
   * Request a new `spec.enabled` for one slug.
   *
   * <p>Guarded defence-in-depth by {@link actionBlockedReason}: the button is disabled,
   * but a programmatic caller must not be able to fire a blocked action either — and if
   * it tries, the block reason is shown rather than swallowed.
   *
   * @param row - the row to toggle.
   * @param target - the requested `enabled` value.
   */
  async setEnabled(row: OptionalServiceView, target: boolean): Promise<void> {
    this.actionError.set('');
    this.notice.set('');
    const blocked = actionBlockedReason(row, target, this.busy());
    if (blocked !== null) {
      this.actionError.set(blocked);
      return;
    }
    this.busySlug.set(row.slug);
    try {
      const updated = await this.serviceCatalog.setOptionalServiceEnabled(
        row.slug,
        target,
        this.note(),
      );
      // Apply the echoed CR in place. Its `status` still describes the PREVIOUS
      // generation, so `confirmationOf` will (correctly) report the row as unconfirmed
      // until the controller catches up — which is the whole point.
      this.applyRow(updated);
      this.notice.set(
        `Requested: ${target ? 'enable' : 'disable'} “${row.slug}”. The server accepted the ` +
          `request. This console will show it as ${target ? 'on' : 'off'} only once the ` +
          `controller reports it — refresh to check.`,
      );
      await this.reload(true); // refresh WITHOUT clearing the notice
    } catch (e) {
      this.actionError.set(this.actionMessage(e, row.slug, target));
    } finally {
      this.busySlug.set('');
    }
  }

  /** Replace one row in place (by slug), leaving the rest untouched. */
  private applyRow(updated: OptionalServiceView): void {
    const current = this.rows();
    if (current === null) {
      this.rows.set([updated]);
      return;
    }
    this.rows.set(current.map((r) => (r.slug === updated.slug ? updated : r)));
  }

  /**
   * The LOAD failure message. Deliberately does NOT degrade a 403/404 to an empty list
   * (see the class docblock) and never drops what the server said.
   */
  private listMessage(e: unknown): string {
    if (e instanceof ServiceCatalogApiError) {
      const detail = (e.message ?? '').trim();
      if (e.isForbidden) {
        return this.join(
          'The server denied this read — superadmin is required to manage optional services.',
          detail,
        );
      }
      if (e.isNotFound) {
        return this.join(
          'This deployment’s admin-bff does not expose /bff/superadmin/optional-services, so no ' +
            'optional service can be toggled from here yet. Nothing is enabled or disabled by ' +
            'this screen failing to load.',
          detail,
        );
      }
      return detail || 'Could not load the optional services. Please try again.';
    }
    // A normalisation failure (non-array body, a row without a slug) arrives here as a
    // plain Error. Show it: an unreadable payload must not look like an empty mesh.
    if (e instanceof Error && e.message.trim().length > 0) return e.message;
    return 'Could not load the optional services. Please try again.';
  }

  /**
   * The TOGGLE failure message. The server's reason is ALWAYS rendered when it sent one —
   * the plain-language prefix is added to it, never substituted for it.
   */
  private actionMessage(e: unknown, slug: string, target: boolean): string {
    const verb = target ? 'enable' : 'disable';
    if (e instanceof ServiceCatalogApiError) {
      const detail = (e.message ?? '').trim();
      const prefix = e.isForbidden
        ? `The server denied the request to ${verb} “${slug}” — superadmin is required.`
        : e.isNotFound
          ? `The server does not know an optional service called “${slug}”.`
          : e.isConflict
            ? `The request to ${verb} “${slug}” conflicted with a concurrent change.`
            : e.isBadRequest
              ? `The server rejected the request to ${verb} “${slug}”.`
              : `The request to ${verb} “${slug}” failed.`;
      return this.join(prefix, detail);
    }
    if (e instanceof Error && e.message.trim().length > 0) {
      return this.join(`The request to ${verb} “${slug}” failed.`, e.message.trim());
    }
    return `The request to ${verb} “${slug}” failed. The server gave no reason.`;
  }

  /** Append the server's own words to a prefix, when it sent any. */
  private join(prefix: string, detail: string): string {
    return detail.length > 0 ? `${prefix} Server said: ${detail}` : prefix;
  }
}
