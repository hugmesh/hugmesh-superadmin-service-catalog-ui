import { Injectable, InjectionToken, inject } from '@angular/core';

/** Base URL of the admin BFF. The fe-gateway proxies same-origin /bff/** to
 *  snapdragon-admin-bff-api, so the default is the empty string = same origin.
 *  `globalThis.__SNAP_APPSTORE_URL__` lets the host override the target at
 *  runtime (mirrors the other remotes' __SNAP_*_URL__ globals). */
export const APPSTORE_BASE_URL = new InjectionToken<string>('APPSTORE_BASE_URL', {
  factory: () => (globalThis as any).__SNAP_APPSTORE_URL__ ?? '',
});

// ---------------------------------------------------------------------------
// Contract — mirrors snapdragon-admin-bff-api appstore records (Jackson serialises
// them camelCase): ServiceCuration / AppProfile / ServiceDeployment + the request
// DTOs ServiceCurationRequest / AppProfileRequest / ServiceDeploymentRequest.
// These are the EXACT JSON shapes the bff returns; when its /v3/api-docs is
// captured, `npm run gen` regenerates src/app/api/ from openapi.json and this
// service becomes the thin wrapper over the generated client — the public method
// signatures here are the stable contract. See README "Typed API client".
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
 * The FOUR App-Store service SOURCES a deployment can be provisioned FROM — the
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
 *  in-cluster Kaniko builder (the generator leg) before an image exists. */
export function requiresBuilder(kind: ServiceSourceKind): boolean {
  return kind === 'DOCKERFILE' || kind === 'ZIP';
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
export class AppstoreApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppstoreApiError';
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
  /** A 400 — a bad request: in the App-Store this is the AddServiceEffector
   *  guard (a DOCKERFILE/ZIP source forced through before the in-cluster Kaniko
   *  builder exists, or a missing/blank repoUrl). The server `message` carries the
   *  reason, which the UI surfaces verbatim. */
  get isBadRequest(): boolean {
    return this.status === 400;
  }
}

/**
 * Thin reactive wrapper over the snapdragon-admin-bff-api App-Store surfaces. Auth
 * piggybacks on the shared-session `bffToken` (the same Bearer the other BFF
 * surfaces use) read from `snap.session` in localStorage — the host injects
 * nothing and the module never renders a login form.
 *
 * The methods map 1:1 to the bff endpoints (see each method). EVERY write/list is
 * SUPERADMIN-only at the bff (the /bff/superadmin/** coarse gate + the per-method
 * @PreAuthorize("hasRole('SUPERADMIN')")); the ONE admin-tier read is
 * /bff/admin/service-store (hasAnyRole('ADMIN','SUPERADMIN')). The UI gating is
 * convenience — the bff is the AUTHORITATIVE gate, so every method surfaces a 403
 * as an AppstoreApiError(403) the caller renders gracefully.
 */
@Injectable({ providedIn: 'root' })
export class AppstoreService {
  private readonly base = inject(APPSTORE_BASE_URL);

  // ----- token / headers --------------------------------------------------

  private bffToken(): string | null {
    try {
      const s = JSON.parse(localStorage.getItem('snap.session') ?? 'null');
      return s?.bffToken ?? null;
    } catch {
      return null;
    }
  }

