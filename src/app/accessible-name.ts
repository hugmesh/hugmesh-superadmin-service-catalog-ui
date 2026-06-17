/**
 * accessibleName(el) — the cross-repo Snapdragon a11y helper used by the
 * component specs to assert that EVERY interactive control exposes a
 * programmatic accessible name (WCAG 4.1.2 Name, Role, Value).
 *
 * It computes the name the way an AT broadly would, in the precedence the
 * spec gives:
 *   1. aria-labelledby  (concatenated text of the referenced ids)
 *   2. aria-label
 *   3. an associated <label> (label[for] or a wrapping <label>)
 *   4. the element's own trimmed text content (e.g. a button's label)
 *   5. the title attribute
 *
 * This is intentionally a SUBSET of the full ARIA name-computation algorithm —
 * enough to assert the console's controls are named, without pulling a DOM
 * a11y library into the test bundle.
 */
export function accessibleName(el: Element | null): string {
  if (!el) return '';

  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby) {
    const doc = el.ownerDocument;
    const text = labelledby
      .split(/\s+/)
      .map((id) => doc.getElementById(id)?.textContent?.trim() ?? '')
      .filter((s) => s.length > 0)
      .join(' ')
      .trim();
    if (text) return text;
  }

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

  const id = el.getAttribute('id');
  if (id) {
    const forLabel = el.ownerDocument.querySelector(`label[for="${cssEscape(id)}"]`);
    if (forLabel?.textContent?.trim()) return forLabel.textContent.trim();
  }

  const wrappingLabel = el.closest('label');
  if (wrappingLabel?.textContent?.trim()) return wrappingLabel.textContent.trim();

  const own = el.textContent?.trim();
  if (own) return own;

  const title = el.getAttribute('title');
  if (title && title.trim()) return title.trim();

  return '';
}

/** Minimal CSS.escape fallback for the [for="..."] selector (ids here are
 *  simple kebab-case, but escape defensively for headless robustness). */
function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, '\\$&');
}
