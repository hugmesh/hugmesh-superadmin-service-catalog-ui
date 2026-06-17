import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppstoreProfilesComponent } from './appstore-profiles.component';
import { AppstoreService, AppProfile, AppstoreApiError } from './appstore.service';
import { accessibleName } from './accessible-name';

function prof(name: string): AppProfile {
  return {
    id: 'p-' + name, name, profileJson: '{"cpu":"500m"}',
    createdBySubject: 's', createdAt: 'T', updatedAt: 'T',
  };
}

describe('AppstoreProfilesComponent (app_profile CRUD)', () => {
  let fixture: ComponentFixture<AppstoreProfilesComponent>;
  let component: AppstoreProfilesComponent;
  let appstore: jasmine.SpyObj<
    Pick<AppstoreService, 'listProfiles' | 'createProfile' | 'updateProfile' | 'deleteProfile'>
  >;

  async function build(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [AppstoreProfilesComponent],
      providers: [{ provide: AppstoreService, useValue: appstore }],
    }).compileComponents();
    fixture = TestBed.createComponent(AppstoreProfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    appstore = jasmine.createSpyObj('AppstoreService', [
      'listProfiles', 'createProfile', 'updateProfile', 'deleteProfile',
    ]);
    appstore.listProfiles.and.resolveTo([]);
    appstore.createProfile.and.resolveTo(prof('small-postgres'));
    appstore.updateProfile.and.resolveTo(prof('small-postgres'));
    appstore.deleteProfile.and.resolveTo(undefined);
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('loads + shows the EMPTY state when there are no profiles', async () => {
    appstore.listProfiles.and.resolveTo([]);
    await build();
    expect(appstore.listProfiles).toHaveBeenCalled();
    expect(el().querySelector('[data-testid="appstore-profiles-empty"]')).not.toBeNull();
  });

  it('lists existing profiles', async () => {
    appstore.listProfiles.and.resolveTo([prof('small-postgres'), prof('big-gpu')]);
    await build();
    const list = el().querySelector('[data-testid="appstore-profiles-list"]')!;
    expect(list.textContent).toContain('small-postgres');
    expect(list.textContent).toContain('big-gpu');
  });

  it('create posts {name, profileJson} and reloads', async () => {
    await build();
    component.name.set('small-postgres');
    component.profileJson.set('{"cpu":"500m"}');
    await component.submit();
    fixture.detectChanges();
    expect(appstore.createProfile).toHaveBeenCalledWith('small-postgres', '{"cpu":"500m"}');
    expect(appstore.listProfiles).toHaveBeenCalledTimes(2);
    expect(el().querySelector('[data-testid="appstore-profiles-notice"]')).not.toBeNull();
  });

  it('blocks a create when the JSON is malformed (UI-side validation, no round-trip)', async () => {
    await build();
    component.name.set('bad');
    component.profileJson.set('{not json');
    await component.submit();
    fixture.detectChanges();
    expect(appstore.createProfile).not.toHaveBeenCalled();
    expect(el().querySelector('[data-testid="appstore-profile-json-error"]')).not.toBeNull();
  });

  it('blocks a create when the name is blank', async () => {
    await build();
    component.name.set('   ');
    component.profileJson.set('{}');
    await component.submit();
    expect(appstore.createProfile).not.toHaveBeenCalled();
  });

  it('edit switches to update mode and PUTs by the existing name', async () => {
    appstore.listProfiles.and.resolveTo([prof('small-postgres')]);
    await build();
    component.editProfile(prof('small-postgres'));
    fixture.detectChanges();
    expect(component.mode()).toBe('edit');
    component.profileJson.set('{"cpu":"1"}');
    await component.submit();
    expect(appstore.updateProfile).toHaveBeenCalledWith('small-postgres', '{"cpu":"1"}');
  });

  it('delete calls deleteProfile and reloads', async () => {
    appstore.listProfiles.and.resolveTo([prof('small-postgres')]);
    await build();
    await component.deleteProfile(prof('small-postgres'));
    expect(appstore.deleteProfile).toHaveBeenCalledWith('small-postgres');
  });

  it('surfaces a 409 (duplicate name) clearly', async () => {
    await build();
    component.name.set('dup');
    component.profileJson.set('{}');
    appstore.createProfile.and.rejectWith(new AppstoreApiError(409, 'dup'));
    await component.submit();
    fixture.detectChanges();
    const err = el().querySelector('[data-testid="appstore-profiles-form-error"]')!;
    expect(err.textContent).toContain('already exists');
  });

  it('shows the ERROR state on a non-auth list failure', async () => {
    appstore.listProfiles.and.rejectWith(new AppstoreApiError(500, 'boom'));
    await build();
    expect(el().querySelector('[data-testid="appstore-profiles-error"]')).not.toBeNull();
  });

  it('degrades a 403 on the list to the empty state (graceful)', async () => {
    appstore.listProfiles.and.rejectWith(new AppstoreApiError(403, 'forbidden'));
    await build();
    expect(el().querySelector('[data-testid="appstore-profiles-empty"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="appstore-profiles-error"]')).toBeNull();
  });

  it('every form control + row action has an accessible name (a11y)', async () => {
    appstore.listProfiles.and.resolveTo([prof('small-postgres')]);
    await build();
    const controls = Array.from(el().querySelectorAll('input, textarea, button')) as HTMLElement[];
    for (const c of controls) {
      expect(accessibleName(c)).withContext(c.outerHTML).toBeTruthy();
    }
  });
});
