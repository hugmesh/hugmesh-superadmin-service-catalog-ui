import { Component, OnInit, inject, signal } from '@angular/core';
import { SessionService } from './session.service';
import { ServiceCatalogService, ServiceCuration, ServiceCatalogApiError } from './service-catalog.service';

/**
 * The within-Service Catalog privilege-boundary screen. Reached when the superadminGuard
 * denies activation — an admin / mod / user hitting the SUPERADMIN-only console.
 * NOT an auth failure — the host already authgated the user in — so this explains
 * the MISSING role rather than bouncing to /login.
 *
 * It mirrors how the bff handles the authoritative denial (a 403 from the
 * @PreAuthorize / coarse /bff/superadmin/** gate): the UI gating only HIDES the
 * write console; this screen is the graceful landing when the deeper gate says no.
 *
 * The DEGRADE PATH: an ADMIN can still READ their own brand's offered catalog (the
 * two-tier /bff/admin/service-store surface, hasAnyRole('ADMIN','SUPERADMIN')). So
 * for an admin this screen ALSO loads + shows that read-only catalog (loading /
 * empty / error states), instead of a dead end. A mod/user sees only the message.
 */
@Component({
  selector: 'snap-service-catalog-forbidden',
  standalone: true,
  imports: [],
  templateUrl: './service-catalog-forbidden.component.html',
  styleUrl: './service-catalog-forbidden.component.scss',
})
export class ServiceCatalogForbiddenComponent implements OnInit {
  private readonly session = inject(SessionService);
  private readonly serviceCatalog = inject(ServiceCatalogService);

  /** Whether to attempt the read-only two-tier catalog (admin|superadmin). */
  readonly canReadOwnCatalog = this.session.canReadOwnCatalog;

  readonly loading = signal(false);
  readonly error = signal('');
  readonly catalog = signal<ServiceCuration[] | null>(null);

  trackId = (_: number, c: ServiceCuration): string => c.id;

  ngOnInit(): void {
    if (this.canReadOwnCatalog()) void this.loadCatalog();
  }

  async loadCatalog(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const rows = await this.serviceCatalog.myDomainCatalog();
      this.catalog.set(rows.filter((r) => r.state === 'offered'));
    } catch (e) {
      this.catalog.set(null);
      if (e instanceof ServiceCatalogApiError && (e.isForbidden || e.isNotFound)) {
        // 403/404 degrade gracefully — show nothing rather than a scary error.
        this.catalog.set([]);
      } else {
        this.error.set('Could not load your domain’s offered catalog. Please try again.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
