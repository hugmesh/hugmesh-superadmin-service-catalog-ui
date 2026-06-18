import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ServiceCatalogService,
  ServiceDeployment,
  AppProfile,
  ProvisionService,
  ServiceSourceKind,
  SERVICE_SOURCE_KINDS,
  requiresBuilder,
  ServiceCatalogApiError,
} from './service-catalog.service';

/** A source-kind option rendered in the radio group: the four Service Catalog sources
 *  with their copy + the builder-gated flag (DOCKERFILE/ZIP). */
interface SourceOption {
  kind: ServiceSourceKind;
  label: string;
  /** One-line description of what the source provisions from. */
  blurb: string;
  /** True when the source needs the in-cluster Kaniko builder (DOCKERFILE/ZIP),
   *  which is NOT yet available — the option is disabled with helptext. */
  builderGated: boolean;
}

/**
 * The ADD-A-SERVICE view — the SUPERADMIN flow that drives a per-domain
 * service_deployment accounting row into a REAL provisioned service through the
 * admin-bff AddService EFFECTOR (PR #67):
 *
 *   POST /bff/superadmin/service-store/{domain}/deployments/{id}/provision
 *        {sourceKind, repoUrl, path?, targetRevision?}
 *
 * The EFFECTOR converges the FOUR Service Catalog sources on the same deploy path
 * (per-service Casdoor role → route-access rule → ArgoCD Application):
 *
 *   SELECT     — a curated catalog tile referencing a PRE-BUILT image. Provisions today.
 *   GIT        — a git/GitLab repo that builds its own image (its own CI). Provisions today.
 *   DOCKERFILE — a dropped Dockerfile that must be BUILT in-cluster first.
 *   ZIP        — an uploaded zip-as-repo that must be BUILT in-cluster first.
 *
 * SHIPS DARK / graceful degradation (the platform standard): DOCKERFILE and ZIP
 * depend on the in-cluster Kaniko image builder (the generator leg) which does not
 * exist yet, so the bff rejects them with a 400 ("requires the in-cluster builder").
 * The UI presents those two radio options DISABLED with help text rather than
 * letting a superadmin half-provision an Application that points at a non-existent
 * image — and if the server ever disagrees, the 400 is surfaced verbatim. The
 * SELECT/GIT effector itself also ships dark by default (the bff NoopArgoCdClient
 * makes no real ArgoCD mutation) — the call still returns 200; the UI is explicit
 * that provisioning records the intent and wires the role/route, and the real
 * ArgoCD apply lands when the effector is enabled.
 *
 * Flow: TYPE a domain → load its deployment rows → pick a row → choose a source +
 * repo coordinates → Provision. The {domain} + {id} are the explicit PATH targets.
 *
 * loading / empty / error states; a 403/404/400 each degrade gracefully.
 */
@Component({
  selector: 'snap-service-catalog-add-service',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-catalog-add-service.component.html',
  styleUrl: './service-catalog-add-service.component.scss',
})
export class ServiceCatalogAddServiceComponent {
  private readonly serviceCatalog = inject(ServiceCatalogService);

  // ── domain selector ──
  readonly domain = signal('');
  readonly loadedDomain = signal('');

  // ── deployment rows for the domain ──
  readonly rows = signal<ServiceDeployment[] | null>(null);
  readonly listLoading = signal(false);
  readonly listError = signal('');

  // ── profile options (informational; provision references the repo, not a profile) ──
  readonly profiles = signal<AppProfile[]>([]);

  // ── the row being provisioned + the source form ──
  readonly selectedId = signal('');
  readonly sourceKind = signal<ServiceSourceKind>('SELECT');
  readonly repoUrl = signal('');
  readonly path = signal('');
  readonly targetRevision = signal('');
  readonly busy = signal(false);
  readonly formError = signal('');
  readonly notice = signal('');
  readonly touched = signal(false);

  /** The four source options (display order: the two live, then the two builder-gated). */
  readonly sourceOptions: readonly SourceOption[] = SERVICE_SOURCE_KINDS.map((kind) => ({
    kind,
    label: SOURCE_LABELS[kind],
    blurb: SOURCE_BLURBS[kind],
    builderGated: requiresBuilder(kind),
  }));

  /** The currently-selected deployment row (or null). */
  readonly selectedRow = computed<ServiceDeployment | null>(() => {
    const id = this.selectedId();
    return (this.rows() ?? []).find((r) => r.id === id) ?? null;
  });

  /** True when the chosen source needs the (absent) in-cluster Kaniko builder. The
   *  option is disabled in the UI, but guard the submit too (defence-in-depth). */
  readonly sourceBuilderGated = computed(() => requiresBuilder(this.sourceKind()));

  trackId = (_: number, d: ServiceDeployment): string => d.id;
  trackKind = (_: number, o: SourceOption): string => o.kind;

  repoUrlInvalid(): boolean {
    return this.touched() && this.repoUrl().trim().length === 0;
  }

