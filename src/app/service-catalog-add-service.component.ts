import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ServiceCatalogService,
  ServiceDeployment,
  AppProfile,
  ProvisionService,
  ServiceSourceKind,
  requiresBuilder,
  builderReady as isBuilderReady,
  BuilderStatus,
  ServiceCatalogApiError,
} from './service-catalog.service';
import { SourceOption, buildSourceOptions } from './service-source-options';
import { StepUpChallengeComponent } from './step-up-challenge.component';

/** A paused provision awaiting a step-up token: the EXACT call to retry, plus its label. */
interface ProvisionStepUpChallenge {
  domain: string;
  id: string;
  body: ProvisionService;
  action: string;
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
 * depend on the in-cluster Kaniko image builder (the generator leg). Since PR #17
 * the UI consults a LIVE pre-flight (GET .../service-store/builder — see
 * {@link ServiceCatalogAddServiceComponent.builderStatus}/`builderIsReady` below)
 * and presents those two radio options DISABLED with help text only until that
 * pre-flight confirms a real build is actually possible — no live deployment has
 * both the config flag and a build node yet, so today they stay disabled in
 * practice, but the gate itself is live/automatic, not hardcoded. If the server
 * ever disagrees (e.g. a race), the bff's authoritative 400 ("requires the
 * in-cluster builder") is surfaced verbatim. The SELECT/GIT effector itself also
 * ships dark by default (the bff NoopArgoCdClient makes no real ArgoCD mutation)
 * — the call still returns 200; the UI is explicit that provisioning records the
 * intent and wires the role/route, and the real ArgoCD apply lands when the
 * effector is enabled.
 *
 * Flow: TYPE a domain → load its deployment rows → pick a row → choose a source +
 * repo coordinates → Provision. The {domain} + {id} are the explicit PATH targets.
 *
 * loading / empty / error states; a 403/404/400 each degrade gracefully.
 *
 * STEP-UP: provision is a candidate for the platform's step-up gate. When the bff answers
 * it with the "requires step-up" 403 contract ({@link ServiceCatalogApiError.isStepUpRequired})
 * the provision is PAUSED, not failed: the shared token challenge is shown, and confirming
 * a token retries the SAME {domain}/{id}/body carrying it in X-ServiceStore-StepUp (the
 * snapshot is retried, so a row/source changed under an open challenge is never what gets
 * provisioned). A token-less call is unchanged, so until the bff gates the endpoint nothing
 * here is reachable.
 */
@Component({
  selector: 'hug-service-catalog-add-service',
  standalone: true,
  imports: [FormsModule, StepUpChallengeComponent],
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

  // ── step-up (provision) ──
  /** The confirmed step-up token, carried in X-ServiceStore-StepUp on the retried
   *  provision. Memory-only; cleared whenever the bff re-raises the challenge. */
  readonly stepUpToken = signal('');
  /** The paused provision awaiting a token, or null. */
  readonly stepUpChallenge = signal<ProvisionStepUpChallenge | null>(null);

  /** The LIVE Kaniko-builder capability pre-flight (config flag + x86 build-node
   *  presence), fetched alongside each domain load (see {@link fetchRows}). `null`
   *  while loading; a failed fetch degrades to the fail-safe "unavailable" reading
   *  (dark-by-default), never a faked ready. */
  readonly builderStatus = signal<BuilderStatus | null>(null);

  /** True only once the pre-flight has confirmed a real build is possible (BOTH the
   *  config flag AND the live build-node probe). `false` while loading or on error —
   *  DOCKERFILE/ZIP stay gated until this is confirmed true. */
  readonly builderIsReady = computed(() => {
    const status = this.builderStatus();
    return status !== null && isBuilderReady(status);
  });

  /** The four source options (display order: the two live, then the two builder-gated),
   *  recomputed whenever the live builder pre-flight resolves — DOCKERFILE/ZIP un-gate
   *  the moment {@link builderIsReady} confirms a real build is possible. */
  readonly sourceOptions = computed<readonly SourceOption[]>(() =>
    buildSourceOptions(this.builderIsReady()),
  );

  /** The currently-selected deployment row (or null). */
  readonly selectedRow = computed<ServiceDeployment | null>(() => {
    const id = this.selectedId();
    return (this.rows() ?? []).find((r) => r.id === id) ?? null;
  });

  /** True when the chosen source needs the in-cluster Kaniko builder AND it is not
   *  (yet) confirmed live-ready. The option is disabled in the UI, but guard the
   *  submit too (defence-in-depth). */
  readonly sourceBuilderGated = computed(
    () => requiresBuilder(this.sourceKind()) && !this.builderIsReady(),
  );

  private async loadBuilderStatus(): Promise<void> {
    try {
      this.builderStatus.set(await this.serviceCatalog.builderStatus());
    } catch {
      // Fail-safe: an unreachable/denied pre-flight is treated as "not ready" — never
      // faked ready. DOCKERFILE/ZIP simply stay gated with the static helptext.
      this.builderStatus.set({ enabled: false, buildNodePresent: false, warnings: [] });
    }
  }

  trackId = (_: number, d: ServiceDeployment): string => d.id;
  trackKind = (_: number, o: SourceOption): string => o.kind;

  repoUrlInvalid(): boolean {
    return this.touched() && this.repoUrl().trim().length === 0;
  }

  /** Can the Provision button fire? A row must be selected, a non-gated source
   *  chosen, a repoUrl present (the bff @NotBlank), and no step-up challenge pending. */
  canProvision(): boolean {
    return (
      this.selectedId().trim().length > 0 &&
      !this.sourceBuilderGated() &&
      this.repoUrl().trim().length > 0 &&
      !this.busy() &&
      this.stepUpChallenge() === null
    );
  }

  /** Fetch the deployable rows for the typed domain, resetting selection/touched state. */
  async loadDomain(): Promise<void> {
    this.touched.set(false);
    this.formError.set('');
    this.notice.set('');
    this.selectedId.set('');
    this.stepUpChallenge.set(null); // a pending challenge belonged to the previous selection
    await this.fetchRows();
  }

  private async fetchRows(): Promise<void> {
    const d = this.domain().trim();
    if (d.length === 0) return;
    this.listLoading.set(true);
    this.listError.set('');
    void this.loadProfiles();
    void this.loadBuilderStatus();
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
   *  guard programmatic callers too). DOCKERFILE/ZIP are selectable once the live
   *  pre-flight confirms {@link builderIsReady}. */
  chooseSource(kind: ServiceSourceKind): void {
    if (requiresBuilder(kind) && !this.builderIsReady()) return;
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
    const body: ProvisionService = {
      sourceKind: this.sourceKind(),
      repoUrl: this.repoUrl().trim(),
      path: this.path().trim() || null,
      targetRevision: this.targetRevision().trim() || null,
    };
    await this.runProvision(domain, id, body);
  }

  /** The provision call itself, over an explicit snapshot so a step-up retry re-sends
   *  EXACTLY what paused (never whatever the form holds by then). */
  private async runProvision(domain: string, id: string, body: ProvisionService): Promise<void> {
    const row = (this.rows() ?? []).find((r) => r.id === id) ?? null;
    this.busy.set(true);
    try {
      await this.serviceCatalog.provisionDeployment(domain, id, body, ...this.stepUpArgs());
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
      if (e instanceof ServiceCatalogApiError && e.isStepUpRequired) {
        // Pause, don't fail: any previously-confirmed token is evidently stale.
        this.stepUpToken.set('');
        this.stepUpChallenge.set({
          domain,
          id,
          body,
          action: `Provisioning “${row?.serviceKey ?? id}” in ${domain}`,
        });
      } else {
        this.formError.set(this.message(e));
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

  /** The operator confirmed a step-up token: retry the paused provision with it. */
  async submitStepUp(token: string): Promise<void> {
    const challenge = this.stepUpChallenge();
    if (!challenge || token.trim().length === 0) return;
    this.stepUpToken.set(token.trim());
    this.stepUpChallenge.set(null);
    await this.runProvision(challenge.domain, challenge.id, challenge.body);
  }

  /** The operator dismissed the challenge: the paused provision did not happen — say so. */
  cancelStepUp(): void {
    const challenge = this.stepUpChallenge();
    this.stepUpChallenge.set(null);
    if (challenge) {
      this.formError.set('Step-up cancelled — the service was not provisioned.');
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
