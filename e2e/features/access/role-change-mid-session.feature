# A mid-session role change re-gates the console LIVE, without a reload. SessionService
# (session.service.ts constructor) subscribes to the cross-tab 'storage' event and the
# same-document 'hug-session-change' broadcast precisely so a role grant/revoke in
# another tab propagates immediately to every guard + the role-aware nav. This walks
# that channel end-to-end: a superadmin demoted in a second tab loses the four nav
# items at once and is bounced to the forbidden screen on the next route activation
# (with the ADMIN read-only degrade, since the demoted roles still include admin).
#
# This is PURE CLIENT-SIDE session behaviour (no BFF write), so seeded localStorage
# sessions are the honest tool (house rule: seed only for pure client-side); the second
# tab's real localStorage write fires the genuine cross-document 'storage' event.
#
# @cluster: needs the built remote served at a baseURL (page.goto). Runtime-skipped
# unless E2E_CLUSTER=1; bddgen + `--list` still discover it.
@cluster
Feature: A mid-session role change re-gates the Service Catalog console live
  As the Service Catalog remote
  I must re-read the session when it changes in another tab
  So a revoked superadmin immediately loses the console without a reload

  Scenario: a superadmin demoted in another tab loses the console and is re-gated
    Given the superadmin session is seeded and the service-catalog opens at "/service-catalog/add"
    And the service-catalog console nav is visible
    When a second tab rewrites the session to roles "user,admin"
    Then the service-catalog console nav is not visible
    When the superadmin navigates within the console to "/service-catalog/profiles"
    Then the service-catalog forbidden screen is shown at "/service-catalog/forbidden"
    And the read-only own-domain catalog section is shown
