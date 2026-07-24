import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { ServiceCurationControllerService } from './api/services/service-curation-controller.service';
import { AppProfileControllerService } from './api/services/app-profile-controller.service';
import { ServiceDeploymentControllerService } from './api/services/service-deployment-controller.service';
import { AdminServiceStoreControllerService } from './api/services/admin-service-store-controller.service';
import { ServiceCatalogBuilderControllerService } from './api/services/service-catalog-builder-controller.service';
import { ServiceStoreWizardControllerService } from './api/services/service-store-wizard-controller.service';

/** Base URL of the admin BFF. The fe-gateway proxies same-origin /bff/** to
 *  hugmesh-admin-bff-api, so the default is the empty string = same origin.
 *  `globalThis.__HUG_SERVICE_CATALOG_URL__` lets the host override the target at
 *  runtime (mirrors the other remotes' __HUG_*_URL__ globals). */
export const SERVICE_CATALOG_BASE_URL = new InjectionToken<string>('SERVICE_CATALOG_BASE_URL', {
  factory: () => (globalThis as any).__HUG_SERVICE_CATALOG_URL__ ?? '',
});

// ---------------------------------------------------------------------------
// Contract — mirrors hugmesh-admin-bff-api serviceCatalog records (Jackson serialises
// them camelCase): ServiceCuration / AppProfile / ServiceDeployment + the request
// DTOs ServiceCurationRequest / AppProfileRequest / ServiceDeploymentRequest.
// These are the EXACT JSON shapes the bff returns. As of the ng-openapi-gen
// migration, `npm run gen:spec` copies the admin-bff's committed
// src/main/resources/openapi/openapi.json to openapi.json and regenerates
// src/app/api/, and this service is the thin DELEGATING wrapper over the
// generated, typed client — the public method signatures + the interfaces below
// are the stable contract the components consume (unchanged across the
// migration). See README "Typed API client".
// ---------------------------------------------------------------------------

/** The two service_curation lifecycle states: 'offered' (live in the catalog) |
 *  'withdrawn' (CAS audit trail). */
export type ServiceCurationState = 'offered' | 'withdrawn';

/** ServiceCuration — a service_curation row: per-{domain} offered-catalog record.
 *  state = 'offered' (live in the catalog) | 'withdrawn' (CAS audit trail). */
export interface ServiceCuration {
  id: string;
  domain: string;
  serviceKey: string;
  state: ServiceCurationState;
  curatedBySubject: string;
  createdAt: string;
  updatedAt: string;
}

/** AppProfile — an app_profile row: a reusable, GLOBAL (cross-domain) deploy
 *  template. `name` is the unique natural key; `profileJson` is opaque
 *  resource/role/cert/exposure defaults (unparsed in PR1). */
export interface AppProfile {
  id: string;
  name: string;
  profileJson: string;
  createdBySubject: string;
  createdAt: string;
  updatedAt: string;
}

/** The two service_deployment lifecycle states: 'active' | 'ended'. */
export type ServiceDeploymentState = 'active' | 'ended';

/** The three propagation states an effector run can leave a deployment in:
 *  'pending' | 'applied' | 'failed'. */
export type ServiceDeploymentPropagationState = 'pending' | 'applied' | 'failed';

/** ServiceDeployment — a service_deployment row: per-{domain} lifecycle-accounting.
 *  state = 'active' | 'ended'; endingAt = the single expiry clock (null = permanent);
 *  enforceActions = opaque JSON/CSV of effects EMITTED at end-of-lease (SHIPS DARK);
 *  propagationState = 'pending'|'applied'|'failed'. */
export interface ServiceDeployment {
  id: string;
  domain: string;
  serviceKey: string;
  profileRef: string | null;
  state: ServiceDeploymentState;
  createdAt: string;
  endingAt: string | null;
  enforceActions: string | null;
  propagationState: ServiceDeploymentPropagationState;
  endedAt: string | null;
  createdBySubject: string;
}

/** Body for create — POST .../{domain}/deployments. domain is the PATH (never a
 *  body field). profileRef/endingAt/enforceActions all nullable. */
