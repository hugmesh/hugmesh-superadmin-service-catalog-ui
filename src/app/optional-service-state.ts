/**
 * The OPTIONAL-SERVICES wire contract + every derivation the toggle screen reads
 * its state from.
 *
 * <p>Extracted as a pure module (the {@link './service-source-options'} precedent) for
 * one reason: the three ways this screen could quietly LIE are all decisions about
 * data, not about markup, so they are decided HERE where they can be tested
 * exhaustively without a DOM.
 *
 * <p><b>The defect this screen exists to make visible.</b> The platform's
 * {@code OptionalService} CR carries a REQUEST ({@code .spec.enabled}) and a
 * separately-reported FACT ({@code .status.installed} — "last EFFECTIVE state
 * actually written to the 13a element"). Those are not the same thing and the gap
 * between them is a measured, live defect: the CRD {@code spec.slug} enum accepts
 * {@code character-forge} and a seed CR ships for it, but the admin-bff
 * {@code OptionalServiceRegistry} has only 12 entries and omits it — so the API
 * ACCEPTS the write, {@code kubectl} reports {@code enabled: true}, and the
 * reconciler logs "unknown slug — ignoring", writes NEITHER target, and skips the
 * CR's {@code /status} entirely. The CR then reads {@code spec.enabled: true} with
 * NO status at all.
 *
 * <p>A UI that renders a service as ON because {@code enabled} is true — or because
 * its {@code PUT} returned 2xx — reproduces that defect exactly, in a place a human
 * will believe. So:
 *
 * <ul>
 *   <li>{@link confirmationOf} reads ONLY {@code installed} (+ generation staleness).
 *       {@code enabled} can never make a row read as on. An absent {@code installed}
 *       is {@code 'unconfirmed'}, NEVER {@code 'off'} — "we have not been told" and
 *       "we were told no" are different answers and the screen says which.</li>
 *   <li>{@link notToggleableReason} treats an absent {@code toggleable} as NOT
 *       toggleable and says so out loud, so a slug the backend cannot actuate can
 *       never present a control that appears to work.</li>
 *   <li>{@link actionBlockedReason} returns a REASON for every disabled action, so
 *       the screen has no bare disabled control anywhere.</li>
 * </ul>
 */

/** The five coarse lifecycle phases the CRD's {@code status.phase} enum defines. Kept as
 *  a plain {@code string} on the view (below) so an unrecognised phase is SHOWN rather
 *  than silently dropped — discarding what the server said is the failure mode this
 *  module exists to prevent. */
export const OPTIONAL_SERVICE_PHASES: readonly string[] = [
  'Pending',
  'Reconciling',
  'Enabled',
  'Disabled',
  'Degraded',
] as const;

/**
 * One optional cluster service as reported by
 * {@code GET /bff/superadmin/optional-services} — the admin-bff's projection of one
 * {@code platform.hugmesh.net/v1alpha1 OptionalService} CR plus the two facts only the
 * server can know (whether its own registry can actuate the slug, and why not).
 *
 * <p>EVERY field the server may omit is typed {@code | null} and normalised to
 * {@code null} by {@link normalizeOptionalService} — never coerced to a default that
 * would read as a fact.
 */
export interface OptionalServiceView {
  /** The CR {@code spec.slug} — the closed-set optional-service identifier. Required. */
  slug: string;
  /** Optional human label; the slug is shown when absent. */
  displayName: string | null;
  /**
   * {@code spec.enabled} — the REQUESTED state. This is an intent that was accepted,
   * NOT evidence that anything happened. It must never drive the state badge.
   */
  enabled: boolean | null;
  /**
   * {@code status.installed} — the CONFIRMED state: the last effective value the
   * controller reports it actually wrote to the 13a ApplicationSet element.
   * {@code null} = the controller has never reported one (the character-forge shape).
   */
  installed: boolean | null;
  /** {@code status.phase} — free text, shown verbatim. */
  phase: string | null;
  /** {@code metadata.generation} — bumped by every spec write. */
  generation: number | null;
  /** {@code status.observedGeneration} — the generation the controller last reconciled. */
  observedGeneration: number | null;
  /** {@code status.applicationName} — the generated {@code optional-<slug>} Application. */
  applicationName: string | null;
  /** {@code status.lastReconcileTime} — ISO-8601, or null. */
  lastReconcileTime: string | null;
  /**
   * Whether the SERVER can actually actuate this slug (its registry knows it, the CRD
   * enum accepts it, and the GitOps root will not revert the write). Absent is
   * normalised to {@code false} — see {@link toggleableReported}.
   */
  toggleable: boolean;
  /**
   * Whether the server actually SENT a {@code toggleable} boolean. Lets the screen
   * distinguish "the server said this cannot be toggled" from "the server said
   * nothing and we defaulted to safe", and name which in the UI.
   */
  toggleableReported: boolean;
  /** The server's reason a slug is not toggleable. Rendered verbatim; never discarded. */
  reason: string | null;
  /** Any free-text status detail (e.g. a Degraded message). Rendered verbatim. */
  message: string | null;
}

