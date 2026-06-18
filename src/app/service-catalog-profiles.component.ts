import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ServiceCatalogService, AppProfile, ServiceCatalogApiError } from './service-catalog.service';

type Mode = 'create' | 'edit';

/**
 * The APP PROFILES view — SUPERADMIN CRUD over the global deploy-template library
 * (/bff/superadmin/app-profiles, AppProfileController). A profile is a name + an
 * opaque profileJson (resource/role/cert/exposure defaults) a deployment can
 * reference by name.
 *
 *   list   → GET    /bff/superadmin/app-profiles
 *   create → POST   /bff/superadmin/app-profiles        {name, profileJson}   (201; 409 on dup)
 *   update → PUT    /bff/superadmin/app-profiles/{name}  {name, profileJson}  (path name wins)
 *   delete → DELETE /bff/superadmin/app-profiles/{name}                       (204)
 *
 * The editor validates that profileJson PARSES as JSON before submit (a malformed
 * template is a UI-side block, not a server round-trip). loading / empty / error
 * states; a 403/404/409 each surfaces a clear message.
 */
@Component({
  selector: 'snap-service-catalog-profiles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-catalog-profiles.component.html',
  styleUrl: './service-catalog-profiles.component.scss',
})
export class ServiceCatalogProfilesComponent implements OnInit {
  private readonly serviceCatalog = inject(ServiceCatalogService);

  // ── list ──
  readonly profiles = signal<AppProfile[] | null>(null);
  readonly listLoading = signal(false);
  readonly listError = signal('');

  // ── editor ──
  readonly mode = signal<Mode>('create');
  readonly name = signal('');
  readonly profileJson = signal('{\n  "cpu": "500m",\n  "memory": "512Mi"\n}');
  readonly busy = signal(false);
  readonly formError = signal('');
  readonly notice = signal('');
  readonly touched = signal(false);

  trackId = (_: number, p: AppProfile): string => p.id;

  ngOnInit(): void {
    void this.reload();
  }

  nameInvalid(): boolean {
    return this.touched() && this.mode() === 'create' && this.name().trim().length === 0;
  }
  /** Whether profileJson parses as JSON (empty = allowed → treated as "{}"). */
  jsonValid(): boolean {
    const raw = this.profileJson().trim();
    if (raw.length === 0) return true;
    try {
      JSON.parse(raw);
      return true;
    } catch {
      return false;
    }
  }
  jsonInvalid(): boolean {
    return this.touched() && !this.jsonValid();
  }
  formValid(): boolean {
    if (this.mode() === 'create' && this.name().trim().length === 0) return false;
    return this.jsonValid();
  }

  async reload(): Promise<void> {
    this.listLoading.set(true);
    this.listError.set('');
    try {
      this.profiles.set(await this.serviceCatalog.listProfiles());
    } catch (e) {
      this.profiles.set(null);
      if (e instanceof ServiceCatalogApiError && (e.isForbidden || e.isNotFound)) {
        this.profiles.set([]);
      } else {
        this.listError.set('Could not load the app profiles. Please try again.');
      }
    } finally {
      this.listLoading.set(false);
    }
  }

  newProfile(): void {
    this.mode.set('create');
    this.name.set('');
    this.profileJson.set('{\n  "cpu": "500m",\n  "memory": "512Mi"\n}');
    this.formError.set('');
    this.notice.set('');
    this.touched.set(false);
  }

  editProfile(p: AppProfile): void {
    this.mode.set('edit');
    this.name.set(p.name);
    this.profileJson.set(p.profileJson ?? '');
    this.formError.set('');
    this.notice.set('');
    this.touched.set(false);
  }

  async submit(): Promise<void> {
    this.touched.set(true);
    this.formError.set('');
    this.notice.set('');
    if (!this.formValid()) return;
    this.busy.set(true);
    const json = this.profileJson().trim() || '{}';
    try {
      if (this.mode() === 'create') {
        const created = await this.serviceCatalog.createProfile(this.name().trim(), json);
        this.newProfile(); // reset the form first (it clears the notice)…
        this.notice.set(`Created profile “${created.name}”.`); // …then announce success
      } else {
        const updated = await this.serviceCatalog.updateProfile(this.name().trim(), json);
        this.notice.set(`Updated profile “${updated.name}”.`);
      }
      await this.reload();
    } catch (e) {
      this.formError.set(this.message(e));
    } finally {
      this.busy.set(false);
    }
  }

  async deleteProfile(p: AppProfile): Promise<void> {
    this.busy.set(true);
    this.formError.set('');
    this.notice.set('');
    try {
      await this.serviceCatalog.deleteProfile(p.name);
      if (this.mode() === 'edit' && this.name() === p.name) this.newProfile();
      this.notice.set(`Deleted profile “${p.name}”.`);
      await this.reload();
    } catch (e) {
      this.formError.set(this.message(e));
    } finally {
      this.busy.set(false);
    }
  }

  private message(e: unknown): string {
    if (e instanceof ServiceCatalogApiError) {
      if (e.isForbidden) return 'The server denied this action — superadmin is required to manage profiles.';
      if (e.isConflict) return 'A profile with that name already exists. Choose a different name.';
      if (e.isNotFound) return 'That profile no longer exists.';
    }
    return 'Could not save the profile. Please try again.';
  }
}