export interface CreateDeployment {
  serviceKey: string;
  profileRef?: string | null;
  endingAt?: string | null;
  enforceActions?: string | null;
}

/**
 * The FOUR Service Catalog service SOURCES a deployment can be provisioned FROM — the
 * `ServiceSource.Kind` enum the admin-bff effector (PR #67,
 * `appstore/ServiceSource.java`) parses from `sourceKind` (case-insensitive;
 * null/blank → SELECT). All four converge on the SAME deploy path (per-service
 * Casdoor role → route-access rule → ArgoCD Application), but two need an image
 * BUILT first:
 *
 *   SELECT     — a curated catalog tile referencing a PRE-BUILT image. Deploys today.
 *   GIT        — a git/GitLab repo that builds its own image (its own CI). Deploys today.
 *   DOCKERFILE — a dropped Dockerfile that must be BUILT in-cluster first. DEPENDS on
 *                the Kaniko builder (generator) — guarded with a 400 until it exists.
 *   ZIP        — an uploaded zip-as-repo that must be BUILT in-cluster first. DEPENDS
 *                on the Kaniko builder — guarded with a 400 until it exists.
 *
 * `requiresBuilder(kind)` mirrors `ServiceSource.Kind.requiresBuilder()`: DOCKERFILE
 * + ZIP need the in-cluster builder, so the UI presents them disabled+helptext (the
 * SHIPS-DARK degrade) and the bff is the authoritative 400 if one is forced through.
 */
export type ServiceSourceKind = 'SELECT' | 'GIT' | 'DOCKERFILE' | 'ZIP';

/** The four source kinds, in console display order (SELECT/GIT live, then the two
 *  builder-gated). */
export const SERVICE_SOURCE_KINDS: readonly ServiceSourceKind[] = [
  'SELECT',
  'GIT',
  'DOCKERFILE',
  'ZIP',
] as const;

/** Mirrors `ServiceSource.Kind.requiresBuilder()` — DOCKERFILE/ZIP need the
 *  in-cluster Kaniko builder (the generator leg) before an image exists. This is the
 *  STATIC per-kind fact (which sources need a builder at all); whether a builder is
 *  actually AVAILABLE on this deployment is the separate, LIVE {@link BuilderStatus}
 *  signal below — a kind should only be presented enabled when BOTH hold. */
export function requiresBuilder(kind: ServiceSourceKind): boolean {
  return kind === 'DOCKERFILE' || kind === 'ZIP';
}

/**
 * The LIVE Kaniko-builder capability pre-flight — GET
 * `/bff/superadmin/service-store/builder` (admin-bff `ServiceCatalogBuilderController`).
 * Two independent signals, BOTH required for a DOCKERFILE/ZIP source to actually build:
 *
 *   enabled          — the `app.appstore.builder.enabled` config flag on THIS
 *                       deployment (whether the `KanikoBuildLauncher` bean is wired at
 *                       all). NECESSARY but not SUFFICIENT.
 *   buildNodePresent — a live, read-only, fail-safe k8s probe for at least one
 *                       labelled x86/amd64 build Node. `false` (with a `warnings` entry)
 *                       on ANY probe error/denial — never a faked `true`.
 *
 * A real build is possible only when BOTH are `true`. The bff's `AddServiceEffector`
 * 400-guard remains the AUTHORITATIVE gate regardless of what this reports — this is a
 * pre-flight UI signal only.
 */
export interface BuilderStatus {
  enabled: boolean;
  buildNodePresent: boolean;
  warnings: string[];
}

/** True only when BOTH the config flag and the live build-node probe say yes — the
 *  single boolean the UI un-gates DOCKERFILE/ZIP on. */
export function builderReady(status: BuilderStatus): boolean {
  return status.enabled && status.buildNodePresent;
}

/**
 * Body for provision — POST .../{domain}/deployments/{id}/provision. Mirrors the
 * admin-bff `ProvisionServiceRequest` record (PR #67): `sourceKind` is one of the
 * four kinds (case-insensitive at the bff); `repoUrl` is the descriptor/GitOps repo
 * ArgoCD watches and is REQUIRED (`@NotBlank`); `path` (null → ".") and
 * `targetRevision` (null → HEAD) are optional.
 */
