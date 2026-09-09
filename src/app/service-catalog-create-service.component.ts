import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ServiceCatalogService,
  AppProfile,
  ScaffoldArchetype,
  ServiceScaffold,
  FederateOutcome,
  FederationStatus,
  BuilderStatus,
  ServiceSourceKind,
  ServiceCatalogApiError,
  requiresBuilder,
  builderReady as isBuilderReady,
  serviceSlug,
  archetypeNeedsJavaPackageSlug,
} from './service-catalog.service';
import { SourceOption, buildSourceOptions } from './service-source-options';

/** The wizard step ids, in order. */
type StepId = 'identity' | 'archetype' | 'source' | 'federation' | 'review';

/** One step in the sequential apply chain. `status` drives the per-step badge; `detail`
 *  is the success/error line (a bff 400 is surfaced VERBATIM in `detail`). */
interface ApplyStep {
  id: ApplyStepId;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'skipped';
  detail: string;
}
type ApplyStepId = 'offer' | 'deployment' | 'scaffold' | 'provision' | 'federate';

/** A Java-package segment must be lowercase alphanumeric, no hyphens (mirrors the
 *  admin-bff ScaffoldService.JAVA_PACKAGE_SLUG guard). */
const JAVA_PACKAGE_SLUG = /^[a-z0-9]+$/;
/** DNS-label federation slug (mirrors FederateServiceRequest.slug @Pattern). */
const SLUG_PATTERN = /^[a-z0-9-]{1,64}$/;
/** Mount path (mirrors FederateServiceRequest.mountAt / ScaffoldServiceRequest.mountAt @Pattern). */
const MOUNT_PATTERN = /^\/[A-Za-z0-9/_-]*$/;

/**
 * The CREATE-AND-FEDERATE service WIZARD — the SUPERADMIN flow that stands up a brand-new
 * service from scratch and (optionally) federates its UI, over the admin-bff
 * ServiceStoreWizardController (/bff/superadmin/service-store/**):
 *
 *   Identity   — domain, serviceKey, displayName, optional app-profile reference.
 *   Archetype  — pick a starter codebase from the embedded archetype catalog
 *                (GET .../scaffold/archetypes). Validates the derived slug against the
 *                per-archetype rule (the spring-bff Java-package archetype needs ^[a-z0-9]+$).
 *   Source     — the same four SELECT/GIT/DOCKERFILE/ZIP sources as Add-a-service, with the
 *                LIVE Kaniko-builder pre-flight gating DOCKERFILE/ZIP (ships dark by default).
 *   Federation — slug/mountAt/exposedModule/remoteEntryUrl/visibility/requiresRole. The LIVE
 *                federation pre-flight (GET .../federation) is shown as a ships-dark note when
 *                registration is not real yet.
 *   Review     — an optional "offer to the domain catalog" toggle, then APPLY the chain.
 *
 * APPLY CHAIN (sequential, each step surfaced with its own success/error state; a bff 400 is
 * shown verbatim): offer? → record deployment → scaffold (step-up) → [archive download link]
 * → provision → federate (step-up). SCAFFOLD and FEDERATE are step-up-gated: a 403 with the
 * "requires step-up" contract pauses the chain and shows the token challenge; confirming a
 * token RESUMES the SAME chain from the paused step (the token is carried in the
 * X-ServiceStore-StepUp header on scaffold + federate, and on offer + provision once a token
 * has been confirmed, since the bff may gate those legs too — issue #4). NEVER fakes success — the federate
 * outcome's federationReal=false / gitopsDescriptorPending=true are rendered as explicit
 * pending/dark notices.
 */
@Component({
  selector: 'hug-service-catalog-create-service',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './service-catalog-create-service.component.html',
  styleUrl: './service-catalog-create-service.component.scss',
})
export class ServiceCatalogCreateServiceComponent {
  private readonly serviceCatalog = inject(ServiceCatalogService);

  // ── wizard step rail ──────────────────────────────────────────────────────
  readonly steps: ReadonlyArray<{ id: StepId; title: string }> = [
    { id: 'identity', title: 'Identity' },
    { id: 'archetype', title: 'Archetype' },
    { id: 'source', title: 'Source' },
    { id: 'federation', title: 'Federation' },
    { id: 'review', title: 'Review & apply' },
  ];
  readonly stepIndex = signal(0);
  readonly currentStep = computed<StepId>(() => this.steps[this.stepIndex()].id);
  readonly isLastStep = computed(() => this.stepIndex() >= this.steps.length - 1);

