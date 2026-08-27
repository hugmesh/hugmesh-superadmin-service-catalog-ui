import {
  NO_REASON_GIVEN,
  OptionalServiceView,
  TOGGLEABLE_NOT_REPORTED,
  actionBlockedReason,
  confirmationLabel,
  confirmationOf,
  driftDetail,
  hasDrift,
  isStale,
  normalizeOptionalService,
  normalizeOptionalServices,
  normalizeOptionalServiceCatalogue,
  notToggleableReason,
  unconfirmedDetail,
} from './optional-service-state';

/**
 * The pure half of the optional-services screen. Every test here is the INVERSE of a way
 * the screen could quietly lie, so each one is written to go RED if the corresponding
 * safeguard is removed from production:
 *
 *   1. a service reads as ON because a request was accepted (the character-forge shape:
 *      spec.enabled true, status never written);
 *   2. a slug the server cannot actuate presents a control that looks like it works;
 *   3. the server's own words are dropped.
 */

/** A fully-populated, confirmed-ON row. Each test mutates only what it is about. */
function row(patch: Partial<OptionalServiceView> = {}): OptionalServiceView {
  return {
    slug: 'owncast',
    displayName: null,
    enabled: true,
    installed: true,
    phase: 'Enabled',
    generation: 3,
    observedGeneration: 3,
    applicationName: 'optional-owncast',
    lastReconcileTime: '2026-08-26T00:00:00Z',
    toggleable: true,
    toggleableReported: true,
    reason: null,
    message: null,
    ...patch,
  };
}

describe('normalizeOptionalService (the wire boundary must not invent facts)', () => {
  it('keeps every reported field', () => {
    const v = normalizeOptionalService({
      slug: 'tube',
      displayName: 'Tube',
      enabled: true,
      installed: false,
      phase: 'Reconciling',
      generation: 7,
      observedGeneration: 6,
      applicationName: 'optional-tube',
      lastReconcileTime: '2026-08-26T10:00:00Z',
      toggleable: true,
      reason: null,
      message: 'patching the ApplicationSet',
    });
    expect(v.slug).toBe('tube');
    expect(v.displayName).toBe('Tube');
    expect(v.enabled).toBeTrue();
    expect(v.installed).toBeFalse();
    expect(v.phase).toBe('Reconciling');
    expect(v.generation).toBe(7);
    expect(v.observedGeneration).toBe(6);
    expect(v.applicationName).toBe('optional-tube');
    expect(v.toggleable).toBeTrue();
    expect(v.toggleableReported).toBeTrue();
    expect(v.message).toBe('patching the ApplicationSet');
  });

  it('an ABSENT installed becomes null — never false, never true', () => {
    // The character-forge shape: the CR has a spec and NO status at all.
    const v = normalizeOptionalService({ slug: 'character-forge', enabled: true, toggleable: true });
    expect(v.installed).withContext('absent status.installed must be unknown, not "off"').toBeNull();
  });

  it('a non-boolean installed is unknown (the string "true" is not a confirmation)', () => {
    const v = normalizeOptionalService({ slug: 'x', installed: 'true', toggleable: true });
    expect(v.installed).toBeNull();
  });

  it('an ABSENT toggleable fails SAFE: not toggleable, and flagged as unreported', () => {
    const v = normalizeOptionalService({ slug: 'x', enabled: true });
    expect(v.toggleable).toBeFalse();
    expect(v.toggleableReported).toBeFalse();
  });

  it('a reported toggleable:false is distinguishable from an absent one', () => {
    const v = normalizeOptionalService({ slug: 'x', toggleable: false });
    expect(v.toggleable).toBeFalse();
    expect(v.toggleableReported).toBeTrue();
  });

  it('blank strings normalise to null so nothing renders an empty explanation', () => {
    const v = normalizeOptionalService({ slug: 'x', reason: '   ', phase: '', message: '' });
    expect(v.reason).toBeNull();
    expect(v.phase).toBeNull();
    expect(v.message).toBeNull();
  });

  it('a non-finite / non-number generation is unknown', () => {
    const v = normalizeOptionalService({ slug: 'x', generation: '4', observedGeneration: NaN });
    expect(v.generation).toBeNull();
    expect(v.observedGeneration).toBeNull();
  });

  it('THROWS on a row with no slug (a row we cannot address must not be silently dropped)', () => {
    expect(() => normalizeOptionalService({ enabled: true })).toThrowError(/slug/i);
  });

  it('THROWS on a non-object row', () => {
    expect(() => normalizeOptionalService('owncast')).toThrowError(/object/i);
    expect(() => normalizeOptionalService(null)).toThrowError(/object/i);
    expect(() => normalizeOptionalService([])).toThrowError(/object/i);
  });

  it('falls back to the requested slug when a PUT echo omits it', () => {
    const v = normalizeOptionalService({ enabled: true, toggleable: true }, 'phpbb');
    expect(v.slug).toBe('phpbb');
  });
});