export interface ProvisionService {
  sourceKind: ServiceSourceKind;
  repoUrl: string;
  path?: string | null;
  targetRevision?: string | null;
}

// ---------------------------------------------------------------------------
// CREATE-AND-FEDERATE WIZARD — the SUPERADMIN scaffold + federate surface
// (admin-bff ServiceStoreWizardController, /bff/superadmin/service-store/**). The
// wizard SCAFFOLDS a starter codebase from an embedded archetype catalog, records
// the intent, and (optionally) FEDERATES the deployment's UI into the federation
// manifest. Both scaffold + federate are step-up-gated (X-ServiceStore-StepUp).
// ---------------------------------------------------------------------------

/** ScaffoldArchetype — one embedded starter-codebase template offered by
 *  GET .../scaffold/archetypes. `kind` is the archetype family
 *  (backend|remote-shell|host|fragment); the spring-bff archetype relocates a Java
 *  package, so its derived slug must be Java-package-safe (see {@link ARCHETYPE_JAVA_PACKAGE}). */
export interface ScaffoldArchetype {
  name: string;
  displayName: string;
  description: string;
  kind: string;
}

/** ServiceScaffold — a service_scaffold row: the persisted per-{domain} scaffold intent
 *  (state = 'requested' | 'archived'). */
export interface ServiceScaffold {
  id: string;
  domain: string;
  serviceKey: string;
  archetype: string;
  displayName: string | null;
  mountAt: string | null;
  requiresRole: string | null;
  state: string;
  createdBySubject: string;
  createdAt: string;
  updatedAt: string;
}

/** Body for scaffold create — POST .../{domain}/scaffold. Mirrors the admin-bff
 *  ScaffoldServiceRequest: serviceKey (@NotBlank @Size(128)), displayName (nullable),
 *  archetype (@Pattern ^[a-z0-9-]{1,64}$, a catalog member), mountAt (nullable,
 *  @Pattern ^/[A-Za-z0-9/_-]*$), requiresRole (nullable @Size(32)). */
export interface ScaffoldRequest {
  serviceKey: string;
  displayName?: string | null;
  archetype: string;
  mountAt?: string | null;
  requiresRole?: string | null;
}

/** Body for federate — POST .../deployments/{id}/federate. Mirrors the admin-bff
 *  FederateServiceRequest: slug (@Pattern ^[a-z0-9-]{1,64}$), mountAt (@Pattern
 *  ^/[A-Za-z0-9/_-]*$), exposedModule (e.g. ./routes), remoteEntryUrl (validated like
 *  repoUrl), kind (default remote-shell), visibility (default internal), requiresRole. */
export interface FederateRequest {
  slug: string;
  mountAt: string;
  exposedModule: string;
  remoteEntryUrl: string;
  kind?: string | null;
  visibility?: string | null;
  requiresRole?: string | null;
}

/** FederateOutcome — POST .../federate result. `federationReal` is false while the
 *  federation registration ships dark (app.appstore.federation.enabled=false — the
 *  NoopFederationModuleClient makes no real registration); `gitopsDescriptorPending` is
 *  always true until the GitOps descriptor automation exists. The wizard renders BOTH
 *  honestly (never fakes a real federation). */
export interface FederateOutcome {
  deployment: ServiceDeployment | null;
  federationReal: boolean;
  gitopsDescriptorPending: boolean;
}

/** FederationStatus — GET .../federation. `enabled` is whether the federation
 *  registration is REAL (the RestFederationModuleClient is wired); `warnings` carries the
 *  ships-dark explanation when it is not. */
export interface FederationStatus {
  enabled: boolean;
  warnings: string[];
}

/** The DNS-label / k8s slug of a serviceKey — mirrors the admin-bff PerServiceIdentity.slug
 *  used to derive APP_SLUG + the default federation slug. Lowercase, dots→'-', any other
 *  char→'-', collapsed + trimmed; empty → 'x'. */
