import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceCatalogProfilesComponent } from './service-catalog-profiles.component';
import { ServiceCatalogService, AppProfile, ServiceCatalogApiError } from './service-catalog.service';
import { accessibleName } from './accessible-name';
import { DEFAULT_APP_PROFILE_JSON } from './app-profile-schema';

function prof(name: string, profileJson = '{"resources":{"cpu":"500m"}}'): AppProfile {
  return {
    id: 'p-' + name, name, profileJson,
    createdBySubject: 's', createdAt: 'T', updatedAt: 'T',
  };
}

/** The [data-field] paths of the rendered field-error list (empty when none is shown). */
function refusedFields(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll('[data-testid="service-catalog-profile-schema-errors"] li'))
    .map((li) => li.getAttribute('data-field') ?? '');
}

describe('ServiceCatalogProfilesComponent (app_profile CRUD)', () => {
  let fixture: ComponentFixture<ServiceCatalogProfilesComponent>;
  let component: ServiceCatalogProfilesComponent;
  let serviceCatalog: jasmine.SpyObj<
    Pick<ServiceCatalogService, 'listProfiles' | 'createProfile' | 'updateProfile' | 'deleteProfile'>
  >;

  async function build(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ServiceCatalogProfilesComponent],
      providers: [{ provide: ServiceCatalogService, useValue: serviceCatalog }],
    }).compileComponents();
    fixture = TestBed.createComponent(ServiceCatalogProfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    serviceCatalog = jasmine.createSpyObj('ServiceCatalogService', [
      'listProfiles', 'createProfile', 'updateProfile', 'deleteProfile',
    ]);
    serviceCatalog.listProfiles.and.resolveTo([]);
    serviceCatalog.createProfile.and.resolveTo(prof('small-postgres'));
    serviceCatalog.updateProfile.and.resolveTo(prof('small-postgres'));
    serviceCatalog.deleteProfile.and.resolveTo(undefined);
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('loads + shows the EMPTY state when there are no profiles', async () => {
    serviceCatalog.listProfiles.and.resolveTo([]);
    await build();
    expect(serviceCatalog.listProfiles).toHaveBeenCalled();
    expect(el().querySelector('[data-testid="service-catalog-profiles-empty"]')).not.toBeNull();
  });

  it('lists existing profiles', async () => {
    serviceCatalog.listProfiles.and.resolveTo([prof('small-postgres'), prof('big-gpu')]);
    await build();
    const list = el().querySelector('[data-testid="service-catalog-profiles-list"]')!;
    expect(list.textContent).toContain('small-postgres');
    expect(list.textContent).toContain('big-gpu');
  });

  it('create posts {name, profileJson} and reloads', async () => {
    await build();
    component.name.set('small-postgres');
    component.profileJson.set('{"resources":{"cpu":"500m"}}');
    await component.submit();
    fixture.detectChanges();
    expect(serviceCatalog.createProfile).toHaveBeenCalledWith('small-postgres', '{"resources":{"cpu":"500m"}}');
    expect(serviceCatalog.listProfiles).toHaveBeenCalledTimes(2);
    expect(el().querySelector('[data-testid="service-catalog-profiles-notice"]')).not.toBeNull();
  });

  it('the untouched DEFAULT body is schema-valid and saves as typed (the e2e creates a profile by name alone)', async () => {
    await build();
    component.name.set('defaults');
    await component.submit();
    fixture.detectChanges();
    expect(serviceCatalog.createProfile).toHaveBeenCalledWith('defaults', DEFAULT_APP_PROFILE_JSON.trim());
    expect(el().querySelector('[data-testid="service-catalog-profile-json-error"]')).toBeNull();
  });

  it('a profile using every schema section saves', async () => {
    await build();
    component.name.set('full');
    const body = JSON.stringify({
      resources: { cpu: '1', memory: '1Gi' },
      roles: ['ROLE_ADMIN'],
      certs: { altNames: ['owncast.acme-be.svc.cluster.local'], ttl: '720h' },
      exposure: { routes: ['/api/owncast/**'], ports: [8080], mfaRequired: false },
    });
    component.profileJson.set(body);
    await component.submit();
    fixture.detectChanges();
    expect(serviceCatalog.createProfile).toHaveBeenCalledWith('full', body);
    expect(el().querySelector('[data-testid="service-catalog-profile-json-error"]')).toBeNull();
  });

  it('a blank body saves as {} (the minimal valid profile)', async () => {
    await build();
    component.name.set('empty');
    component.profileJson.set('   ');
    await component.submit();
    expect(serviceCatalog.createProfile).toHaveBeenCalledWith('empty', '{}');
  });

  it('blocks a create when the JSON is malformed (UI-side validation, no round-trip)', async () => {
    await build();
    component.name.set('bad');
    component.profileJson.set('{not json');
    await component.submit();
    fixture.detectChanges();
    expect(serviceCatalog.createProfile).not.toHaveBeenCalled();
    const box = el().querySelector('[data-testid="service-catalog-profile-json-error"]')!;
    expect(box).not.toBeNull();
    expect(box.textContent).toContain('not valid JSON');
    expect(refusedFields(el())).toEqual(['$']);
  });

  it('refuses an UNKNOWN top-level field (the legacy flat {"cpu"} body) and names it, without a round-trip', async () => {
    await build();
    component.name.set('legacy');
    component.profileJson.set('{"cpu":"500m","memory":"512Mi"}');
    await component.submit();
    fixture.detectChanges();
    expect(serviceCatalog.createProfile).not.toHaveBeenCalled();
    const box = el().querySelector('[data-testid="service-catalog-profile-json-error"]')!;
    expect(box.textContent).toContain('does not match the app-profile schema');
    expect(refusedFields(el())).toEqual(['cpu', 'memory']);
    expect(box.textContent).toContain('unknown field');
    expect(box.textContent).toContain('resources, roles, certs, exposure');
  });

  it('caps the rendered error list and says how many are not shown (validation runs on every keystroke)', async () => {
    await build();
    const cap = ServiceCatalogProfilesComponent.MAX_RENDERED_ERRORS;
    const bogus: Record<string, number> = {};
    for (let i = 0; i < cap + 7; i++) bogus[`bogus${i}`] = i;
    component.name.set('many');
    component.profileJson.set(JSON.stringify(bogus));
    await component.submit();
    fixture.detectChanges();
    expect(serviceCatalog.createProfile).not.toHaveBeenCalled();
    expect(component.schemaErrors().length).toBe(cap);
    expect(refusedFields(el()).length).toBe(cap);
    expect(component.hiddenErrorCount()).toBe(7);
    const more = el().querySelector('[data-testid="service-catalog-profile-schema-errors-more"]')!;
    expect(more).not.toBeNull();
    expect(more.textContent).toContain('7 more');
  });

  it('shows no overflow line when every error fits under the cap', async () => {
    await build();
    component.name.set('few');
    component.profileJson.set('{"cpu":"500m","memory":"512Mi"}');
    await component.submit();
    fixture.detectChanges();
    expect(component.hiddenErrorCount()).toBe(0);
    expect(el().querySelector('[data-testid="service-catalog-profile-schema-errors-more"]')).toBeNull();
  });

  it('refuses an unknown NESTED field, naming its dotted path', async () => {
    await build();
    component.name.set('nested');
    component.profileJson.set('{"resources":{"cpu":"500m","limits":{}}}');
    await component.submit();
    fixture.detectChanges();
    expect(serviceCatalog.createProfile).not.toHaveBeenCalled();
    expect(refusedFields(el())).toEqual(['resources.limits']);
  });

  it('refuses a wrong TYPE, naming the field', async () => {
    await build();
    component.name.set('typed');
    component.profileJson.set('{"resources":{"cpu":500},"exposure":{"mfaRequired":"yes"}}');
    await component.submit();
    fixture.detectChanges();
    expect(serviceCatalog.createProfile).not.toHaveBeenCalled();
    expect(refusedFields(el())).toEqual(['resources.cpu', 'exposure.mfaRequired']);
    expect(el().querySelector('[data-field="resources.cpu"]')!.textContent).toContain('must be a string');
    expect(el().querySelector('[data-field="exposure.mfaRequired"]')!.textContent).toContain('must be a boolean');
  });

  it('refuses a value outside its PATTERN / RANGE, naming the array item', async () => {
    await build();
    component.name.set('ranged');
    component.profileJson.set('{"resources":{"memory":"512MB"},"roles":["admin"],"exposure":{"ports":[0]}}');
    await component.submit();
    fixture.detectChanges();
    expect(serviceCatalog.createProfile).not.toHaveBeenCalled();
    expect(refusedFields(el())).toEqual(['resources.memory', 'roles[0]', 'exposure.ports[0]']);
    expect(el().querySelector('[data-field="roles[0]"]')!.textContent).toContain('ROLE_');
    expect(el().querySelector('[data-field="exposure.ports[0]"]')!.textContent).toContain('at least 1');
  });

  it('refuses DUPLICATE array items, naming the later one', async () => {
    await build();
    component.name.set('dup-items');
    component.profileJson.set('{"roles":["ROLE_ADMIN","ROLE_ADMIN"]}');
    await component.submit();
    fixture.detectChanges();
    expect(serviceCatalog.createProfile).not.toHaveBeenCalled();
    expect(refusedFields(el())).toEqual(['roles[1]']);
  });

  it('the error list clears once the body is corrected and the save then goes through', async () => {
    await build();
    component.name.set('fixed');
    component.profileJson.set('{"resources":{"cpu":"lots"}}');
    await component.submit();
    fixture.detectChanges();
    expect(refusedFields(el())).toEqual(['resources.cpu']);
    component.profileJson.set('{"resources":{"cpu":"2"}}');
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="service-catalog-profile-json-error"]')).toBeNull();
    await component.submit();
    expect(serviceCatalog.createProfile).toHaveBeenCalledWith('fixed', '{"resources":{"cpu":"2"}}');
  });

  it('opening a pre-schema row for edit shows its field errors at once, and the update is refused until fixed', async () => {
    serviceCatalog.listProfiles.and.resolveTo([prof('legacy', '{"cpu":"500m"}')]);
    await build();
    component.editProfile(prof('legacy', '{"cpu":"500m"}'));
    fixture.detectChanges();
    expect(refusedFields(el())).toEqual(['cpu']);
    await component.submit();
    expect(serviceCatalog.updateProfile).not.toHaveBeenCalled();
    component.profileJson.set('{"resources":{"cpu":"500m"}}');
    await component.submit();
    expect(serviceCatalog.updateProfile).toHaveBeenCalledWith('legacy', '{"resources":{"cpu":"500m"}}');
  });

  it('blocks a create when the name is blank', async () => {
    await build();
    component.name.set('   ');
    component.profileJson.set('{}');
    await component.submit();
    expect(serviceCatalog.createProfile).not.toHaveBeenCalled();
  });

  it('edit switches to update mode and PUTs by the existing name', async () => {
    serviceCatalog.listProfiles.and.resolveTo([prof('small-postgres')]);
    await build();
    component.editProfile(prof('small-postgres'));
    fixture.detectChanges();
    expect(component.mode()).toBe('edit');
    component.profileJson.set('{"resources":{"cpu":"1"}}');
    await component.submit();
    expect(serviceCatalog.updateProfile).toHaveBeenCalledWith('small-postgres', '{"resources":{"cpu":"1"}}');
  });

  it('delete calls deleteProfile and reloads', async () => {
    serviceCatalog.listProfiles.and.resolveTo([prof('small-postgres')]);
    await build();
    await component.deleteProfile(prof('small-postgres'));
    expect(serviceCatalog.deleteProfile).toHaveBeenCalledWith('small-postgres');
  });

  it('surfaces a 409 (duplicate name) clearly', async () => {
    await build();
    component.name.set('dup');
    component.profileJson.set('{}');
    serviceCatalog.createProfile.and.rejectWith(new ServiceCatalogApiError(409, 'dup'));
    await component.submit();
    fixture.detectChanges();
    const err = el().querySelector('[data-testid="service-catalog-profiles-form-error"]')!;
    expect(err.textContent).toContain('already exists');
  });

  it('surfaces a 400 (the bff\'s own validation reason) VERBATIM, never a generic flash', async () => {
    await build();
    component.name.set('huge');
    component.profileJson.set('{}');
    // The message ServiceCatalogService.toApiError builds from the bff's real
    // {error:"validation failed", fields:{profileJson:"profileJson is too long"}} body
    // (asserted on the wire in service-catalog.service.spec.ts).
    serviceCatalog.createProfile.and.rejectWith(
      new ServiceCatalogApiError(400, 'validation failed: profileJson is too long'),
    );
    await component.submit();
    fixture.detectChanges();
    const err = el().querySelector('[data-testid="service-catalog-profiles-form-error"]')!;
    expect(err.textContent).toContain('profileJson is too long');
    expect(err.textContent).not.toContain('Could not save the profile');
  });

  it('a 400 WITHOUT a server message still gets a specific rejection notice', async () => {
    await build();
    component.name.set('x');
    component.profileJson.set('{}');
    serviceCatalog.createProfile.and.rejectWith(new ServiceCatalogApiError(400, ''));
    await component.submit();
    fixture.detectChanges();
    const err = el().querySelector('[data-testid="service-catalog-profiles-form-error"]')!;
    expect(err.textContent).toContain('rejected this profile');
  });

  it('shows the ERROR state on a non-auth list failure', async () => {
    serviceCatalog.listProfiles.and.rejectWith(new ServiceCatalogApiError(500, 'boom'));
    await build();
    expect(el().querySelector('[data-testid="service-catalog-profiles-error"]')).not.toBeNull();
  });

  it('degrades a 403 on the list to the empty state (graceful)', async () => {
    serviceCatalog.listProfiles.and.rejectWith(new ServiceCatalogApiError(403, 'forbidden'));
    await build();
    expect(el().querySelector('[data-testid="service-catalog-profiles-empty"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="service-catalog-profiles-error"]')).toBeNull();
  });

  it('every form control + row action has an accessible name (a11y)', async () => {
    serviceCatalog.listProfiles.and.resolveTo([prof('small-postgres')]);
    await build();
    const controls = Array.from(el().querySelectorAll('input, textarea, button')) as HTMLElement[];
    for (const c of controls) {
      expect(accessibleName(c)).withContext(c.outerHTML).toBeTruthy();
    }
  });
});
