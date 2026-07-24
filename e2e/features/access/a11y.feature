# Accessibility coverage for the SUPERADMIN-only surfaces. The console follows
# the consolidated HugMesh UI a11y standard (accessibleName util, labelled
# regions, menubar roving-tabindex nav, aria-describedby helptext on disabled
# controls).
#
# @cluster: needs the built remote served at a baseURL. These are SKIPPED at
# runtime unless E2E_CLUSTER=1 (see features/support/fixtures.ts) — bddgen +
# `playwright test --list` discover them regardless.
#
# HONESTY — the two scenarios that LOAD a domain (a /bff/superadmin/service-store
# read, to get real rows to choose) sign in through the real host-shell Casdoor flow
# so the bff_ cookie is present; the pure a11y-attribute scenarios (nav roles, region
# headings) and the guard/forbidden scenario touch no BFF and stay on the seeded fast
# path (roles.ts `login()` vs `loginAs()`).
@cluster
Feature: Service Catalog console accessibility
  As a keyboard / screen-reader user with the superadmin role
  I want the console's regions, nav, and controls to be properly named
  So I can operate the four-source add flow without a mouse

  Scenario: the console nav is an aria-labelled menubar
    Given "superadmin" opens the service-catalog at "/service-catalog/add"
    And the service-catalog console nav is visible
    Then the console nav has role "menubar"
    And the console nav has an accessible name

  Scenario: every nav item is a labelled menuitem
    Given "superadmin" opens the service-catalog at "/service-catalog/add"
    And the service-catalog console nav is visible
    Then every console nav item has role "menuitem"
    And every console nav item has an accessible name

  Scenario: the Add-a-service panels are labelled regions with headings
    Given "superadmin" opens the service-catalog at "/service-catalog/add"
    And the service-catalog console nav is visible
    Then the add view has a heading "Add a service"
    And the domain field has an associated label

  Scenario: the disabled Provision button explains why via helptext
    Given "superadmin" signs in and opens the service-catalog at "/service-catalog/add"
    And the service-catalog console nav is visible
    And the domain "acme.test" is loaded with recorded deployments
    When the superadmin chooses the first recorded deployment
    Then the Provision button is disabled until a live source and repo URL are chosen
    And the Provision button is described by helptext

  Scenario: the builder-gated source options expose their disabled reason
    Given "superadmin" signs in and opens the service-catalog at "/service-catalog/add"
    And the service-catalog console nav is visible
    And the domain "acme.test" is loaded with recorded deployments
    When the superadmin chooses the first recorded deployment
    Then the "DOCKERFILE" source option is disabled and badged "needs builder"
    And each source option has a describing blurb

  Scenario: the forbidden screen is announced as an alert
    Given "user" opens the service-catalog at "/service-catalog/add"
    Then the service-catalog forbidden screen is shown at "/service-catalog/forbidden"
    And the forbidden screen has role "alert"