export function serviceSlug(raw: string): string {
  const s = (raw ?? '')
    .toLowerCase()
    .replace(/\./g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-+)|(-+$)/g, '');
  return s.length === 0 ? 'x' : s;
}

/** The archetype names whose rendered APP_SLUG must be Java-package-safe (^[a-z0-9]+$,
 *  no hyphens) — mirrors admin-bff ScaffoldCatalog.JAVA_PACKAGE_ARCHETYPES. The wizard
 *  surfaces this constraint before submit so the operator isn't surprised by the bff 400. */
export const ARCHETYPE_JAVA_PACKAGE: readonly string[] = ['spring-bff'] as const;

/** True when the archetype relocates a Java package, so the derived slug must be
 *  ^[a-z0-9]+$ (no hyphens). */
export function archetypeNeedsJavaPackageSlug(archetype: string): boolean {
  return ARCHETYPE_JAVA_PACKAGE.includes(archetype);
}

/** A typed error the service raises so components can surface the EXACT failure
 *  the bff returned — in particular the 403 the SUPERADMIN gate returns (the
 *  canonical default-deny signal), the 404 (a profile/deployment that is gone),
 *  and the 409 (a duplicate app_profile name). */
export class ServiceCatalogApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ServiceCatalogApiError';
  }
  /** A 403 — the SUPERADMIN @PreAuthorize / coarse /bff/superadmin/** gate denying.
   *  The server-authoritative denial (the UI gating is only convenience). */
  get isForbidden(): boolean {
    return this.status === 403;
  }
  /** A 404 — the named profile / addressed deployment is gone. */
  get isNotFound(): boolean {
    return this.status === 404;
  }
  /** A 409 — a duplicate app_profile name on create. */
  get isConflict(): boolean {
    return this.status === 409;
  }
  /** A 400 — a bad request: in the Service Catalog this is the AddServiceEffector
   *  guard (a DOCKERFILE/ZIP source forced through before the in-cluster Kaniko
   *  builder exists, or a missing/blank repoUrl). The server `message` carries the
   *  reason, which the UI surfaces verbatim. */
  get isBadRequest(): boolean {
    return this.status === 400;
  }
  /** A step-up-required 403 — the ServiceStoreStepUpGate on the scaffold/federate
   *  writes. The platform's contract is a 403 whose message contains "requires
   *  step-up" (there is no separate structured signal — the free-text phrase IS the
   *  contract, matched narrowly so an ordinary superadmin-denial 403, which never
   *  carries that phrase, is NOT mistaken for it). The wizard offers the step-up
   *  token challenge + retry instead of a bare error. */
  get isStepUpRequired(): boolean {
    return this.status === 403 && /requires step-up/i.test(this.message);
  }
}

/**
 * Thin reactive wrapper over the hugmesh-admin-bff-api Service Catalog surfaces. Auth
 * rides on the HttpOnly `bff_` cookie (the same opaque `bff_session` the other BFF
 * surfaces use) — the host injects nothing and the module never renders a login
 * form.
 *
 * <p><b>ng-openapi-gen migration:</b> this service now DELEGATES every call to the
 * generated, typed clients ({@link ServiceCurationControllerService} /
 * {@link AppProfileControllerService} / {@link ServiceDeploymentControllerService} /
 * {@link AdminServiceStoreControllerService}, under {@code src/app/api}, generated
 * from the admin-bff-api OpenAPI spec) instead of hand-rolling {@code fetch} URLs.
 * The generated clients call the SAME same-origin {@code /bff/**} paths (their
 * {@code rootUrl} is set from {@link SERVICE_CATALOG_BASE_URL}, default ''), so the
 * wire calls — URL + method + body — are unchanged. The HttpOnly {@code bff_}
 * cookie is sent by the {@code bffAuthInterceptor} (which sets
 * {@code withCredentials: true}), preserving the opaque {@code bff_session} auth
 * exactly (the fe-gateway turns the cookie into the upstream Bearer server-side).
 * This service keeps its OWN public {@link ServiceCuration} / {@link AppProfile} /
 * {@link ServiceDeployment} / {@link ServiceCatalogApiError} types so the consuming
 * components need ZERO change; the generated models are bridged at the delegation
 * boundary, and {@code HttpErrorResponse}s are mapped back to
 * {@link ServiceCatalogApiError} so the 400/403/404/409 surfacing is identical.
 *
 * The methods map 1:1 to the bff endpoints (see each method). EVERY write/list is
 * SUPERADMIN-only at the bff (the /bff/superadmin/** coarse gate + the per-method
 * @PreAuthorize("hasRole('SUPERADMIN')")); the ONE admin-tier read is
 * /bff/admin/service-store (hasAnyRole('ADMIN','SUPERADMIN')). The UI gating is
 * convenience — the bff is the AUTHORITATIVE gate, so every method surfaces a 403
 * as an ServiceCatalogApiError(403) the caller renders gracefully.
 */
