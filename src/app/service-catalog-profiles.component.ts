import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ServiceCatalogService, AppProfile, ServiceCatalogApiError } from './service-catalog.service';
import {
  APP_PROFILE_SECTIONS,
  AppProfileFieldError,
  DEFAULT_APP_PROFILE_JSON,
  validateAppProfile,
} from './app-profile-schema';

type Mode = 'create' | 'edit';

/**
 * The APP PROFILES view — SUPERADMIN CRUD over the global deploy-template library
 * (/bff/superadmin/app-profiles, AppProfileController). A profile is a name + a
 * profileJson document of resource/role/cert/exposure defaults a deployment can
 * reference by name.
 *
 *   list   → GET    /bff/superadmin/app-profiles
 *   create → POST   /bff/superadmin/app-profiles        {name, profileJson}   (201; 409 on dup)
 *   update → PUT    /bff/superadmin/app-profiles/{name}  {name, profileJson}  (path name wins)
 *   delete → DELETE /bff/superadmin/app-profiles/{name}                       (204)
 *
 * The editor validates profileJson against the COMMITTED SCHEMA
 * (schemas/app-profile.schema.json, via ./app-profile-schema) before submit: a
 * template that does not parse, or that parses but carries an unknown field, a wrong
 * type, or a value outside its pattern/range, is refused HERE with every offending
 * field named — no server round-trip. The bff validates the same schema on save
 * (issue #3, operator decision 2026-09-16 "A: define a schema"), so a body that
 * slips past this editor (a direct API call, a stale tab) is still refused server
 * side; that refusal surfaces verbatim through ServiceCatalogService, which folds a
 * bean-validation `fields` map ("resources.cpu: must match …") into the message and
 * passes an ApiException `{error}` through as-is. loading / empty / error states; a
 * 403/404/409 each surfaces a clear message.
 *
 * Opening an EXISTING profile for edit validates its stored body immediately, so a
 * row written before the schema existed (the flat {"cpu","memory"} form) shows what
 * must change rather than failing only on save.
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
   * The profile body as a JSON string. Defaults to the schema's own first example
   * (the `resources.cpu`/`memory` pair). Validated client-side against the committed
   * schema (`validation`) before any submit to avoid a round-trip 400.
   */
  readonly profileJson = signal(DEFAULT_APP_PROFILE_JSON);
  /** Schema validation of the current body, recomputed as the operator types. */
  readonly validation = computed(() => validateAppProfile(this.profileJson()));
  /** The schema's top-level sections, for the help text. */
  readonly sections = APP_PROFILE_SECTIONS.join(' / ');
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
   * Whether `profileJson` matches the committed app-profile schema. An empty body is
   * permitted — treated as `'{}'` on submit (the minimal valid profile).
   *
   * @returns `true` when blank OR when the text parses AND validates.
   */
  jsonValid(): boolean {
    return this.validation().ok;
  }

  /** True when the body has been touched AND `jsonValid()` returns false — activates the field-error list. */
  jsonInvalid(): boolean {
    return this.touched() && !this.jsonValid();
  }

  /** The field-level refusals for the current body (empty when valid). */
  schemaErrors(): AppProfileFieldError[] {
    const v = this.validation();
    return v.ok ? [] : v.errors;
  }

  /** The heading over the error list: a parse failure and a schema mismatch read differently. */
  schemaErrorsTitle(): string {
    const v = this.validation();
    if (v.ok) return '';
    return v.kind === 'json'
      ? 'The template is not valid JSON.'
      : 'The template does not match the app-profile schema (schemas/app-profile.schema.json):';
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
    this.profileJson.set(DEFAULT_APP_PROFILE_JSON);
    this.formError.set('');
    this.notice.set('');
    this.touched.set(false);
  }

  /**
   * Load an existing profile into the editor for `'edit'` mode (PUT).
   * Populates `name` and `profileJson` from the list row; clears prior errors. The
   * stored body is validated at once (`touched` is set), so a row written before the
   * schema existed shows its field errors on open instead of only on save.
   *
   * @param p - The profile row from the list to load into the form.
   */
  editProfile(p: AppProfile): void {
    this.mode.set('edit');
    this.name.set(p.name);
    this.profileJson.set(p.profileJson ?? '');
    this.formError.set('');
    this.notice.set('');
    this.touched.set(true);
  }

  /**
   * Submit the editor form: creates (`POST /bff/superadmin/app-profiles`) or updates
   * (`PUT /bff/superadmin/app-profiles/{name}`) depending on `mode`. Validates
   * client-side against the schema before calling (a refused body never leaves the
   * browser); reloads the list on success; surfaces error messages
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
      // The bff message carries the exact reason (the size bound, or the bff's own
      // schema refusal naming the field path). Surface it verbatim.
      if (e.isBadRequest) return e.message || 'The server rejected this profile.';
    }
    return 'Could not save the profile. Please try again.';
  }
}
