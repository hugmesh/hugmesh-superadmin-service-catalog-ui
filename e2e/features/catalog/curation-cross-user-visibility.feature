# The flagship TWO-TIER cross-user propagation for the Service Catalog. A SUPERADMIN
# offers / withdraws a service_key to a domain on the TOP tier
# (POST /bff/superadmin/service-store/{domain}/offer|withdraw); a brand ADMIN then
# reads ONLY their own domain's offered rows on the BOTTOM tier
# (GET /bff/admin/service-store — the domain is resolved server-side from the
# cryptographically-validated JWT issuer, NEVER a request field; a superadmin is
# unscoped). Verified against admin-bff ServiceCurationService + AdminServiceStoreController.
#
# VICTIM-CREATES-FIRST: the superadmin offers FIRST, THEN the admin reads the
# propagated result. The isolation wall: a service offered to acme.test must NEVER
# surface in a beta.test admin's own-domain catalog.
#
# @cluster: real Casdoor sessions on BOTH contexts — the offer/withdraw writes and the
# admin read all need the HttpOnly bff_ cookie, and the host shell + admin-bff must be
# reachable. bddgen + `playwright test --list` discover these regardless; they are
# runtime-skipped unless E2E_CLUSTER=1 (features/support/fixtures.ts).
@cluster
Feature: Curation offer/withdraw propagates to the offered domain's admin only
  As the Service Catalog control plane
  I want a service offered to a domain to appear in that domain's admin read-only catalog
  So the two-tier offered-catalog surface is correct and brand-isolated

  Scenario: a superadmin's offer reaches the acme.test admin but not the beta.test admin
    Given "superadmin" signs in and opens the service-catalog at "/service-catalog/curation"
    And "superadmin" loads the curation catalog for "acme.test"
    And "superadmin" offers "owncast" to "acme.test"
    And "superadmin" offers "forum" to "acme.test"
    And "superadmin" withdraws "forum" from "acme.test"
    Then "superadmin" sees "owncast" in the offered catalog for "acme.test"
    And "superadmin" does not see "forum" in the offered catalog for "acme.test"
    When "admin" signs in a second session and opens the service-catalog at "/service-catalog/curation"
    Then "admin" lands on the read-only forbidden catalog
    And "admin" sees "owncast" in their read-only domain catalog
    And "admin" does not see "forum" in their read-only domain catalog
    When "admin-beta" signs in a second session and opens the service-catalog at "/service-catalog/curation"
    Then "admin-beta" lands on the read-only forbidden catalog
    And "admin-beta" does not see "owncast" in their read-only domain catalog
