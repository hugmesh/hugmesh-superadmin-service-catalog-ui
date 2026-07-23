import { Injectable, signal, computed } from '@angular/core';

/**
 * The session payload persisted to `localStorage['hug.session']` by the login remote
 * and read by this Service Catalog remote to gate its views. BFF requests authenticate
 * via the HttpOnly `bff_` cookie (see `auth.interceptor.ts`), not a token read from
 * this session.
 */
export interface HugSession {
  /** Casdoor subject — unique identity string, e.g. `google:alice@gmail.com`. */
  id: string;
  /** Human-readable display name (email or Discord handle). */
  label: string;
  /** The OIDC provider used to authenticate. */
  provider: 'google' | 'discord';
  /**
   * Lowercase Casdoor roles, `ROLE_`-prefix-stripped (e.g. `['admin', 'superadmin']`).
   * The Service Catalog gates on `'superadmin'` for the write console and `'admin'|'superadmin'` for the read view.
   */
  roles: string[];
  /** True once the user has completed the Casdoor registration wizard. */
  registrationComplete: boolean;
}

/** Holds the logged-in session (persisted to localStorage) and derives the
 *  Casdoor-style role flags the Service Catalog console gates its views on.
 *
 *  This is the canonical HugMesh SessionService (copied from hugmesh-owncast-ui /
 *  hugmesh-wiki-ui / hugmesh-admin-ui, the references with the full role-tier
 *  accessors) so this remote gates on the SAME JWT-derived signals as the other
 *  consoles. Roles are the lowercase Casdoor roles 'user'/'mod'/'admin'/'superadmin'.
 *  The reserved-prefix ROLE_/DOMAIN_ has already been stripped upstream (the gateway /
 *  BFF converter), so the role strings here are the bare lowercase tokens.
 *
 *  ── The Service Catalog role model (mirrors hugmesh-admin-bff-api SecurityConfig +
 *     ServiceCurationController / AppProfileController / ServiceDeploymentController /
 *     AdminServiceStoreController) ──
 *  SUPERADMIN  = the WHOLE infra control plane. Every /bff/superadmin/service-store +
 *                /bff/superadmin/app-profiles endpoint is @PreAuthorize("hasRole('SUPERADMIN')")
 *                AND walled at the coarse /bff/superadmin/** = hasRole('SUPERADMIN') gate.
 *                So the superadminGuard gates the ENTIRE console — curation, app profiles,
 *                deployment accounting — to SUPERADMIN only. An admin/mod/user is DENIED.
 *  ADMIN        = the two-tier READ floor. /bff/admin/service-store
 *                (hasAnyRole('ADMIN','SUPERADMIN')) returns ONLY the offered catalog for the
 *                admin's OWN issuer-derived domain. The console exposes this as a read-only
 *                "my domain's offered catalog" degrade path; it is NOT the write console.
 *
 *  The signals here are DEFENCE-IN-DEPTH (convenience gating). The admin-bff
 *  @PreAuthorize gates are authoritative; the UI never SHOWS an option the role cannot
 *  use, and still handles a 403/404 gracefully if the server disagrees. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly key = 'hug.session';
  private readonly channel = 'hug-session-change';
  readonly session = signal<HugSession | null>(this.load());
  readonly loggedIn = computed(() => this.session() !== null);

  /** The raw Casdoor roles of the current session (empty when logged out). */
  private readonly roles = computed(() => this.session()?.roles ?? []);

  /** USER tier: every authenticated user. Casdoor always grants 'user'; we treat
   *  any logged-in session as the USER tier. */
  readonly isUser = computed(() => this.loggedIn());

  /** ADMIN tier: a Casdoor 'admin' role. (A SUPERADMIN is NOT automatically an
   *  admin in the raw role set — the composites below add SUPERADMIN where the
   *  cascade requires it, matching the bff SpEL exactly.) */
  readonly isAdmin = computed(() => this.roles().includes('admin'));

  /** SUPERADMIN tier: a Casdoor 'superadmin' role. */
  readonly isSuperadmin = computed(() => this.roles().includes('superadmin'));

  /** MOD tier: a Casdoor 'mod' OR 'admin' role (the platform-wide defence-in-depth
   *  hasAnyRole('MOD','ADMIN')). The Service Catalog console grants a mod NOTHING — it
   *  exists only so the forbidden screen can describe the missing role. */
  readonly isMod = computed(() => {
    const r = this.roles();
    return r.includes('mod') || r.includes('admin');
  });

  // ── Service Catalog role composites (mirror the admin-bff path gates + the
  //    @PreAuthorize composites on each serviceCatalog controller) ──

  /** SUPERADMIN — gates the WHOLE console (curation write, app-profile CRUD,
   *  deployment list/create/end). Every /bff/superadmin/service-store +
   *  /bff/superadmin/app-profiles endpoint is hasRole('SUPERADMIN') at the bff, so
   *  the superadminGuard sends a non-superadmin (admin|mod|user) to /service-catalog/forbidden. */
  readonly canManageStore = computed(() => this.isSuperadmin());

  /** ADMIN | SUPERADMIN — the two-tier READ of /bff/admin/service-store (the
   *  offered catalog for the admin's OWN issuer-derived domain). Surfaced as the
   *  read-only degrade path; a SUPERADMIN sees it too (unscoped at the bff). */
  readonly canReadOwnCatalog = computed(() => this.isAdmin() || this.isSuperadmin());

  constructor() {
    // The host shell and each federated remote each hold their OWN SessionService
    // instance over the same localStorage key. Re-read on a same-document broadcast
    // (dispatched by whichever instance wrote) and on cross-tab storage events, so
    // every nav/guard reading this signal stays in sync.
    if (typeof window !== 'undefined') {
      window.addEventListener(this.channel, () => this.session.set(this.load()));
      window.addEventListener('storage', (e) => { if (e.key === this.key) this.session.set(this.load()); });
    }
  }

  /**
   * Read and parse the session from localStorage. Returns null on any parse error
   * (corrupt JSON, missing key) so callers never see an unhandled exception.
   */
  private load(): HugSession | null {
    try { const raw = localStorage.getItem(this.key); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  }

  /**
   * Persist a new session to localStorage, update the signal, and broadcast to
   * sibling instances so they reload immediately.
   *
   * @param s - The session payload to persist.
   */
  set(s: HugSession): void { localStorage.setItem(this.key, JSON.stringify(s)); this.session.set(s); this.broadcast(); }

  /**
   * Merge a partial update into the current session. A no-op when not logged in.
   *
   * @param p - The partial fields to merge into the current session.
   */
  patch(p: Partial<HugSession>): void { const s = this.session(); if (s) this.set({ ...s, ...p }); }

  /**
   * Remove the session from localStorage, clear the signal, and broadcast. Used by the
   * logout flow to ensure every remote drops its session immediately.
   */
  clear(): void { localStorage.removeItem(this.key); this.session.set(null); this.broadcast(); }

  /**
   * Fire a `hug-session-change` window event so every in-page `SessionService` instance
   * (host + each loaded remote) re-reads localStorage. Does nothing on SSR.
   */
  private broadcast(): void { if (typeof window !== 'undefined') window.dispatchEvent(new Event(this.channel)); }
}
