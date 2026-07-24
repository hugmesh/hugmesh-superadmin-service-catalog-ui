import { ServiceSourceKind, SERVICE_SOURCE_KINDS, requiresBuilder } from './service-catalog.service';

/**
 * The FOUR Service Catalog source options rendered in the shared radio group — the
 * SELECT/GIT/DOCKERFILE/ZIP sources with their copy plus the builder-gated flag.
 *
 * Extracted here so BOTH the Add-a-service view (which provisions an EXISTING
 * deployment row) and the Create-service wizard's source step render exactly the
 * same option set + gating semantics, instead of each hand-rolling the labels,
 * blurbs and gate. The STATIC per-kind builder fact is
 * {@link requiresBuilder}; whether a builder is actually AVAILABLE is the separate
 * LIVE pre-flight the caller passes in as {@code builderReady}.
 */
export interface SourceOption {
  kind: ServiceSourceKind;
  label: string;
  /** One-line description of what the source provisions from. */
  blurb: string;
  /** True when the source needs the in-cluster Kaniko builder (DOCKERFILE/ZIP) AND the
   *  caller's LIVE builder pre-flight hasn't confirmed a real build is possible — the
   *  option is disabled with helptext until it is. */
  builderGated: boolean;
}

export const SOURCE_LABELS: Record<ServiceSourceKind, string> = {
  SELECT: 'Catalog (select)',
  GIT: 'Git / GitLab URL',
  DOCKERFILE: 'Dockerfile',
  ZIP: 'Zip repo upload',
};

export const SOURCE_BLURBS: Record<ServiceSourceKind, string> = {
  SELECT: 'A curated catalog tile referencing a pre-built image. Deploys today.',
  GIT: 'A git/GitLab repo that builds its own image via its own CI. Deploys today.',
  DOCKERFILE: 'A dropped Dockerfile built in-cluster first. Needs the Kaniko builder.',
  ZIP: 'An uploaded zip-as-repo built in-cluster first. Needs the Kaniko builder.',
};

/**
 * Build the four source options in console display order (the two live sources, then the
 * two builder-gated). DOCKERFILE/ZIP un-gate the moment {@code builderReady} is true (the
 * live pre-flight confirmed BOTH the config flag AND a build node).
 */
export function buildSourceOptions(builderReady: boolean): readonly SourceOption[] {
  return SERVICE_SOURCE_KINDS.map((kind) => ({
    kind,
    label: SOURCE_LABELS[kind],
    blurb: SOURCE_BLURBS[kind],
    builderGated: requiresBuilder(kind) && !builderReady,
  }));
}