@Injectable({ providedIn: 'root' })
export class ServiceCatalogService {
  private readonly base = inject(SERVICE_CATALOG_BASE_URL);
  private readonly curationApi = inject(ServiceCurationControllerService);
  private readonly profileApi = inject(AppProfileControllerService);
  private readonly deploymentApi = inject(ServiceDeploymentControllerService);
  private readonly adminApi = inject(AdminServiceStoreControllerService);
  private readonly builderApi = inject(ServiceCatalogBuilderControllerService);
  private readonly wizardApi = inject(ServiceStoreWizardControllerService);

  constructor() {
    // Point every generated client at the configured base (default '' = same
    // origin, what the fe-gateway proxies). Mirrors the previous `${this.base}`
    // prefix on the hand-rolled fetch URLs, so URL assertions stay valid.
    this.curationApi.rootUrl = this.base;
    this.profileApi.rootUrl = this.base;
    this.deploymentApi.rootUrl = this.base;
    this.adminApi.rootUrl = this.base;
    this.builderApi.rootUrl = this.base;
    this.wizardApi.rootUrl = this.base;
  }

  /** Map a caught error to a {@link ServiceCatalogApiError} so the 400/403/404/409
   *  surfacing the UI keys off is identical to the pre-migration fetch layer. The
   *  bff returns a JSON {@code {message|error}} body; never let a parse miss mask
   *  the status. */
  private toApiError(method: string, path: string, e: unknown): never {
    if (e instanceof HttpErrorResponse) {
      const body = e.error;
      let detail = '';
      if (typeof body === 'string') {
        detail = body;
      } else if (body && typeof body === 'object') {
        const record = body as Record<string, unknown>;
        detail = (record['message'] as string) ?? (record['error'] as string) ?? '';
      }
      throw new ServiceCatalogApiError(
        e.status,
        detail || `${method} ${path} failed: ${e.status}`,
      );
    }
    throw e;
  }

  // ----- CURATION (SUPERADMIN): /bff/superadmin/service-store/{domain} -----

  /** GET /bff/superadmin/service-store/{domain} → ServiceCuration[] — the per-domain
   *  catalog (offered + withdrawn) for a {domain}. */
  async listCuration(domain: string): Promise<ServiceCuration[]> {
    try {
      const rows = await this.curationApi.serviceCurationList({ domain });
      return rows as unknown as ServiceCuration[];
    } catch (e) {
      return this.toApiError('GET', `/bff/superadmin/service-store/${domain}`, e);
    }
  }

  /** POST /bff/superadmin/service-store/{domain}/offer {serviceKey} → ServiceCuration —
   *  offer a service_key to a {domain}'s admins. domain is the PATH target; the
   *  acting superadmin subject is stamped from the JWT (never a body field). */
  async offer(domain: string, serviceKey: string): Promise<ServiceCuration> {
    try {
      const row = await this.curationApi.serviceCurationOffer({ domain, body: { serviceKey } });
      return row as unknown as ServiceCuration;
    } catch (e) {
      return this.toApiError('POST', `/bff/superadmin/service-store/${domain}/offer`, e);
    }
  }