  /** Can the Provision button fire? A row must be selected, a non-gated source
   *  chosen, and a repoUrl present (the bff @NotBlank). */
  canProvision(): boolean {
    return (
      this.selectedId().trim().length > 0 &&
      !this.sourceBuilderGated() &&
      this.repoUrl().trim().length > 0 &&
      !this.busy()
    );
  }

  async loadDomain(): Promise<void> {
    this.touched.set(false);
    this.formError.set('');
    this.notice.set('');
    this.selectedId.set('');
    await this.fetchRows();
  }

  private async fetchRows(): Promise<void> {
    const d = this.domain().trim();
    if (d.length === 0) return;
    this.listLoading.set(true);
    this.listError.set('');
    void this.loadProfiles();
    try {
      const res = await this.serviceCatalog.listDeployments(d);
      this.rows.set(res);
      this.loadedDomain.set(d);
    } catch (e) {
      this.rows.set(null);
      this.loadedDomain.set(d);
      if (e instanceof ServiceCatalogApiError && (e.isForbidden || e.isNotFound)) {
        this.rows.set([]); // degrade to the empty state, not a scary error
      } else {
        this.listError.set(`Could not load services for ${d}. Please try again.`);
      }
    } finally {
      this.listLoading.set(false);
    }
  }

  private async loadProfiles(): Promise<void> {
    try {
      this.profiles.set(await this.serviceCatalog.listProfiles());
    } catch {
      this.profiles.set([]);
    }
  }

  /** Pick the deployment row to provision (clears any prior form result). */
  select(row: ServiceDeployment): void {
    this.selectedId.set(row.id);
    this.formError.set('');
    this.notice.set('');
    this.touched.set(false);
  }

  /** Choose a source kind (ignores the builder-gated kinds — they are disabled, but
   *  guard programmatic callers too). */
  chooseSource(kind: ServiceSourceKind): void {
    if (requiresBuilder(kind)) return;
    this.sourceKind.set(kind);
  }

  async provision(): Promise<void> {
    this.touched.set(true);
    this.formError.set('');
    this.notice.set('');
    if (this.sourceBuilderGated()) {
      // Defence-in-depth: the radio is disabled, but never POST a builder-gated
      // source — match the bff's authoritative 400 with an in-UI explanation.
      this.formError.set(
        `The ${this.sourceKind()} source needs the in-cluster image builder (Kaniko), ` +
          `which is not available yet. Use a catalog (SELECT) or prebuilt repo (GIT) source.`,
      );
      return;
    }
    if (!this.canProvision()) return;
    const domain = this.loadedDomain().trim();
    const id = this.selectedId().trim();
    const row = this.selectedRow();
    const body: ProvisionService = {
      sourceKind: this.sourceKind(),
      repoUrl: this.repoUrl().trim(),
      path: this.path().trim() || null,
      targetRevision: this.targetRevision().trim() || null,
    };
    this.busy.set(true);
    try {
      await this.serviceCatalog.provisionDeployment(domain, id, body);
      this.notice.set(
        `Provisioned “${row?.serviceKey ?? id}” in ${domain} from its ${body.sourceKind} source. ` +
          `The per-service role and route-access rule are wired; the ArgoCD apply lands when the ` +
          `effector is enabled (it ships dark by default).`,
      );
      this.repoUrl.set('');
      this.path.set('');
      this.targetRevision.set('');
      await this.fetchRows(); // refresh the propagation state WITHOUT clearing the notice
    } catch (e) {
      this.formError.set(this.message(e));
    } finally {
      this.busy.set(false);
    }
  }

  private message(e: unknown): string {
    if (e instanceof ServiceCatalogApiError) {
      if (e.isForbidden) {
        return 'The server denied this action — superadmin is required to provision a service.';
      }
      if (e.isNotFound) {
        return 'That deployment no longer exists — reload the domain and try again.';
      }
      if (e.isBadRequest) {
        // The bff message carries the exact reason (the Kaniko-builder guard, or a
        // blank repoUrl, or a domain mismatch). Surface it verbatim.
        return e.message || 'The server rejected this provision request.';
      }
    }
    return 'Could not provision the service. Please try again.';
  }
}

const SOURCE_LABELS: Record<ServiceSourceKind, string> = {
  SELECT: 'Catalog (select)',
  GIT: 'Git / GitLab URL',
  DOCKERFILE: 'Dockerfile',
  ZIP: 'Zip repo upload',
};

const SOURCE_BLURBS: Record<ServiceSourceKind, string> = {
  SELECT: 'A curated catalog tile referencing a pre-built image. Deploys today.',
  GIT: 'A git/GitLab repo that builds its own image via its own CI. Deploys today.',
  DOCKERFILE: 'A dropped Dockerfile built in-cluster first. Needs the Kaniko builder.',
  ZIP: 'An uploaded zip-as-repo built in-cluster first. Needs the Kaniko builder.',
};
