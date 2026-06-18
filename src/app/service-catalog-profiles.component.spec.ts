import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceCatalogProfilesComponent } from './service-catalog-profiles.component';
import { ServiceCatalogService, AppProfile, ServiceCatalogApiError } from './service-catalog.service';
import { accessibleName } from './accessible-name';

function prof(name: string): AppProfile {
  return {
    id: 'p-' + name, name, profileJson: '{"cpu":"500m"}',
    createdBySubject: 's', createdAt: 'T', updatedAt: 'T',
  };
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
    component.profileJson.set('{"cpu":"500m"}');
    await component.submit();
    fixture.detectChanges();
    expect(serviceCatalog.createProfile).toHaveBeenCalledWith('small-postgres', '{"cpu":"500m"}');
    expect(serviceCatalog.listProfiles).toHaveBeenCalledTimes(2);
    expect(el().querySelector('[data-testid="service-catalog-profiles-notice"]')).not.toBeNull();
  });

  it('blocks a create when the JSON is malformed (UI-side validation, no round-trip)', async () => {
    await build();
    component.name.set('bad');
    component.profileJson.set('{not json');
    await component.submit();
    fixture.detectChanges();
    expect(serviceCatalog.createProfile).not.toHaveBeenCalled();
    expect(el().querySelector('[data-testid="service-catalog-profile-json-error"]')).not.toBeNull();
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
    component.profileJson.set('{"cpu":"1"}');
    await component.submit();
    expect(serviceCatalog.updateProfile).toHaveBeenCalledWith('small-postgres', '{"cpu":"1"}');
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