  // ── identity ──────────────────────────────────────────────────────────────
  readonly domain = signal('');
  readonly serviceKey = signal('');
  readonly displayName = signal('');
  readonly profileRef = signal('');
  readonly profiles = signal<AppProfile[]>([]);

  // ── archetype ─────────────────────────────────────────────────────────────
  readonly archetypes = signal<ScaffoldArchetype[]>([]);
  readonly archetypesError = signal('');
  readonly selectedArchetype = signal('');

  // ── source (shared four-source group + live builder pre-flight) ────────────
  readonly sourceKind = signal<ServiceSourceKind>('SELECT');
  readonly repoUrl = signal('');
  readonly path = signal('');
  readonly targetRevision = signal('');
  readonly builderStatus = signal<BuilderStatus | null>(null);
  readonly builderIsReady = computed(() => {
    const status = this.builderStatus();
    return status !== null && isBuilderReady(status);
  });
  readonly sourceOptions = computed<readonly SourceOption[]>(() =>
    buildSourceOptions(this.builderIsReady()),
  );
  readonly sourceBuilderGated = computed(
    () => requiresBuilder(this.sourceKind()) && !this.builderIsReady(),
  );

  // ── federation ────────────────────────────────────────────────────────────
  /** Whether the federate leg runs (a pure backend service has no MFE to register). */
  readonly federate = signal(true);
  readonly slug = signal('');
  /** The mount path — shared by the scaffold (nullable) and the federation (@NotBlank) bodies. */
  readonly mountAt = signal('');
  readonly exposedModule = signal('./routes');
  readonly remoteEntryUrl = signal('');
  readonly federationKind = signal('remote-shell');
  readonly visibility = signal<'public' | 'internal'>('internal');
  readonly requiresRole = signal('');
  readonly federationStatus = signal<FederationStatus | null>(null);

  // ── review / apply ────────────────────────────────────────────────────────
  /** The optional "offer this service into the domain's catalog" toggle. */
  readonly offerService = signal(true);
  readonly applySteps = signal<ApplyStep[]>([]);
  readonly applyStarted = signal(false);
  readonly applying = signal(false);
  readonly applyDone = signal(false);
  readonly createdDeploymentId = signal('');
  readonly createdScaffold = signal<ServiceScaffold | null>(null);
  readonly federateOutcome = signal<FederateOutcome | null>(null);

  /** The confirmed step-up token, carried in X-ServiceStore-StepUp on scaffold+federate.
   *  Never persisted/logged. */
  readonly stepUpToken = signal('');
  /** The token typed into the challenge dialog (cleared on submit/cancel). */
  readonly stepUpTokenInput = signal('');
  /** A pending step-up challenge (the paused apply-step index + label), or null. */
  readonly stepUpChallenge = signal<{ stepIndex: number; action: string } | null>(null);

  /** Wizard-navigation validation error (shared across steps). */
  readonly error = signal('');

  readonly archiveUrl = computed(() => {
    const sc = this.createdScaffold();
    if (!sc) return '';
    return this.serviceCatalog.scaffoldArchiveUrl(this.domain().trim(), sc.id);
  });

  constructor() {
    void this.loadInitial();
  }

  private async loadInitial(): Promise<void> {
    void this.loadProfiles();
    void this.loadArchetypes();
    void this.loadFederationStatus();
    void this.loadBuilderStatus();
  }

  private async loadProfiles(): Promise<void> {
    try {
      this.profiles.set(await this.serviceCatalog.listProfiles());
    } catch {
      this.profiles.set([]);
    }
  }

  private async loadArchetypes(): Promise<void> {
    this.archetypesError.set('');
    try {
      this.archetypes.set(await this.serviceCatalog.listArchetypes());
    } catch {
      this.archetypes.set([]);
      this.archetypesError.set('Could not load the archetype catalog. Please try again.');
    }
  }

  /** Re-fetch the archetype catalog after a load failure (the Retry affordance). */
  async reloadArchetypes(): Promise<void> {
    await this.loadArchetypes();
  }

  private async loadFederationStatus(): Promise<void> {
    try {
      this.federationStatus.set(await this.serviceCatalog.federationStatus());
    } catch {
      // Fail-safe: an unreachable/denied pre-flight is treated as not-real (ships dark).
      this.federationStatus.set({ enabled: false, warnings: [] });
    }
  }

