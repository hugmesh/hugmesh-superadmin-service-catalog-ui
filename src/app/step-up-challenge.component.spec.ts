import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepUpChallengeComponent } from './step-up-challenge.component';
import { accessibleName } from './accessible-name';

/**
 * The shared step-up token challenge. The spec pins the contract its hosts rely on:
 *   - the action text and the per-host testId prefix render (two hosts never collide);
 *   - Confirm is disabled until a token is typed, emits the TRIMMED token, and clears the
 *     field (the token is never retained by the control);
 *   - Cancel emits and clears;
 *   - a11y: every control has an accessible name.
 */
describe('StepUpChallengeComponent (shared step-up token challenge)', () => {
  let fixture: ComponentFixture<StepUpChallengeComponent>;
  let component: StepUpChallengeComponent;
  let confirmed: string[];
  let cancelled: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StepUpChallengeComponent] }).compileComponents();
    fixture = TestBed.createComponent(StepUpChallengeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('action', 'Offering “owncast” to acme.test');
    fixture.componentRef.setInput('testId', 'x-stepup');
    confirmed = [];
    cancelled = 0;
    component.confirm.subscribe((t) => confirmed.push(t));
    component.cancel.subscribe(() => cancelled++);
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
  function submitBtn(): HTMLButtonElement {
    return el().querySelector('[data-testid="x-stepup-submit"]') as HTMLButtonElement;
  }

  it('renders the action text under the host-supplied testId prefix', () => {
    const box = el().querySelector('[data-testid="x-stepup"]')!;
    expect(box).not.toBeNull();
    expect(box.textContent).toContain('Offering “owncast” to acme.test');
    expect(box.textContent).toContain('X-ServiceStore-StepUp');
    expect(el().querySelector('#x-stepup-token')).withContext('token input id is prefixed').not.toBeNull();
  });

  it('Confirm is disabled while the token is blank, and never emits an empty token', () => {
    expect(submitBtn().disabled).toBeTrue();
    component.tokenInput.set('   ');
    fixture.detectChanges();
    expect(submitBtn().disabled).toBeTrue();
    component.submit();
    expect(confirmed).toEqual([]);
  });

  it('Confirm emits the TRIMMED token and clears the field', () => {
    component.tokenInput.set('  stepup-tok  ');
    fixture.detectChanges();
    expect(submitBtn().disabled).toBeFalse();
    submitBtn().click();
    expect(confirmed).toEqual(['stepup-tok']);
    expect(component.tokenInput()).withContext('token is not retained by the control').toBe('');
  });

  it('Cancel emits and clears the field', () => {
    component.tokenInput.set('typed');
    (el().querySelector('[data-testid="x-stepup-cancel"]') as HTMLButtonElement).click();
    expect(cancelled).toBe(1);
    expect(confirmed).toEqual([]);
    expect(component.tokenInput()).toBe('');
  });

  it('every control has an accessible name (a11y)', () => {
    const controls = Array.from(el().querySelectorAll('input, button')) as HTMLElement[];
    expect(controls.length).toBe(3);
    for (const c of controls) {
      expect(accessibleName(c)).withContext(c.outerHTML).toBeTruthy();
    }
    expect(accessibleName(el().querySelector('[role="group"]'))).toBe('Step-up required');
  });
});