  private headers(json = false): Record<string, string> {
    const h: Record<string, string> = { Accept: 'application/json' };
    const t = this.bffToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  /** Issue a request to an ABSOLUTE bff path (the caller passes the full
   *  /bff/... path so the EXACT PR1 URL is visible at the call site and asserted
   *  in the spec). */
  private async req<T>(method: string, path: string, body?: unknown): Promise<T> {
    const r = await fetch(`${this.base}${path}`, {
      method,
      headers: this.headers(body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!r.ok) {
      // Read a server message (the bff returns a JSON {error|message}) but never
      // let a parse failure mask the status the UI keys off.
      let detail = '';
      try {
        const txt = await r.text();
        if (txt) {
          try {
            const j = JSON.parse(txt);
            detail = j.message ?? j.error ?? txt;
          } catch {
            detail = txt;
          }
        }
      } catch {
        /* ignore */
      }
      throw new AppstoreApiError(r.status, detail || `${method} ${path} failed: ${r.status}`);
    }
    const text = await r.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  // ----- CURATION (SUPERADMIN): /bff/superadmin/service-store/{domain} -----

  /** GET /bff/superadmin/service-store/{domain} → ServiceCuration[] — the per-domain
   *  catalog (offered + withdrawn) for a {domain}. */
  listCuration(domain: string): Promise<ServiceCuration[]> {
    return this.req<ServiceCuration[]>('GET', `/bff/superadmin/service-store/${encodeURIComponent(domain)}`);
  }

  /** POST /bff/superadmin/service-store/{domain}/offer {serviceKey} → ServiceCuration —
   *  offer a service_key to a {domain}'s admins. domain is the PATH target; the
   *  acting superadmin subject is stamped from the JWT (never a body field). */
  offer(domain: string, serviceKey: string): Promise<ServiceCuration> {
    return this.req<ServiceCuration>(
      'POST',
      `/bff/superadmin/service-store/${encodeURIComponent(domain)}/offer`,
      { serviceKey },
    );
  }

  /** POST /bff/superadmin/service-store/{domain}/withdraw {serviceKey} → ServiceCuration —
   *  withdraw a service_key from a {domain}'s offered catalog (CAS offered->withdrawn). */
  withdraw(domain: string, serviceKey: string): Promise<ServiceCuration> {
    return this.req<ServiceCuration>(
      'POST',
      `/bff/superadmin/service-store/${encodeURIComponent(domain)}/withdraw`,
      { serviceKey },
    );
  }

  // ----- APP PROFILES (SUPERADMIN): /bff/superadmin/app-profiles ----------

  /** GET /bff/superadmin/app-profiles → AppProfile[] — the global template library. */
  listProfiles(): Promise<AppProfile[]> {
    return this.req<AppProfile[]>('GET', '/bff/superadmin/app-profiles');
  }

  /** GET /bff/superadmin/app-profiles/{name} → AppProfile. */
  getProfile(name: string): Promise<AppProfile> {
    return this.req<AppProfile>('GET', `/bff/superadmin/app-profiles/${encodeURIComponent(name)}`);
  }

  /** POST /bff/superadmin/app-profiles {name, profileJson} → AppProfile (201). A
   *  duplicate name is a 409. */
  createProfile(name: string, profileJson: string): Promise<AppProfile> {
    return this.req<AppProfile>('POST', '/bff/superadmin/app-profiles', { name, profileJson });
  }

  /** PUT /bff/superadmin/app-profiles/{name} {name(ignored), profileJson} → AppProfile.
   *  The PATH name identifies the row; the body name is ignored. */
  updateProfile(name: string, profileJson: string): Promise<AppProfile> {
    return this.req<AppProfile>(
      'PUT',
      `/bff/superadmin/app-profiles/${encodeURIComponent(name)}`,
      { name, profileJson },
    );
  }

  /** DELETE /bff/superadmin/app-profiles/{name} → 204. */
  deleteProfile(name: string): Promise<void> {
    return this.req<void>('DELETE', `/bff/superadmin/app-profiles/${encodeURIComponent(name)}`);
  }

  // ----- DEPLOYMENTS (SUPERADMIN): .../{domain}/deployments ---------------

  /** GET /bff/superadmin/service-store/{domain}/deployments → ServiceDeployment[] —
   *  the lifecycle-accounting rows for a {domain}. */
  listDeployments(domain: string): Promise<ServiceDeployment[]> {
    return this.req<ServiceDeployment[]>(
      'GET',
      `/bff/superadmin/service-store/${encodeURIComponent(domain)}/deployments`,
    );
  }

  /** POST /bff/superadmin/service-store/{domain}/deployments {serviceKey, profileRef?,
   *  endingAt?, enforceActions?} → ServiceDeployment (201). Records created_at (now) +
   *  ending_at (the expiry clock) + enforce_actions. SHIPS DARK — the actual
   *  provision/teardown is a LATER effector increment, not wired here. */
  createDeployment(domain: string, body: CreateDeployment): Promise<ServiceDeployment> {
    return this.req<ServiceDeployment>(
      'POST',
      `/bff/superadmin/service-store/${encodeURIComponent(domain)}/deployments`,
      body,
    );
  }

  /** POST /bff/superadmin/service-store/{domain}/deployments/{id}/end → ServiceDeployment —
   *  CAS active->ended (the row is retained as the audit trail). */
  endDeployment(domain: string, id: string): Promise<ServiceDeployment> {
    return this.req<ServiceDeployment>(
      'POST',
      `/bff/superadmin/service-store/${encodeURIComponent(domain)}/deployments/${encodeURIComponent(id)}/end`,
    );
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
  provisionDeployment(domain: string, id: string, body: ProvisionService): Promise<ServiceDeployment> {
    return this.req<ServiceDeployment>(
      'POST',
      `/bff/superadmin/service-store/${encodeURIComponent(domain)}/deployments/${encodeURIComponent(id)}/provision`,
      body,
    );
  }

  // ----- TWO-TIER ADMIN READ (ADMIN|SUPERADMIN): /bff/admin/service-store --

  /** GET /bff/admin/service-store → ServiceCuration[] — the BOTTOM tier: ONLY the
   *  services the superadmin OFFERED to the CALLER'S OWN issuer-derived domain.
   *  An admin sees only their own brand; a superadmin (unscoped) sees all. The
   *  domain is resolved from the validated JWT, NEVER a request field. */
  myDomainCatalog(): Promise<ServiceCuration[]> {
    return this.req<ServiceCuration[]>('GET', '/bff/admin/service-store');
  }
}
