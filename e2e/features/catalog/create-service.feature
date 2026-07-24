# The create-and-federate wizard: a SUPERADMIN stands up a BRAND-NEW service from
# scratch (src/app/service-catalog-create-service.component.ts) — a bespoke step rail
# (identity → archetype → source → federation → review) that drives the admin-bff
# ServiceStoreWizardController end to end:
#
#   offer? → record deployment → scaffold (step-up) → provision → federate (step-up)
#
# Ships dark / honesty: the provision effector and the federation registration both
# ship dark by default (no real ArgoCD apply, no real manifest registration). The
# wizard records the intent and reports each leg HONESTLY — a federate outcome with
# federationReal=false / gitopsDescriptorPending=true renders the explicit dark note
# (data-testid service-catalog-create-dark-note), never a faked success. The two
# builder-gated sources (DOCKERFILE/ZIP) stay disabled until the live builder
# pre-flight confirms one, exactly as on the Add-a-service view. SCAFFOLD + FEDERATE
# are step-up-gated: a 403 "requires step-up" pauses the chain and shows the token
# challenge, which the operator satisfies to resume.
#
# @cluster: needs the built remote served + a real admin-bff
# /bff/superadmin/service-store endpoint, so these are SKIPPED at runtime unless
# E2E_CLUSTER=1 (see features/support/fixtures.ts). The exact path/body/header +
# step-up-retry contract is already proven offline by karma
# (src/app/service-catalog-create-service.e2e.spec.ts, HttpTestingController-stubbed);
# this BDD layer is the through-the-browser presentation. bddgen + `playwright test
# --list` discover these regardless.
@cluster
Feature: Superadmin creates and federates a brand-new service
  As a superadmin standing up a new service
  I want to scaffold a starter codebase and federate its UI in one guided wizard
  So the deployment, its starter code and its federation module are wired together

  Background:
    Given "superadmin" opens the service-catalog at "/service-catalog/create"
    And the service-catalog console nav is visible

  Scenario: the create wizard opens on the identity step with the ships-dark intro
    Then the create wizard step rail is shown
    And the create ships-dark intro note is shown
    And the "identity" create wizard step is shown

  Scenario: walk the wizard and apply the create-and-federate chain
    When the operator enters the service identity "acme.test" and key "owncast"
    And the operator advances the create wizard
    And the operator picks the "angular-mfe" create archetype
    And the operator advances the create wizard
    And the operator picks the "SELECT" create source
    And the operator enters the create repository URL "https://gitlab.acme.test/svc/owncast.git"
    And the operator advances the create wizard
    And the operator advances the create wizard
    And the operator applies the create chain
    Then the create apply steps are shown
    And the federation dark-note is shown

  Scenario: the DOCKERFILE and ZIP sources are offered but DISABLED (ships dark)
    When the operator enters the service identity "acme.test" and key "owncast"
    And the operator advances the create wizard
    And the operator picks the "angular-mfe" create archetype
    And the operator advances the create wizard
    Then the create "DOCKERFILE" source option is disabled and badged "needs builder"
    And the create "ZIP" source option is disabled and badged "needs builder"

  Scenario: a hyphenated service key is rejected for the Java-package archetype before submit
    When the operator enters the service identity "acme.test" and key "own-cast"
    And the operator advances the create wizard
    And the operator picks the "spring-bff" create archetype
    Then the archetype slug rule error is shown
    And advancing the create wizard is blocked on the archetype step

  Scenario: scaffolding challenges for step-up before the chain can finish
    When the operator enters the service identity "acme.test" and key "owncast"
    And the operator advances the create wizard
    And the operator picks the "spring-bff" create archetype
    And the operator advances the create wizard
    And the operator picks the "GIT" create source
    And the operator enters the create repository URL "https://gitlab.acme.test/svc/owncast.git"
    And the operator advances the create wizard
    And the operator advances the create wizard
    And the operator applies the create chain
    Then the create step-up challenge is shown
