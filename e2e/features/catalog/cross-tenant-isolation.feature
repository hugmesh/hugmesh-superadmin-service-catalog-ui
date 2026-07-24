# Cross-tenant isolation on the Add-a-service view.
#
# The domain selector re-scopes the recorded-deployment list to the typed
# {domain} (the explicit PATH target on GET /bff/superadmin/service-store/
# {domain}/deployments). Switching the domain MUST clear the prior selection and
# show ONLY the new domain's rows — a superadmin acting across brands must never
# see brand A's deployments leak into brand B's view, and a stale selectedId from
# brand A must not survive into a brand-B provision (which would POST to the wrong
# {domain}/{id} path).
#
# The offline contract — the GET re-scopes to the new {domain} and selectedId is
# cleared — is asserted in src/app/service-catalog-add-service.e2e.spec.ts (the
# "switching the domain re-scopes the app profile" scenario). This BDD layer is
# the through-the-browser view of the same isolation boundary.
@cluster
Feature: Cross-tenant isolation on the Service Catalog add view
  As a superadmin who operates across brands
  I must only ever see and act on the domain I have loaded
  So one brand's recorded deployments never leak into another's view or provision

  # Real Casdoor: this scenario loads TWO domains' recorded-deployment lists (two
  # /bff/superadmin/service-store reads) — a seeded-only session has no bff_ cookie and
  # both loads would 401/403 live. The denied-admin scenario below stays seeded: it is a
  # pure guard/nav degrade that asserts the SEEDED session's own domain survived.
  Scenario: switching the domain re-scopes the list and clears the prior selection
    Given "superadmin" signs in and opens the service-catalog at "/service-catalog/add"
    And the domain "acme.test" is loaded with recorded deployments
    When the superadmin chooses the first recorded deployment
    And the domain "beta.test" is loaded with recorded deployments
    Then the loaded domain is "beta.test"
    And no recorded deployment is selected
    And the "acme.test" rows are not shown

  Scenario: a denied admin's forbidden catalog is scoped to their OWN domain only
    Given "admin" opens the service-catalog at "/service-catalog/curation"
    Then the service-catalog forbidden screen is shown at "/service-catalog/forbidden"
    And the read-only own-domain catalog section is shown
    And the session domain is "acme.test"