  private async loadBuilderStatus(): Promise<void> {
    try {
      this.builderStatus.set(await this.serviceCatalog.builderStatus());
    } catch {
      // Fail-safe: DOCKERFILE/ZIP stay gated on an unreachable pre-flight, never faked ready.
      this.builderStatus.set({ enabled: false, buildNodePresent: false, warnings: [] });
    }
  }

  // ── track helpers ─────────────────────────────────────────────────────────
  trackArchetype = (_: number, a: ScaffoldArchetype): string => a.name;
  trackKind = (_: number, o: SourceOption): string => o.kind;
  trackApplyStep = (_: number, s: ApplyStep): string => s.id;
  trackProfile = (_: number, p: AppProfile): string => p.name;

  // ── archetype ─────────────────────────────────────────────────────────────
  selectArchetype(name: string): void {
    this.selectedArchetype.set(name);
    const arch = this.archetypes().find((a) => a.name === name);
    // Default the federation module kind to the archetype's family where it maps.
    if (arch && arch.kind === 'fragment') this.federationKind.set('fragment');
    else if (arch && (arch.kind === 'remote-shell' || arch.kind === 'host')) {
      this.federationKind.set('remote-shell');
    }
  }

  selectedArchetypeDef(): ScaffoldArchetype | null {
    return this.archetypes().find((a) => a.name === this.selectedArchetype()) ?? null;
  }

  /** The k8s/DNS slug the serviceKey derives to (the rendered APP_SLUG + default federation slug). */
  derivedSlug(): string {
    return serviceSlug(this.serviceKey());
  }

  /** True when the chosen archetype relocates a Java package but the derived slug is not
   *  package-safe (^[a-z0-9]+$) — the exact rule the bff 400-rejects. Surfaced BEFORE submit. */
  slugArchetypeInvalid(): boolean {
    const arch = this.selectedArchetype();
    if (arch.length === 0 || !archetypeNeedsJavaPackageSlug(arch)) return false;
    return !JAVA_PACKAGE_SLUG.test(this.derivedSlug());
  }

  // ── source ────────────────────────────────────────────────────────────────
  chooseSource(kind: ServiceSourceKind): void {
    if (requiresBuilder(kind) && !this.builderIsReady()) return;
    this.sourceKind.set(kind);
  }

  // ── federation ────────────────────────────────────────────────────────────
  /** Pre-fill the federation defaults from the identity/archetype when the step is entered,
   *  leaving any value the operator already set untouched. */
  private ensureFederationDefaults(): void {
    const slug = this.derivedSlug();
    if (this.slug().trim().length === 0) this.slug.set(slug);
    if (this.mountAt().trim().length === 0) this.mountAt.set('/' + this.slug().trim());
    if (this.remoteEntryUrl().trim().length === 0) {
      this.remoteEntryUrl.set(`http://hugmesh-${this.slug().trim()}:8080/remoteEntry.json`);
    }
  }

  slugInvalid(): boolean {
    return this.federate() && !SLUG_PATTERN.test(this.slug().trim());
  }
  mountAtInvalid(): boolean {
    return this.federate() && !MOUNT_PATTERN.test(this.mountAt().trim());
  }
  exposedModuleInvalid(): boolean {
    return this.federate() && this.exposedModule().trim().length === 0;
  }
  remoteEntryInvalid(): boolean {
    return this.federate() && this.remoteEntryUrl().trim().length === 0;
  }

  // ── step navigation ───────────────────────────────────────────────────────
  private stepValid(step: StepId): boolean {
    switch (step) {
      case 'identity': {
        const k = this.serviceKey().trim();
        return this.domain().trim().length > 0 && k.length > 0 && k.length <= 128;
      }
      case 'archetype':
        return this.selectedArchetype().length > 0 && !this.slugArchetypeInvalid();
      case 'source':
        return !this.sourceBuilderGated() && this.repoUrl().trim().length > 0;
      case 'federation':
        return (
          !this.federate() ||
          (!this.slugInvalid() &&
            !this.mountAtInvalid() &&
            !this.exposedModuleInvalid() &&
            !this.remoteEntryInvalid())
        );
      case 'review':
        return true;
    }
  }

