import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { AppstoreConsoleComponent } from './appstore-console.component';
import { SessionService } from './session.service';
import { accessibleName } from './accessible-name';

/** A stub SessionService with a settable canManageStore signal so each role
 *  scenario is exercised by flipping it. The whole console is SUPERADMIN, so the
 *  one composite drives every nav item. */
function sessionStub() {
  return {
    canManageStore: signal(false),
    canReadOwnCatalog: signal(false),
  };
}

describe('AppstoreConsoleComponent (SUPERADMIN-gated nav)', () => {
  let fixture: ComponentFixture<AppstoreConsoleComponent>;
  let session: ReturnType<typeof sessionStub>;

  beforeEach(async () => {
    session = sessionStub();
    await TestBed.configureTestingModule({
      imports: [AppstoreConsoleComponent],
      providers: [provideRouter([]), { provide: SessionService, useValue: session }],
    }).compileComponents();
    fixture = TestBed.createComponent(AppstoreConsoleComponent);
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
  function navTestIds(): string[] {
    return Array.from(el().querySelectorAll('[data-testid^="appstore-nav-"]')).map(
      (n) => n.getAttribute('data-testid')!,
    );
  }

  it('a NON-superadmin sees NOTHING (empty menubar)', () => {
    fixture.detectChanges();
    expect(navTestIds()).toEqual([]);
    expect(el().querySelector('[role="menubar"]')).withContext('no menubar when no items').toBeNull();
  });

  it('a SUPERADMIN sees ALL four views (add, curation, profiles, deployments)', () => {
    session.canManageStore.set(true);
    fixture.detectChanges();
    expect(navTestIds()).toEqual([
      'appstore-nav-add',
      'appstore-nav-curation',
      'appstore-nav-profiles',
      'appstore-nav-deployments',
    ]);
  });

  it('renders the menubar with roving tabindex + arrow-key roving (a11y)', () => {
    session.canManageStore.set(true);
    fixture.detectChanges();
    const menubar = el().querySelector('[role="menubar"]')!;
    expect(menubar).not.toBeNull();
    const items = Array.from(el().querySelectorAll('[role="menuitem"]')) as HTMLElement[];
    // Exactly one item is tabbable (tabindex=0); the rest are -1.
    expect(items.map((i) => i.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1']);

    const component = fixture.componentInstance;
    component.onKey(new KeyboardEvent('keydown', { key: 'ArrowRight' }), 0);
    fixture.detectChanges();
    expect(component.active).toBe(1);
    component.onKey(new KeyboardEvent('keydown', { key: 'End' }), 1);
    expect(component.active).toBe(3);
    component.onKey(new KeyboardEvent('keydown', { key: 'Home' }), 3);
    expect(component.active).toBe(0);
  });

  it('every nav link carries an accessibleName + describedby help (a11y)', () => {
    session.canManageStore.set(true);
    fixture.detectChanges();
    const links = Array.from(el().querySelectorAll('[role="menuitem"]')) as HTMLElement[];
    expect(links.length).toBe(4);
    for (const link of links) {
      expect(accessibleName(link)).withContext('accessibleName').toBeTruthy();
      const describedby = link.getAttribute('aria-describedby');
      expect(describedby).toBeTruthy();
      expect(el().querySelector('#' + describedby)).withContext('help element exists').not.toBeNull();
    }
  });
});
