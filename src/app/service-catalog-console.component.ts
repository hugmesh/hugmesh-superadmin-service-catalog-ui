import { Component, ElementRef, QueryList, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from './session.service';

interface ServiceCatalogNavItem {
  path: string;
  label: string;
  /** accessibleName — the screen-reader announce for the link. */
  aria: string;
  /** the inline help text (sighted) linked via aria-describedby (no-sight). */
  help: string;
  show: () => boolean;
}

/**
 * The Superadmin Service Catalog console shell — a role-aware menubar (roving tabindex,
 * WAI-ARIA APG) over the SUPERADMIN-gated child views, plus the swappable content
 * outlet.
 *
 * The WHOLE console is SUPERADMIN (the infra control plane): all four nav items
 * are shown only to canManageStore (SUPERADMIN). A non-superadmin who reaches the
 * bundle sees an EMPTY menubar and the default route's superadminGuard sends them
 * to /service-catalog/forbidden.
 *   Add a service (add)         — provision a deployment via one of the 4 sources (effector PR #67).
 *   Curation     (curation)    — per-domain offered catalog (offer/withdraw a service_key).
 *   App profiles (profiles)    — app_profile deploy-template CRUD.
 *   Deployments  (deployments) — service_deployment lifecycle accounting.
 *
 * a11y: <nav role="menubar"> with roving tabindex + Arrow/Home/End keyboard
 * navigation; routerLinkActive marks the current view aria-current="page"; every
 * link carries an accessibleName + an aria-describedby help hint.
 */
@Component({
  selector: 'snap-service-catalog-console',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './service-catalog-console.component.html',
  styleUrl: './service-catalog-console.component.scss',
})
export class ServiceCatalogConsoleComponent {
  private readonly session = inject(SessionService);

  @ViewChildren('navlink') navLinks!: QueryList<ElementRef<HTMLAnchorElement>>;

  /** Index of the roving-tabindex'd item that currently holds tabindex=0. */
  active = 0;

  readonly items: ServiceCatalogNavItem[] = [
    {
      path: 'add',
      label: 'Add a service',
      aria: 'Add a service — provision a deployment from one of the four sources',
      help: 'Provision a recorded deployment into a real service from a catalog tile, a git/GitLab repo, a Dockerfile or a zip upload. Dockerfile and zip need the in-cluster builder, which is not available yet. Requires the superadmin role.',
      show: () => this.session.canManageStore(),
    },
    {
      path: 'curation',
      label: 'Curation',
      aria: 'Curation — offer or withdraw services for a domain',
      help: 'Offer a service to a domain’s admins, or withdraw it from their catalog. The domain is the explicit target. Requires the superadmin role.',
      show: () => this.session.canManageStore(),
    },
    {
      path: 'profiles',
      label: 'App profiles',
      aria: 'App profiles — create, edit and delete reusable deploy templates',
      help: 'Manage the global library of deploy templates (resource, role, cert and exposure defaults). A deployment can reference a profile by name. Requires the superadmin role.',
      show: () => this.session.canManageStore(),
    },
    {
      path: 'deployments',
      label: 'Deployments',
      aria: 'Deployments — view the deployment accounting and record a new deployment',
      help: 'Review the service deployment rows (state, created and ending clocks, enforce actions) and record a new deployment. The actual provision and teardown is a later increment. Requires the superadmin role.',
      show: () => this.session.canManageStore(),
    },
  ];

  /** The items actually rendered for this role. */
  visibleItems(): ServiceCatalogNavItem[] {
    return this.items.filter((i) => i.show());
  }

  /** Roving-tabindex helper — only the active item is tabbable; the rest are -1
   *  and reached with Arrow keys (WAI-ARIA menubar pattern). */
  tabindexFor(i: number): number {
    return i === this.active ? 0 : -1;
  }

  /** Arrow/Home/End keyboard navigation across the menubar. */
  onKey(event: KeyboardEvent, i: number): void {
    const count = this.visibleItems().length;
    if (count === 0) return;
    let next = i;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (i + 1) % count;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (i - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.active = next;
    const links = this.navLinks?.toArray() ?? [];
    links[next]?.nativeElement.focus();
  }
}