  private stepError(step: StepId): string {
    switch (step) {
      case 'identity':
        return 'Enter a domain and a service key (1–128 characters).';
      case 'archetype':
        return this.slugArchetypeInvalid()
          ? `The “${this.selectedArchetype()}” archetype relocates a Java package, so the service ` +
              `key must yield a package-safe slug (^[a-z0-9]+$). “${this.serviceKey().trim()}” yields ` +
              `“${this.derivedSlug()}”.`
          : 'Choose a starter archetype.';
      case 'source':
        return this.sourceBuilderGated()
          ? `The ${this.sourceKind()} source needs the in-cluster image builder (Kaniko), which is ` +
              `not available yet. Choose a catalog (SELECT) or git (GIT) source.`
          : 'Choose a live source and enter a repository URL.';
      case 'federation':
        return 'Enter a valid slug (^[a-z0-9-]{1,64}$), mount path (/…), exposed module and remote-entry URL.';
      default:
        return '';
    }
  }

  next(): void {
    if (!this.stepValid(this.currentStep())) {
      this.error.set(this.stepError(this.currentStep()));
      return;
    }
    this.error.set('');
    if (!this.isLastStep()) {
      this.stepIndex.set(this.stepIndex() + 1);
      if (this.currentStep() === 'federation') this.ensureFederationDefaults();
    }
  }

  back(): void {
    if (this.stepIndex() > 0) {
      this.error.set('');
      this.stepIndex.set(this.stepIndex() - 1);
    }
  }

  /** All-green gate for the Apply button: every prior step valid AND not mid-apply. */
  canApply(): boolean {
    return (
      this.stepValid('identity') &&
      this.stepValid('archetype') &&
      this.stepValid('source') &&
      this.stepValid('federation') &&
      !this.applying()
    );
  }

  // ── apply chain ───────────────────────────────────────────────────────────
  private buildPlan(): ApplyStep[] {
    const mk = (id: ApplyStepId, label: string, skipped = false): ApplyStep => ({
      id,
      label,
      status: skipped ? 'skipped' : 'pending',
      detail: skipped ? 'Skipped.' : '',
    });
    return [
      mk('offer', 'Offer to the domain catalog', !this.offerService()),
      mk('deployment', 'Record the deployment'),
      mk('scaffold', 'Scaffold the starter codebase'),
      mk('provision', 'Provision the deployment'),
      mk('federate', 'Federate the UI', !this.federate()),
    ];
  }