/** Body of {@code PUT /bff/superadmin/optional-services/{slug}}. */
export interface OptionalServiceToggle {
  /** The requested {@code spec.enabled}. */
  enabled: boolean;
  /** Optional audit note stamped onto {@code spec.reason}. */
  reason?: string;
}

/** The ONLY three states the screen may render. {@code 'unconfirmed'} is a first-class
 *  answer, not an error — it is what the character-forge CR honestly reads as. */
export type OptionalServiceConfirmation = 'on' | 'off' | 'unconfirmed';

/** Shown when the server says a slug is not toggleable but sends no reason. */
export const NO_REASON_GIVEN =
  'The server reported this service as not toggleable but gave no reason.';

/** Shown when the server omits {@code toggleable} entirely — the fail-safe default. */
export const TOGGLEABLE_NOT_REPORTED =
  'The server did not report whether this service can be toggled, so this console keeps it disabled.';

/** Read a string field, treating a non-string or a blank string as absent. */
function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null;
}

/** Read a STRICT boolean. A string `"true"`, a 1, or an absent key are all {@code null} —
 *  "we were not told a boolean" must not become "we were told true". */
function bool(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null;
}

/** Read a finite number field; anything else is absent. */
function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * Normalise one wire row into an {@link OptionalServiceView}.
 *
 * <p>FAILS LOUDLY rather than yielding a plausible-looking blank: a row that is not an
 * object, or that carries no usable slug, THROWS. A row we cannot address is worse than
 * no row — silently dropping it is how a backend bug becomes an invisible one.
 *
 * @param raw - the parsed JSON row.
 * @param fallbackSlug - the slug from the request path, used when a PUT response echoes
 *        the row without repeating its slug.
 */
export function normalizeOptionalService(raw: unknown, fallbackSlug?: string): OptionalServiceView {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('optional-services: expected a JSON object for a service row.');
  }
  const r = raw as Record<string, unknown>;
  const slug = str(r['slug']) ?? (fallbackSlug ?? '').trim();
  if (slug.length === 0) {
    throw new Error('optional-services: a service row arrived without a slug.');
  }
  return {
    slug,
    displayName: str(r['displayName']),
    enabled: bool(r['enabled']),
    installed: bool(r['installed']),
    phase: str(r['phase']),
    generation: num(r['generation']),
    observedGeneration: num(r['observedGeneration']),
    applicationName: str(r['applicationName']),
    lastReconcileTime: str(r['lastReconcileTime']),
    toggleable: r['toggleable'] === true,
    toggleableReported: typeof r['toggleable'] === 'boolean',
    reason: str(r['reason']),
    message: str(r['message']),
  };
}

/**
 * Normalise the whole {@code GET} payload.
 *
 * <p>A non-array body THROWS: an unreadable payload must not become an empty list. An
 * assertion over a silently-emptied list is the org's catalogued vacuous pass, and here
 * it would additionally read to a superadmin as "this mesh has no optional services",
 * which is never true.
 */
/**
 * The catalogue as the admin-bff actually sends it.
 *
 * <p>`reconcilerEnabled` is not decoration. When it is false the BFF is wired to
 * NoopOptionalServiceClient: a PUT is accepted, `kubectl` will report `enabled: true`,
 * and NOTHING actuates. A screen that hid that would be the character-forge defect
 * wearing a UI — the operator's whole question is "did this take effect".
 */
export interface OptionalServiceCatalogue {
  reconcilerEnabled: boolean;
  note: string | null;
  services: OptionalServiceView[];
}

/**
 * Accept the admin-bff's OBJECT body, and a bare array too.
 *
 * <p>WHY BOTH. This UI and the BFF endpoint were written in parallel against a described
 * contract and disagreed: the UI demanded a top-level array, the BFF sends
 * `{reconcilerEnabled, services[], note}`. `Array.isArray` therefore threw on every real
 * response and the screen rendered its error with ZERO rows — a feature that was green on
 * both sides and worked on neither. The object form is the right one (it carries the
 * dark-reconciler fact a superadmin needs), so it is what this reads; the array form stays
 * accepted because a normaliser that can only parse one shape is how this broke.
 *
 * <p>Still THROWS on anything else. An empty list would read as "this mesh has no optional
 * services" — never true — so an unreadable payload must surface as an error, not silence.
 */