  /** POST /bff/superadmin/service-store/{domain}/withdraw {serviceKey} → ServiceCuration —
   *  withdraw a service_key from a {domain}'s offered catalog (CAS offered->withdrawn). */
  async withdraw(domain: string, serviceKey: string): Promise<ServiceCuration> {
    try {
      const row = await this.curationApi.serviceCurationWithdraw({ domain, body: { serviceKey } });
      return row as unknown as ServiceCuration;
    } catch (e) {
      return this.toApiError('POST', `/bff/superadmin/service-store/${domain}/withdraw`, e);
    }
  }

  // ----- APP PROFILES (SUPERADMIN): /bff/superadmin/app-profiles ----------

  /** GET /bff/superadmin/app-profiles → AppProfile[] — the global template library. */
  async listProfiles(): Promise<AppProfile[]> {
    try {
      const rows = await this.profileApi.appProfileList();
      return rows as unknown as AppProfile[];
    } catch (e) {
      return this.toApiError('GET', '/bff/superadmin/app-profiles', e);
    }
  }

  /** GET /bff/superadmin/app-profiles/{name} → AppProfile. */
  async getProfile(name: string): Promise<AppProfile> {
    try {
      const row = await this.profileApi.appProfileGet({ name });
      return row as unknown as AppProfile;
    } catch (e) {
      return this.toApiError('GET', `/bff/superadmin/app-profiles/${name}`, e);
    }
  }

  /** POST /bff/superadmin/app-profiles {name, profileJson} → AppProfile (201). A
   *  duplicate name is a 409. */
  async createProfile(name: string, profileJson: string): Promise<AppProfile> {
    try {
      const row = await this.profileApi.appProfileCreate({ body: { name, profileJson } });
      return row as unknown as AppProfile;
    } catch (e) {
      return this.toApiError('POST', '/bff/superadmin/app-profiles', e);
    }
  }

  /** PUT /bff/superadmin/app-profiles/{name} {name(ignored), profileJson} → AppProfile.
   *  The PATH name identifies the row; the body name is ignored. */
  async updateProfile(name: string, profileJson: string): Promise<AppProfile> {
    try {
      const row = await this.profileApi.appProfileUpdate({ name, body: { name, profileJson } });
      return row as unknown as AppProfile;
    } catch (e) {
      return this.toApiError('PUT', `/bff/superadmin/app-profiles/${name}`, e);
    }
  }

  /** DELETE /bff/superadmin/app-profiles/{name} → 204. */
  async deleteProfile(name: string): Promise<void> {
    try {
      await this.profileApi.appProfileDelete({ name });
    } catch (e) {
      return this.toApiError('DELETE', `/bff/superadmin/app-profiles/${name}`, e);
    }
  }

  // ----- DEPLOYMENTS (SUPERADMIN): .../{domain}/deployments ---------------

  /** GET /bff/superadmin/service-store/{domain}/deployments → ServiceDeployment[] —
   *  the lifecycle-accounting rows for a {domain}. */
  async listDeployments(domain: string): Promise<ServiceDeployment[]> {
    try {
      const rows = await this.deploymentApi.serviceDeploymentList({ domain });
      return rows as unknown as ServiceDeployment[];
    } catch (e) {
      return this.toApiError('GET', `/bff/superadmin/service-store/${domain}/deployments`, e);
    }
  }

  /** POST /bff/superadmin/service-store/{domain}/deployments {serviceKey, profileRef?,
   *  endingAt?, enforceActions?} → ServiceDeployment (201). Records created_at (now) +
   *  ending_at (the expiry clock) + enforce_actions. SHIPS DARK — the actual
   *  provision/teardown is a LATER effector increment, not wired here. */
  async createDeployment(domain: string, body: CreateDeployment): Promise<ServiceDeployment> {
    try {
      const row = await this.deploymentApi.serviceDeploymentCreate({ domain, body: body as any });
      return row as unknown as ServiceDeployment;
    } catch (e) {
      return this.toApiError('POST', `/bff/superadmin/service-store/${domain}/deployments`, e);
    }
  }

