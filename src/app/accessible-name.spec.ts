import { accessibleName } from './accessible-name';

/** The accessibleName util underpins the a11y assertions in the component specs.
 *  Exercise its precedence (aria-labelledby > aria-label > label > text > title)
 *  so a regression in the helper is caught here, not silently in the views. */
describe('accessibleName (a11y name computation)', () => {
  function frag(html: string): HTMLElement {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host);
    return host;
  }

  afterEach(() => {
    document.querySelectorAll('body > div').forEach((d) => d.remove());
  });

  it('returns "" for a null element', () => {
    expect(accessibleName(null)).toBe('');
  });

  it('prefers aria-labelledby (concatenated referenced text)', () => {
    const host = frag(`<span id="a">Make</span><span id="b">public</span>
      <button aria-labelledby="a b" aria-label="ignored">x</button>`);
    expect(accessibleName(host.querySelector('button'))).toBe('Make public');
  });

  it('falls back to aria-label', () => {
    const host = frag(`<button aria-label="Go to my stream">x</button>`);
    expect(accessibleName(host.querySelector('button'))).toBe('Go to my stream');
  });

  it('falls back to an associated label[for]', () => {
    const host = frag(`<label for="u">User subject</label><input id="u" />`);
    expect(accessibleName(host.querySelector('input'))).toBe('User subject');
  });

  it('falls back to a wrapping label', () => {
    const host = frag(`<label><input type="radio" /> Internal</label>`);
    expect(accessibleName(host.querySelector('input'))).toContain('Internal');
  });

  it('falls back to own text content (a button label)', () => {
    const host = frag(`<button>Save details</button>`);
    expect(accessibleName(host.querySelector('button'))).toBe('Save details');
  });

  it('falls back to title last', () => {
    const host = frag(`<span title="tooltip"></span>`);
    expect(accessibleName(host.querySelector('span'))).toBe('tooltip');
  });
});
