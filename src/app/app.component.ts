import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Standalone dev shell for the Superadmin App-Store remote. Only used when this
 * remote is run on its own (`ng serve appstore`); in production the
 * snapdragon.systems host federates `./Appstore` (APPSTORE_ROUTES) directly and
 * mounts them at /appstore — this shell is not loaded.
 */
@Component({
  selector: 'snap-appstore-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
