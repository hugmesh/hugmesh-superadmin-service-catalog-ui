# Two superadmins operating the SAME domain's deployment accounting concurrently
# (the second-superadmin fixture + newE2eContext plumbing that shipped unused). A
# superadmin is UNSCOPED, so superadmin-beta (beta.test) can load and mutate
# acme.test's rows; the point is that one operator's lifecycle mutation is visible to
# the other on reload, so a stale view is never silently acted upon.
#
# HONESTY NOTE — the audit sketched "B ends X, A provisions X -> 404 'no longer
# exists'". Verified against admin-bff: `end` is a CAS active->ended that RETAINS the
# row (idempotent), and `provision` only 404s when the deployment id does NOT EXIST
# (there is no deployment-delete endpoint). So provisioning an ended-but-present
# deployment returns 200, NOT 404 — the sketched 404 race cannot occur. This scenario
# asserts the REAL concurrent contract instead: B's end is visible to A after reload.
#
# @cluster: real Casdoor sessions in two contexts (the reads + the record/end writes
# need the bff_ cookie). Runtime-skipped unless E2E_CLUSTER=1.
@cluster
Feature: Two superadmins mutating one domain's deployments concurrently
  As two superadmins on the same infra control plane
  I want one superadmin's lifecycle mutation to be visible to the other on reload
  So concurrent operators never act on a stale view without noticing

  Scenario: a second superadmin ending a deployment is visible to the first on reload
    Given "superadmin" signs in and opens the service-catalog at "/service-catalog/deployments"
    And "superadmin" loads the deployments for "acme.test"
    And "superadmin" records the service "owncast-race" in "acme.test"
    When "superadmin-beta" signs in a second session and opens the service-catalog at "/service-catalog/deployments"
    And "superadmin-beta" loads the deployments for "acme.test"
    Then "superadmin-beta" sees the "owncast-race" deployment as "active"
    When "superadmin-beta" ends the "owncast-race" deployment in "acme.test"
    And "superadmin" reloads the deployments for "acme.test"
    Then "superadmin" sees the "owncast-race" deployment as "ended"
