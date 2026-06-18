import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent (serviceCatalog dev shell)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('creates the dev shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a skip link targeting the main landmark (a11y baseline)', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const skip = el.querySelector<HTMLAnchorElement>('a.skip');
    expect(skip).not.toBeNull();
    expect(skip!.getAttribute('href')).toBe('#service-catalog-main');
    const main = el.querySelector('main#service-catalog-main');
    expect(main).not.toBeNull();
    expect(main!.getAttribute('tabindex')).toBe('-1');
  });
});
