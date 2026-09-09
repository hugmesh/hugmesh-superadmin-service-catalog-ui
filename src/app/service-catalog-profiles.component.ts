import { Component, OnInit, inject, signal } from '@angular/core';
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
 * states; a 403/404/409 each surfaces a clear message, and a 400 surfaces the bff's
 * OWN reason verbatim — today that is only the size bound, rendered by
 * ServiceCatalogService as "validation failed: profileJson is too long" (the bff's
 * bean-validation body keeps the reason in `fields`, which the service folds into
 * the message). A content-validating resolver (issue #3) can speak through either
 * bff channel — bean validation (`fields`) or ApiException.badRequest (`{error}`) —
 * and both surface here without a UI change.
 */
@Component({
  selector: 'hug-service-catalog-profiles',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './service-catalog-profiles.component.html',
  styleUrl: './service-catalog-profiles.component.scss',
})
export class ServiceCatalogProfilesComponent implements OnInit {
  private readonly serviceCatalog = inject(ServiceCatalogService);

  // ── list ──
  /** The app profiles returned by `GET /bff/superadmin/app-profiles`, or null while loading. */
  readonly profiles = signal<AppProfile[] | null>(null);
  /** True while the list GET is in flight. */
  readonly listLoading = signal(false);
  /** Error from the list load — displayed in an aria-live region. */
  readonly listError = signal('');

  // ── editor ──
  /**
   * The current editor mode. `'create'` (new profile) or `'edit'` (updating an existing name).
   * Drives whether the name field is editable and whether submit calls POST or PUT.
   */
  readonly mode = signal<Mode>('create');
  /** The profile name field. Read-only (displays `p.name`) in edit mode. */
  readonly name = signal('');
  /**
   * The profile body as a JSON string. Defaults to a minimal `cpu`/`memory` example.
   * Validated client-side by `jsonValid()` before any submit to avoid a round-trip 400.
   */
  readonly profileJson = signal('{\n  "cpu": "500m",\n  "memory": "512Mi"\n}');
  /** True while a POST/PUT/DELETE call is in flight — disables action buttons. */
  readonly busy = signal(false);
  /** Inline error from the last form action — displayed in an `role=alert` live region. */
  readonly formError = signal('');
  /** Success notice from the last form action — displayed in an `role=status` live region. */
  readonly notice = signal('');
  /** Whether the form has been submitted at least once (activates inline validation display). */
  readonly touched = signal(false);

  /** `ngFor` track-by by database id (avoids DOM churn on list reload). */
  trackId = (_: number, p: AppProfile): string => p.id;

  ngOnInit(): void {
    // Load the profile list immediately on mount.
    void this.reload();
  }

  /** True when the name field is blank and the form has been touched in `'create'` mode. */
  nameInvalid(): boolean {
    return this.touched() && this.mode() === 'create' && this.name().trim().length === 0;
  }

  /**
   * Whether `profileJson` is parseable as JSON. An empty body is permitted — treated
   * as `'{}'` on submit (the simplest valid profile).
   *
   * @returns `true` when blank OR when the string parses without error.
   */
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

  /** True when the body has been touched AND `jsonValid()` returns false — activates the JSON error message. */
  jsonInvalid(): boolean {
    return this.touched() && !this.jsonValid();
  }

  /**
   * Whether the form may be submitted (name + JSON both valid for the current mode).
   *
   * @returns `false` when the name is blank in create mode, or when the JSON is malformed.
   */
  formValid(): boolean {
    if (this.mode() === 'create' && this.name().trim().length === 0) return false;
    return this.jsonValid();
  }

  /**
   * Reload the profile list from `GET /bff/superadmin/app-profiles`.
   * A 403/404 degrades to an empty list; any other error surfaces in `listError`.
   */
  async reload(): Promise<void> {
    this.listLoading.set(true);
    this.listError.set('');
    try {
      this.profiles.set(await this.serviceCatalog.listProfiles());
    } catch (e) {
      this.profiles.set(null);
      // 403 (not superadmin) and 404 degrade to the empty state — not a UI error.
      if (e instanceof ServiceCatalogApiError && (e.isForbidden || e.isNotFound)) {
        this.profiles.set([]);
      } else {
        this.listError.set('Could not load the app profiles. Please try again.');
      }
    } finally {
      this.listLoading.set(false);
    }
  }

  /**
   * Reset the editor to the `'create'` (new profile) form and clear any previous
   * errors or notices. Called after a successful create to ensure the form is ready
   * for the next new entry.
   */
  newProfile(): void {
    this.mode.set('create');
    this.name.set('');
    this.profileJson.set('{\n  "cpu": "500m",\n  "memory": "512Mi"\n}');
    this.formError.set('');
    this.notice.set('');
    this.touched.set(false);
  }

  /**
   * Load an existing profile into the editor for `'edit'` mode (PUT).
   * Populates `name` and `profileJson` from the list row; clears prior errors.
   *
   * @param p - The profile row from the list to load into the form.
   */
  editProfile(p: AppProfile): void {
    this.mode.set('edit');
    this.name.set(p.name);
    this.profileJson.set(p.profileJson ?? '');
    this.formError.set('');
    this.notice.set('');
    this.touched.set(false);
  }

  /**
   * Submit the editor form: creates (`POST /bff/superadmin/app-profiles`) or updates
   * (`PUT /bff/superadmin/app-profiles/{name}`) depending on `mode`. Validates
   * client-side before calling; reloads the list on success; surfaces error messages
   * from `ServiceCatalogApiError` (403 / 409 conflict / 404) without a generic flash.
   *
   * @throws BFF errors are caught and surfaced into `formError`.
   */
  async submit(): Promise<void> {
    this.touched.set(true);
    this.formError.set('');
    this.notice.set('');
    if (!this.formValid()) return;
    this.busy.set(true);
    // An empty body is treated as the minimal valid profile.
    const json = this.profileJson().trim() || '{}';
    try {
      if (this.mode() === 'create') {
        const created = await this.serviceCatalog.createProfile(this.name().trim(), json);
        this.newProfile(); // reset the form first (it clears the notice)…
        this.notice.set(`Created profile “${created.name}”.`); // …then set the notice on the clean form
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

  /**
   * Delete a profile (`DELETE /bff/superadmin/app-profiles/{name}`).
   * If the editor was open on the deleted profile, resets to create mode.
   * Reloads the list on success; surfaces BFF errors into `formError`.
   *
   * @param p - The profile to delete.
   * @throws BFF errors are caught and surfaced into `formError`.
   */
  async deleteProfile(p: AppProfile): Promise<void> {
    this.busy.set(true);
    this.formError.set('');
    this.notice.set('');
    try {
      await this.serviceCatalog.deleteProfile(p.name);
      // If the deleted profile was open in the editor, reset to create mode.
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
      // The bff message carries the exact reason (the size bound today; a template
      // content/schema rejection once the resolver lands). Surface it verbatim.
      if (e.isBadRequest) return e.message || 'The server rejected this profile.';
    }
    return 'Could not save the profile. Please try again.';
  }
}
