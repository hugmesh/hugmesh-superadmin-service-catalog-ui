# superadminGuard ALLOW / DENY matrix for the Superadmin Service Catalog console.
#
# The console is a host-mounted federated remote; the hugmesh.net host
# gates the WHOLE /service-catalog mount behind route-access superadmin. THESE in-remote
# child guards (src/app/service-catalog.guard.ts) enforce the SAME boundary as
# defence-in-depth: a non-superadmin who reaches the bundle still lands on the
# in-remote forbidden screen at /service-catalog/forbidden (NOT '/forbidden', NOT
# '/login' — shipping the bare path was a real wiki-ui bug).
#
# "Login" here seeds localStorage['hug.session'] directly — this remote derives
# its role flags from that key (SessionService), it does not drive a Casdoor form.
#
# These scenarios are @cluster: each needs the built remote served at a baseURL
# (host shell or `ng serve service-catalog`), which is not present offline / in CI, so
# they are SKIPPED at runtime unless E2E_CLUSTER=1 (see
# features/support/fixtures.ts). bddgen + `playwright test --list` still discover
# them — the runtime skip suppresses execution, not compilation.
@cluster
Feature: superadminGuard — ALLOW superadmin, DENY admin/mod/user
  As the Service Catalog remote
  I must let only a superadmin reach the management views
  So an admin, mod, or plain user cannot curate, template, or deploy services

  # ── ALLOW ──
  Scenario: a superadmin reaches the Add-a-service view
    Given "superadmin" opens the service-catalog at "/service-catalog/add"
    Then the service-catalog console nav is visible
    And the "add" view is shown
    And the service-catalog forbidden screen is not shown

  Scenario Outline: a superadmin reaches every management view
    Given "superadmin" opens the service-catalog at "/service-catalog/<view>"
    Then the "<view>" view is shown
    And the service-catalog forbidden screen is not shown

    Examples:
      | view        |
      | add         |
      | curation    |
      | profiles    |
      | deployments |

  # ── DENY ──
  Scenario Outline: a non-superadmin is bounced to the in-remote forbidden screen
    Given "<who>" opens the service-catalog at "/service-catalog/add"
    Then the service-catalog forbidden screen is shown at "/service-catalog/forbidden"
    And the service-catalog console nav is not visible

    Examples:
      | who   |
      | admin |
      | mod   |
      | user  |

  Scenario Outline: a non-superadmin is denied EVERY management view
    Given "<who>" opens the service-catalog at "/service-catalog/<view>"
    Then the service-catalog forbidden screen is shown at "/service-catalog/forbidden"

    Examples:
      | who   | view        |
      | admin | curation    |
      | admin | profiles    |
      | admin | deployments |
      | mod   | curation    |
      | user  | deployments |

  # ── degrade tiers on the forbidden screen ──
  Scenario: a denied admin still gets the read-only own-domain catalog degrade
    Given "admin" opens the service-catalog at "/service-catalog/curation"
    Then the service-catalog forbidden screen is shown at "/service-catalog/forbidden"
    And the read-only own-domain catalog section is shown

  Scenario Outline: a denied mod or user gets NO catalog degrade
    Given "<who>" opens the service-catalog at "/service-catalog/curation"
    Then the service-catalog forbidden screen is shown at "/service-catalog/forbidden"
    And the read-only own-domain catalog section is not shown

    Examples:
      | who  |
      | mod  |
      | user |