  /** POST /bff/superadmin/service-store/{domain}/deployments/{id}/end → ServiceDeployment —
   *  CAS active->ended (the row is retained as the audit trail). */
  async endDeployment(domain: string, id: string): Promise<ServiceDeployment> {
    try {
      const row = await this.deploymentApi.serviceDeploymentEnd({ domain, id });
      return row as unknown as ServiceDeployment;
    } catch (e) {
      return this.toApiError('POST', `/bff/superadmin/service-store/${domain}/deployments/${id}/end`, e);
    }
  }

  /** POST /bff/superadmin/service-store/{domain}/deployments/{id}/provision
   *  {sourceKind, repoUrl, path?, targetRevision?} → ServiceDeployment — drive an
   *  EXISTING service_deployment row through the AddServiceEffector (PR #67):
   *  per-service Casdoor role → route-access rule → ArgoCD Application.
   *
   *  SELECT/GIT provision (the effector itself SHIPS DARK — the default NoopArgoCdClient
   *  makes no real ArgoCD mutation — but the call still returns 200). DOCKERFILE/ZIP are
   *  rejected by the bff with a 400 "requires the in-cluster builder (Kaniko)" until the
   *  generator's builder exists, so the UI guards them (disabled+helptext) AND surfaces
   *  that 400 gracefully if one is forced through. A missing/blank repoUrl is also a 400
   *  at the bff (@NotBlank). The {domain} is the explicit PATH target. */
  async provisionDeployment(domain: string, id: string, body: ProvisionService): Promise<ServiceDeployment> {
    try {
      const row = await this.deploymentApi.serviceDeploymentProvision({ domain, id, body: body as any });
      return row as unknown as ServiceDeployment;
    } catch (e) {
      return this.toApiError(
        'POST',
        `/bff/superadmin/service-store/${domain}/deployments/${id}/provision`,
        e,
      );
    }
  }

  // ----- TWO-TIER ADMIN READ (ADMIN|SUPERADMIN): /bff/admin/service-store --

  /** GET /bff/admin/service-store → ServiceCuration[] — the BOTTOM tier: ONLY the
   *  services the superadmin OFFERED to the CALLER'S OWN issuer-derived domain.
   *  An admin sees only their own brand; a superadmin (unscoped) sees all. The
   *  domain is resolved from the validated JWT, NEVER a request field. */
  async myDomainCatalog(): Promise<ServiceCuration[]> {
    try {
      const rows = await this.adminApi.adminServiceStoreMyDomainCatalog();
      return rows as unknown as ServiceCuration[];
    } catch (e) {
      return this.toApiError('GET', '/bff/admin/service-store', e);
    }
  }

  // ----- BUILDER CAPABILITY (SUPERADMIN): /bff/superadmin/service-store/builder ---

  /** GET /bff/superadmin/service-store/builder → {@link BuilderStatus} — the LIVE
   *  Kaniko-builder pre-flight (config flag + x86 build-node presence) the
   *  Add-a-Service view consults to un-gate DOCKERFILE/ZIP only when a real build is
   *  actually possible, instead of the static always-disabled {@link requiresBuilder}
   *  gate alone. */
  async builderStatus(): Promise<BuilderStatus> {
    try {
      const body = await this.builderApi.serviceCatalogBuilderStatus();
      return {
        enabled: Boolean((body as any)?.enabled),
        buildNodePresent: Boolean((body as any)?.buildNodePresent),
        warnings: Array.isArray((body as any)?.warnings) ? (body as any).warnings : [],
      };
    } catch (e) {
      return this.toApiError('GET', '/bff/superadmin/service-store/builder', e);
    }
  }

  // ----- CREATE-AND-FEDERATE WIZARD (SUPERADMIN): /bff/superadmin/service-store/** ---