describe('normalizeOptionalServices (an unreadable payload is not an empty mesh)', () => {
  it('maps an array of rows', () => {
    const rows = normalizeOptionalServices([
      { slug: 'a', toggleable: true },
      { slug: 'b', toggleable: true },
    ]);
    expect(rows.map((r) => r.slug)).toEqual(['a', 'b']);
  });

  it('THROWS on a non-array body instead of yielding []', () => {
    expect(() => normalizeOptionalServices({ items: [] })).toThrowError(/services array/i);
    expect(() => normalizeOptionalServices(null)).toThrowError(/services array/i);
    expect(() => normalizeOptionalServices('')).toThrowError(/services array/i);
  });

  it('THROWS rather than dropping one unusable row from an otherwise good list', () => {
    expect(() => normalizeOptionalServices([{ slug: 'a', toggleable: true }, { enabled: true }])).toThrowError(
      /slug/i,
    );
  });
});

describe('confirmationOf (ONLY a confirmed state may read as on)', () => {
  it('installed:true, generation observed → on', () => {
    expect(confirmationOf(row())).toBe('on');
  });

  it('installed:false → off (a reported no is not the same as no answer)', () => {
    expect(confirmationOf(row({ installed: false, enabled: false }))).toBe('off');
  });

  it('THE character-forge shape — requested on, status never written → unconfirmed', () => {
    const cf = row({
      slug: 'character-forge',
      enabled: true,
      installed: null,
      phase: null,
      generation: null,
      observedGeneration: null,
      applicationName: null,
      lastReconcileTime: null,
    });
    expect(confirmationOf(cf)).toBe('unconfirmed');
    expect(confirmationLabel(confirmationOf(cf))).not.toContain('On (confirmed)');
  });

  it('a STALE observedGeneration → unconfirmed, even with installed:true', () => {
    expect(confirmationOf(row({ generation: 5, observedGeneration: 4 }))).toBe('unconfirmed');
    expect(isStale(row({ generation: 5, observedGeneration: 4 }))).toBeTrue();
  });

  it('observedGeneration ahead of / equal to generation is not stale', () => {
    expect(isStale(row({ generation: 4, observedGeneration: 4 }))).toBeFalse();
    expect(isStale(row({ generation: 4, observedGeneration: 5 }))).toBeFalse();
  });

  it('missing generation info is not treated as stale (installed alone still confirms)', () => {
    expect(confirmationOf(row({ generation: null, observedGeneration: null }))).toBe('on');
  });

  it('INVARIANT: across every combination, "on" implies installed===true AND not stale', () => {
    const tri = [true, false, null] as const;
    const gens = [
      [null, null],
      [1, 1],
      [2, 1],
      [1, 2],
    ] as const;
    let sawOn = 0;
    let sawUnconfirmed = 0;
    for (const installed of tri) {
      for (const enabled of tri) {
        for (const [generation, observedGeneration] of gens) {
          const r = row({ installed, enabled, generation, observedGeneration });
          const c = confirmationOf(r);
          if (c === 'on') {
            sawOn++;
            expect(r.installed).withContext(JSON.stringify(r)).toBeTrue();
            expect(isStale(r)).withContext(JSON.stringify(r)).toBeFalse();
          }
          if (c === 'unconfirmed') sawUnconfirmed++;
        }
      }
    }
    // Guard the guard: an empty or single-branch sweep would pass the loop vacuously.
    expect(sawOn).withContext('the sweep must actually reach "on"').toBeGreaterThan(0);
    expect(sawUnconfirmed).withContext('the sweep must actually reach "unconfirmed"').toBeGreaterThan(0);
  });

  it('enabled ALONE can never produce "on" for any generation shape', () => {
    const gens = [
      [null, null],
      [1, 1],
      [2, 1],
    ] as const;
    for (const [generation, observedGeneration] of gens) {
      const r = row({ enabled: true, installed: null, generation, observedGeneration });
      expect(confirmationOf(r)).withContext(JSON.stringify(r)).toBe('unconfirmed');
    }
  });
});