  private patchStep(id: ApplyStepId, patch: Partial<ApplyStep>): void {
    this.applySteps.update((steps) => steps.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  async apply(): Promise<void> {
    if (this.applying()) return;
    if (!this.canApply()) {
      this.error.set(this.stepError('source'));
      return;
    }
    this.error.set('');
    this.applyStarted.set(true);
    this.applyDone.set(false);
    this.createdDeploymentId.set('');
    this.createdScaffold.set(null);
    this.federateOutcome.set(null);
    this.applySteps.set(this.buildPlan());
    await this.runApplyFrom(0);
  }

  /** Run the plan from `start`, pausing (not failing) on a step-up-required 403 so the
   *  challenge dialog can collect a token and RESUME the same chain from the paused step. */
  private async runApplyFrom(start: number): Promise<void> {
    this.applying.set(true);
    const steps = this.applySteps();
    for (let i = start; i < steps.length; i++) {
      const step = steps[i];
      if (step.status === 'done' || step.status === 'skipped') continue;
      this.patchStep(step.id, { status: 'running', detail: '' });
      try {
        await this.runStep(step.id);
        this.patchStep(step.id, { status: 'done' });
      } catch (e) {
        if (e instanceof ServiceCatalogApiError && e.isStepUpRequired) {
          this.patchStep(step.id, { status: 'pending', detail: '' });
          this.stepUpChallenge.set({ stepIndex: i, action: step.label });
          this.applying.set(false);
          return;
        }
        this.patchStep(step.id, { status: 'error', detail: this.message(e) });
        this.applying.set(false);
        return;
      }
    }
    this.applying.set(false);
    this.applyDone.set(true);
  }

  private async runStep(id: ApplyStepId): Promise<void> {
    const domain = this.domain().trim();
    const key = this.serviceKey().trim();
    switch (id) {
      case 'offer': {
        await this.serviceCatalog.offer(domain, key, ...this.stepUpArgs());
        this.patchStep('offer', { detail: `Offered “${key}” to ${domain}.` });
        return;
      }
      case 'deployment': {
        const dep = await this.serviceCatalog.createDeployment(domain, {
          serviceKey: key,
          profileRef: this.profileRef().trim() || null,
        });
        this.createdDeploymentId.set(dep.id);
        this.patchStep('deployment', { detail: `Recorded deployment ${dep.id}.` });
        return;
      }
      case 'scaffold': {
        const scaffold = await this.serviceCatalog.createScaffold(
          domain,
          {
            serviceKey: key,
            displayName: this.displayName().trim() || null,
            archetype: this.selectedArchetype(),
            mountAt: this.mountAt().trim() || null,
            requiresRole: this.requiresRole().trim() || null,
          },
          this.stepUpToken() || undefined,
        );
        this.createdScaffold.set(scaffold);
        this.patchStep('scaffold', {
          detail: `Scaffolded a “${scaffold.archetype}” starter (${scaffold.state}). Download it below.`,
        });
        return;
      }
      case 'provision': {
        await this.serviceCatalog.provisionDeployment(
          domain,
          this.createdDeploymentId(),
          {
            sourceKind: this.sourceKind(),
            repoUrl: this.repoUrl().trim(),
            path: this.path().trim() || null,
            targetRevision: this.targetRevision().trim() || null,
          },
          ...this.stepUpArgs(),
        );
        this.patchStep('provision', {
          detail: `Provisioned from its ${this.sourceKind()} source (the effector ships dark by default).`,
        });
        return;
      }
      case 'federate': {
        const outcome = await this.serviceCatalog.federateDeployment(
          domain,
          this.createdDeploymentId(),
          {
            slug: this.slug().trim(),
            mountAt: this.mountAt().trim(),
            exposedModule: this.exposedModule().trim(),
            remoteEntryUrl: this.remoteEntryUrl().trim(),
            kind: this.federationKind().trim() || null,
            visibility: this.visibility(),
            requiresRole: this.requiresRole().trim() || null,
          },
          this.stepUpToken() || undefined,
        );
        this.federateOutcome.set(outcome);
        this.patchStep('federate', {
          detail: outcome.federationReal
            ? `Registered the “${this.slug().trim()}” federation module.`
            : `Recorded the federation intent for “${this.slug().trim()}” (ships dark — see the note below).`,
        });
        return;
      }
    }
  }

  // ── step-up challenge ─────────────────────────────────────────────────────
  /** The optional trailing step-up argument for the offer/provision legs: present only
   *  once a token has been confirmed, so a token-less call keeps its exact pre-step-up
   *  shape. (scaffold/federate pass the token positionally — their generated clients
   *  declare the header; see step-up-context.ts for why these two differ.) Without this,
   *  a gated offer/provision leg would pause, resume token-less, and pause again forever. */
  private stepUpArgs(): [] | [string] {
    const token = this.stepUpToken();
    return token.length > 0 ? [token] : [];
  }

  async submitStepUp(): Promise<void> {
    const token = this.stepUpTokenInput().trim();
    if (token.length === 0) return;
    this.stepUpToken.set(token);
    const challenge = this.stepUpChallenge();
    this.stepUpChallenge.set(null);
    this.stepUpTokenInput.set('');
    if (challenge) await this.runApplyFrom(challenge.stepIndex);
  }

  cancelStepUp(): void {
    const challenge = this.stepUpChallenge();
    this.stepUpChallenge.set(null);
    this.stepUpTokenInput.set('');
    if (challenge) {
      const step = this.applySteps()[challenge.stepIndex];
      this.patchStep(step.id, {
        status: 'error',
        detail: 'Step-up cancelled — this step and the rest of the chain did not run.',
      });
      this.applying.set(false);
    }
  }

  private message(e: unknown): string {
    if (e instanceof ServiceCatalogApiError) {
      if (e.isForbidden) {
        return 'The server denied this action — superadmin is required.';
      }
      if (e.isNotFound) {
        return 'A record was gone before this step could run — restart the wizard.';
      }
      if (e.isConflict) {
        return e.message || 'A conflicting record already exists.';
      }
      if (e.isBadRequest) {
        // The bff message carries the exact reason (bad archetype, non-package-safe slug,
        // blank repoUrl/remoteEntryUrl, domain mismatch). Surface it verbatim.
        return e.message || 'The server rejected this request.';
      }
    }
    return 'This step failed. Please try again.';
  }
}
