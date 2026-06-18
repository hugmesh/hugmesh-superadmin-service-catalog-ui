import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Standalone dev shell for the Superadmin Service Catalog remote. Only used when this
 * remote is run on its own (`ng serve service-catalog`); in production the
 * snapdragon.systems host federates `./ServiceCatalog` (SERVICE_CATALOG_ROUTES) directly and
 * mounts them at /service-catalog — this shell is not loaded.
 */
@Component({
  selector: 'snap-service-catalog-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