describe('unconfirmedDetail (name the cause, or the no-op stays invisible)', () => {
  it('is null when the state IS confirmed', () => {
    expect(unconfirmedDetail(row())).toBeNull();
    expect(unconfirmedDetail(row({ installed: false }))).toBeNull();
  });

  it('explains a never-reported status', () => {
    const d = unconfirmedDetail(row({ installed: null }))!;
    expect(d).toBeTruthy();
    expect(d).toContain('never reported');
  });

  it('explains a stale generation and names both numbers', () => {
    const d = unconfirmedDetail(row({ generation: 9, observedGeneration: 7 }))!;
    expect(d).toContain('9');
    expect(d).toContain('7');
  });
});

describe('hasDrift / driftDetail (requested vs confirmed)', () => {
  it('no drift when they agree', () => {
    expect(hasDrift(row({ enabled: true, installed: true }))).toBeFalse();
    expect(driftDetail(row({ enabled: true, installed: true }))).toBeNull();
  });

  it('drift when the confirmed state contradicts the request', () => {
    const r = row({ enabled: true, installed: false });
    expect(hasDrift(r)).toBeTrue();
    expect(driftDetail(r)).toContain('enabled');
    expect(driftDetail(r)).toContain('off');
  });

  it('an UNCONFIRMED row is not reported as drift (that is a different, named state)', () => {
    expect(hasDrift(row({ enabled: true, installed: null }))).toBeFalse();
    expect(hasDrift(row({ enabled: true, generation: 4, observedGeneration: 3 }))).toBeFalse();
  });

  it('no drift claim when the request itself was not reported', () => {
    expect(hasDrift(row({ enabled: null, installed: true }))).toBeFalse();
  });
});

describe('notToggleableReason (never a silently unavailable control)', () => {
  it('is null when the slug IS toggleable', () => {
    expect(notToggleableReason(row())).toBeNull();
  });

  it('renders the server reason VERBATIM', () => {
    const r = row({
      toggleable: false,
      reason: 'meshbridge is absent from the CRD spec.slug enum; the API server rejects it.',
    });
    expect(notToggleableReason(r)).toBe(
      'meshbridge is absent from the CRD spec.slug enum; the API server rejects it.',
    );
  });

  it('says so when the server sent toggleable:false with NO reason', () => {
    expect(notToggleableReason(row({ toggleable: false, reason: null }))).toBe(NO_REASON_GIVEN);
  });

  it('says so when the server never reported toggleable at all', () => {
    expect(
      notToggleableReason(row({ toggleable: false, toggleableReported: false, reason: null })),
    ).toBe(TOGGLEABLE_NOT_REPORTED);
  });

  it('NEVER returns an empty string for a blocked row', () => {
    const shapes: Partial<OptionalServiceView>[] = [
      { toggleable: false, toggleableReported: true, reason: null },
      { toggleable: false, toggleableReported: false, reason: null },
      { toggleable: false, toggleableReported: true, reason: 'because' },
    ];
    for (const patch of shapes) {
      const reason = notToggleableReason(row(patch));
      expect(reason).withContext(JSON.stringify(patch)).toBeTruthy();
      expect((reason ?? '').trim().length).toBeGreaterThan(0);
    }
  });
});

