import { Injectable, signal, computed } from '@angular/core';

export interface SnapSession {
  id: string;                 // casdoor identity, e.g. google:alice@gmail.com
  label: string;              // display (email or discord handle)
  provider: 'google' | 'discord';
  roles: string[];
  registrationComplete: boolean;
}

/** Holds the logged-in session (persisted to localStorage) and derives the
 *  Casdoor-style role flags the Service Catalog console gates its views on.
 *
 *  This is the canonical Snapdragon SessionService (copied from snapdragon-owncast-ui /
 *  snapdragon-wiki-ui / snapdragon-admin-ui, the references with the full role-tier
 *  accessors) so this remote gates on the SAME JWT-derived signals as the other
 *  consoles. Roles are the lowercase Casdoor roles 'user'/'mod'/'admin'/'superadmin'.
 *  The reserved-prefix ROLE_/DOMAIN_ has already been stripped upstream (the gateway /
 *  BFF converter), so the role strings here are the bare lowercase tokens.
 *
 *  ── The Service Catalog role model (mirrors snapdragon-admin-bff-api SecurityConfig +
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
  private readonly key = 'snap.session';
  private readonly channel = 'snap-session-change';
  readonly session = signal<SnapSession | null>(this.load());
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

  private load(): SnapSession | null {
    try { const raw = localStorage.getItem(this.key); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  }
  set(s: SnapSession): void { localStorage.setItem(this.key, JSON.stringify(s)); this.session.set(s); this.broadcast(); }
  patch(p: Partial<SnapSession>): void { const s = this.session(); if (s) this.set({ ...s, ...p }); }
  clear(): void { localStorage.removeItem(this.key); this.session.set(null); this.broadcast(); }
  /** Notify the other in-page SessionService instances (host + remotes) to re-read. */
  private broadcast(): void { if (typeof window !== 'undefined') window.dispatchEvent(new Event(this.channel)); }
}