  /** GET /bff/superadmin/service-store/scaffold/archetypes → {@link ScaffoldArchetype}[] —
   *  the embedded starter-codebase catalog the archetype step renders as cards. */
  async listArchetypes(): Promise<ScaffoldArchetype[]> {
    try {
      const rows = await this.wizardApi.serviceScaffoldArchetypes();
      return (rows ?? []).map((a) => ({
        name: a.name ?? '',
        displayName: a.displayName ?? a.name ?? '',
        description: a.description ?? '',
        kind: a.kind ?? '',
      }));
    } catch (e) {
      return this.toApiError('GET', '/bff/superadmin/service-store/scaffold/archetypes', e);
    }
  }

  /** POST /bff/superadmin/service-store/{domain}/scaffold {serviceKey, displayName?,
   *  archetype, mountAt?, requiresRole?} → {@link ServiceScaffold} (201) — mint the starter
   *  codebase intent. STEP-UP-GATED: a fresh token is carried in the X-ServiceStore-StepUp
   *  header; a missing/invalid one is a 403 with the "requires step-up" contract
   *  ({@link ServiceCatalogApiError.isStepUpRequired}). A bad archetype / non-package-safe
   *  slug is a 400 whose message is surfaced verbatim. */
  async createScaffold(
    domain: string,
    body: ScaffoldRequest,
    stepUpToken?: string,
  ): Promise<ServiceScaffold> {
    try {
      const row = await this.wizardApi.serviceScaffoldCreate({
        domain,
        'X-ServiceStore-StepUp': stepUpToken?.trim() || undefined,
        body: body as any,
      });
      return row as unknown as ServiceScaffold;
    } catch (e) {
      return this.toApiError('POST', `/bff/superadmin/service-store/${domain}/scaffold`, e);
    }
  }

  /** The direct, same-origin GET href for the rendered scaffold archive
   *  (application/zip). The download rides the HttpOnly bff_ cookie, so a plain
   *  anchor href works — no in-JS blob fetch needed. */
  scaffoldArchiveUrl(domain: string, id: string): string {
    return (
      `${this.base}/bff/superadmin/service-store/` +
      `${encodeURIComponent(domain)}/scaffold/${encodeURIComponent(id)}/archive`
    );
  }

  /** POST /bff/superadmin/service-store/{domain}/deployments/{id}/federate {slug, mountAt,
   *  exposedModule, remoteEntryUrl, kind?, visibility?, requiresRole?} → {@link FederateOutcome}
   *  — register the deployment's UI into the federation manifest. STEP-UP-GATED (same
   *  X-ServiceStore-StepUp contract as scaffold). The outcome reports federationReal +
   *  gitopsDescriptorPending HONESTLY (both dark/pending by default) — the wizard renders
   *  them as explicit notices, never faking a real federation. */
  async federateDeployment(
    domain: string,
    id: string,
    body: FederateRequest,
    stepUpToken?: string,
  ): Promise<FederateOutcome> {
    try {
      const out = await this.wizardApi.serviceDeploymentFederate({
        domain,
        id,
        'X-ServiceStore-StepUp': stepUpToken?.trim() || undefined,
        body: body as any,
      });
      return {
        deployment: (out?.deployment as unknown as ServiceDeployment) ?? null,
        federationReal: Boolean(out?.federationReal),
        gitopsDescriptorPending: out?.gitopsDescriptorPending !== false,
      };
    } catch (e) {
      return this.toApiError(
        'POST',
        `/bff/superadmin/service-store/${domain}/deployments/${id}/federate`,
        e,
      );
    }
  }

  /** GET /bff/superadmin/service-store/federation → {@link FederationStatus} — the LIVE
   *  federate-leg pre-flight the federation step consults: `enabled` false (with a
   *  ships-dark `warnings` entry) means a federate call still records the intent but makes
   *  no real manifest registration. */
  async federationStatus(): Promise<FederationStatus> {
    try {
      const body = await this.wizardApi.serviceCatalogFederationStatus();
      return {
        enabled: Boolean((body as any)?.enabled),
        warnings: Array.isArray((body as any)?.warnings) ? (body as any).warnings : [],
      };
    } catch (e) {
      return this.toApiError('GET', '/bff/superadmin/service-store/federation', e);
    }
  }
}
