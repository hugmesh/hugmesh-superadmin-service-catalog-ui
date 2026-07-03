import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { ServiceCurationControllerService } from './api/services/service-curation-controller.service';
import { AppProfileControllerService } from './api/services/app-profile-controller.service';
import { ServiceDeploymentControllerService } from './api/services/service-deployment-controller.service';
import { AdminServiceStoreControllerService } from './api/services/admin-service-store-controller.service';
import { ServiceCatalogBuilderControllerService } from './api/services/service-catalog-builder-controller.service';

/** Base URL of the admin BFF. The fe-gateway proxies same-origin /bff/** to
 *  snapdragon-admin-bff-api, so the default is the empty string = same origin.
 *  `globalThis.__SNAP_SERVICE_CATALOG_URL__` lets the host override the target at
 *  runtime (mirrors the other remotes' __SNAP_*_URL__ globals). */
export const SERVICE_CATALOG_BASE_URL = new InjectionToken<string>('SERVICE_CATALOG_BASE_URL', {
  factory: () => (globalThis as any).__SNAP_SERVICE_CATALOG_URL__ ?? '',
});

// ---------------------------------------------------------------------------
// Contract — mirrors snapdragon-admin-bff-api serviceCatalog records (Jackson serialises
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

/** ServiceCuration — a service_curation row: per-{domain} offered-catalog record.
 *  state = 'offered' (live in the catalog) | 'withdrawn' (CAS audit trail). */
export interface ServiceCuration {
  id: string;
  domain: string;
  serviceKey: string;
  state: string;
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

/** ServiceDeployment — a service_deployment row: per-{domain} lifecycle-accounting.
 *  state = 'active' | 'ended'; endingAt = the single expiry clock (null = permanent);
 *  enforceActions = opaque JSON/CSV of effects EMITTED at end-of-lease (SHIPS DARK);
 *  propagationState = 'pending'|'applied'|'failed'. */
export interface ServiceDeployment {
  id: string;
  domain: string;
  serviceKey: string;
  profileRef: string | null;
  state: string;
  createdAt: string;
  endingAt: string | null;
  enforceActions: string | null;
  propagationState: string;
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
}

/**
 * Thin reactive wrapper over the snapdragon-admin-bff-api Service Catalog surfaces. Auth
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

  constructor() {
    // Point every generated client at the configured base (default '' = same
    // origin, what the fe-gateway proxies). Mirrors the previous `${this.base}`
    // prefix on the hand-rolled fetch URLs, so URL assertions stay valid.
    this.curationApi.rootUrl = this.base;
    this.profileApi.rootUrl = this.base;
    this.deploymentApi.rootUrl = this.base;
    this.adminApi.rootUrl = this.base;
    this.builderApi.rootUrl = this.base;
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
        detail = (body as any).message ?? (body as any).error ?? '';
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
}