describe('actionBlockedReason (every disabled action carries its reason)', () => {
  it('null — the action is live', () => {
    expect(actionBlockedReason(row({ enabled: false, installed: false }), true, false)).toBeNull();
    expect(actionBlockedReason(row({ enabled: true, installed: true }), false, false)).toBeNull();
  });

  it('a not-toggleable row blocks BOTH directions, with the reason', () => {
    const r = row({ toggleable: false, reason: 'unknown to the admin-bff registry' });
    expect(actionBlockedReason(r, true, false)).toBe('unknown to the admin-bff registry');
    expect(actionBlockedReason(r, false, false)).toBe('unknown to the admin-bff registry');
  });

  it('a change in flight blocks with an explanation', () => {
    expect(actionBlockedReason(row({ enabled: false, installed: false }), true, true)).toContain(
      'in flight',
    );
  });

  it('blocks the no-op direction only when the state is BOTH requested and confirmed', () => {
    expect(actionBlockedReason(row({ enabled: true, installed: true }), true, false)).toContain(
      'Already enabled',
    );
    // requested on but NOT confirmed — re-requesting is a legitimate retry, so it is live.
    expect(actionBlockedReason(row({ enabled: true, installed: null }), true, false)).toBeNull();
    // confirmed on but the request says off (drift) — re-requesting on stays available.
    expect(actionBlockedReason(row({ enabled: false, installed: true }), true, false)).toBeNull();
  });

  it('the not-toggleable reason WINS over the already-at-target reason', () => {
    const r = row({ enabled: true, installed: true, toggleable: false, reason: 'no registry entry' });
    expect(actionBlockedReason(r, true, false)).toBe('no registry entry');
  });

  it('NEVER returns an empty string when it blocks', () => {
    const cases: [Partial<OptionalServiceView>, boolean, boolean][] = [
      [{ toggleable: false, toggleableReported: false }, true, false],
      [{ toggleable: false, toggleableReported: true, reason: null }, false, false],
      [{ enabled: true, installed: true }, true, false],
      [{ enabled: false, installed: false }, false, false],
      [{}, true, true],
    ];
    let blocked = 0;
    for (const [patch, target, busy] of cases) {
      const reason = actionBlockedReason(row(patch), target, busy);
      if (reason !== null) {
        blocked++;
        expect(reason.trim().length).withContext(JSON.stringify(patch)).toBeGreaterThan(0);
      }
    }
    expect(blocked).withContext('every case above must actually block').toBe(cases.length);
  });
});

// ── the shape the admin-bff actually sends ───────────────────────────────────
// REGRESSION PIN. This UI and hugmesh-admin-bff-api's
// OptionalServiceSuperadminController were written in parallel against a described
// contract and disagreed on the top level: the UI demanded an array, the BFF sends
// {reconcilerEnabled, services[], note}. Array.isArray threw on every real response, so
// the screen showed its error and ZERO rows — green on both sides, working on neither.
// The body below is the shape OptionalServiceAdminService.catalogueBlocking() builds.
describe('normalizeOptionalServiceCatalogue (the BFF envelope, not a bare array)', () => {
  const bffBody = {
    reconcilerEnabled: false,
    note: 'The reconciler is not wired to a cluster; writes are recorded and not actuated.',
    services: [
      { slug: 'akkoma', displayName: 'Akkoma', toggleable: true, enabled: true },
      { slug: 'meshbridge', displayName: 'Meshbridge', toggleable: false },
    ],
  };

  it('parses the admin-bff object body', () => {
    const cat = normalizeOptionalServiceCatalogue(bffBody);
    expect(cat.services.length).toBe(2);
    expect(cat.services[0].slug).toBe('akkoma');
  });

  it('carries reconcilerEnabled through — a dark reconciler must reach the screen', () => {
    expect(normalizeOptionalServiceCatalogue(bffBody).reconcilerEnabled).toBeFalse();
  });

  it('treats an ABSENT reconcilerEnabled as false, never as fine', () => {
    // A body that omits the flag cannot prove the reconciler is live. Defaulting to true
    // would tell a superadmin that a toggle which actuates nothing took effect.
    const cat = normalizeOptionalServiceCatalogue({ services: [] });
    expect(cat.reconcilerEnabled).toBeFalse();
  });

  it('keeps the note when present and nulls a blank one', () => {
    expect(normalizeOptionalServiceCatalogue(bffBody).note).toContain('not wired');
    expect(normalizeOptionalServiceCatalogue({ services: [], note: '   ' }).note).toBeNull();
  });

  it('still accepts a bare array (the older shape)', () => {
    const cat = normalizeOptionalServiceCatalogue([{ slug: 'games' }]);
    expect(cat.services[0].slug).toBe('games');
  });

  it('still THROWS on an unreadable body rather than yielding an empty mesh', () => {
    expect(() => normalizeOptionalServiceCatalogue({ items: [] })).toThrowError(/services array/i);
    expect(() => normalizeOptionalServiceCatalogue(null)).toThrowError(/services array/i);
    expect(() => normalizeOptionalServiceCatalogue('')).toThrowError(/services array/i);
  });
});