export function normalizeOptionalServiceCatalogue(raw: unknown): OptionalServiceCatalogue {
  if (Array.isArray(raw)) {
    return {
      reconcilerEnabled: true,
      note: null,
      services: raw.map((row) => normalizeOptionalService(row)),
    };
  }
  if (raw === null || typeof raw !== 'object') {
    throw new Error(
      'optional-services: expected a JSON object with a services array (or a bare array).',
    );
  }
  const body = raw as Record<string, unknown>;
  if (!Array.isArray(body['services'])) {
    throw new Error(
      'optional-services: expected a JSON object with a services array (or a bare array).',
    );
  }
  const note = body['note'];
  return {
    // Absent is NOT "fine": a body that omits the flag cannot prove the reconciler is
    // live, and claiming it is would tell the operator a dark toggle took effect.
    reconcilerEnabled: body['reconcilerEnabled'] === true,
    note: typeof note === 'string' && note.trim() !== '' ? note : null,
    services: (body['services'] as unknown[]).map((row) => normalizeOptionalService(row)),
  };
}

/** The rows alone. Kept for callers that do not need the envelope. */
export function normalizeOptionalServices(raw: unknown): OptionalServiceView[] {
  return normalizeOptionalServiceCatalogue(raw).services;
}

/**
 * True when the controller has not yet observed the newest spec write — the reported
 * {@code installed} describes an OLDER generation and therefore cannot confirm the
 * current request.
 */
export function isStale(row: OptionalServiceView): boolean {
  return (
    row.generation !== null &&
    row.observedGeneration !== null &&
    row.observedGeneration < row.generation
  );
}

/**
 * The screen's ONLY state source.
 *
 * <p>Reads {@code installed} — never {@code enabled}, and never the fact that a PUT was
 * accepted. An absent {@code installed}, or one the controller has not re-observed since
 * the last spec change, is {@code 'unconfirmed'}.
 */
export function confirmationOf(row: OptionalServiceView): OptionalServiceConfirmation {
  if (row.installed === null) return 'unconfirmed';
  if (isStale(row)) return 'unconfirmed';
  return row.installed ? 'on' : 'off';
}

/** The badge text for a confirmation. */
export function confirmationLabel(c: OptionalServiceConfirmation): string {
  switch (c) {
    case 'on':
      return 'On (confirmed)';
    case 'off':
      return 'Off (confirmed)';
    default:
      return 'Not confirmed';
  }
}

/**
 * WHY a row is unconfirmed, or null when it is confirmed. Naming the cause is what
 * turns the silent character-forge no-op into something a superadmin can act on.
 */
export function unconfirmedDetail(row: OptionalServiceView): string | null {
  if (confirmationOf(row) !== 'unconfirmed') return null;
  if (row.installed === null) {
    return (
      'The controller has never reported an observed state for this service, so this console ' +
      'cannot say whether it is on. A slug the reconciler does not know is accepted by the API ' +
      'and then silently ignored — this is what that looks like.'
    );
  }
  return (
    `The controller has not observed the latest change yet (generation ${row.generation}, ` +
    `last observed ${row.observedGeneration}), so its reported state describes an earlier request.`
  );
}

/** True when a CONFIRMED state exists and disagrees with the REQUESTED one. */
export function hasDrift(row: OptionalServiceView): boolean {
  const c = confirmationOf(row);
  if (c === 'unconfirmed' || row.enabled === null) return false;
  return row.enabled !== (c === 'on');
}

/** The drift sentence, or null when there is no drift. */
export function driftDetail(row: OptionalServiceView): string | null {
  if (!hasDrift(row)) return null;
  const requested = row.enabled ? 'enabled' : 'disabled';
  const confirmed = confirmationOf(row) === 'on' ? 'on' : 'off';
  return `Requested ${requested}, but the controller reports it as ${confirmed}.`;
}

/**
 * WHY this slug cannot be toggled, or null when it can.
 *
 * <p>Never returns an empty string: a disabled control with no explanation is the exact
 * "a control that appears to work and does not" shape, one step removed.
 */
export function notToggleableReason(row: OptionalServiceView): string | null {
  if (row.toggleable) return null;
  if (!row.toggleableReported) return TOGGLEABLE_NOT_REPORTED;
  return row.reason ?? NO_REASON_GIVEN;
}

/**
 * WHY the Enable/Disable action for {@code target} is unavailable on this row, or null
 * when it may be fired. Every disabled action in the template gets its text from here,
 * so no disabled control is ever unexplained.
 *
 * @param row - the service row.
 * @param target - the {@code enabled} value the action would request.
 * @param busy - true while any toggle PUT is in flight.
 */
export function actionBlockedReason(
  row: OptionalServiceView,
  target: boolean,
  busy: boolean,
): string | null {
  const notToggleable = notToggleableReason(row);
  if (notToggleable !== null) return notToggleable;
  if (busy) return 'A change is already in flight — wait for it to come back.';
  const confirmation = confirmationOf(row);
  if (confirmation === (target ? 'on' : 'off') && row.enabled === target) {
    return target
      ? 'Already enabled, and the controller has confirmed it.'
      : 'Already disabled, and the controller has confirmed it.';
  }
  return null;
}

/** Sort key: the server's order is meaningful (it mirrors the ApplicationSet element
 *  list), so rows are rendered in the order received. Exposed as an explicit track-by. */
export function trackSlug(_: number, row: OptionalServiceView): string {
  return row.slug;
}
