# hugmesh-superadmin-service-catalog-ui#4 — the Service Catalog's step-up-gated
# mutations: OFFER (Curation view) and PROVISION (Add-a-service view).
#
# RE-CHECKED against origin/main before writing (2026-09-23):
#   - admin-bff-api 86cdf79: ServiceCurationController.offer (POST
#     /bff/superadmin/service-store/{domain}/offer) and ServiceDeploymentController
#     .provision (POST …/{domain}/deployments/{id}/provision) are
#     @PreAuthorize("hasRole('SUPERADMIN')") and then gated by ServiceStoreStepUpGate:
#     a fresh session MFA or a valid token in `X-ServiceStore-StepUp`, else
#     StepUpRequiredException.forRetryHeader → 403 +
#     `X-Step-Up-Required: X-ServiceStore-StepUp` +
#     {"error":"<offering|provisioning> a service requires step-up re-authentication
#     (present X-ServiceStore-StepUp)"}. `withdraw` is role-only again (decision 6,
#     admin-bff PR #54), so it is not driven here.
#   - this repo dbf800c (PR #11): Curation and Add-a-service PAUSE on that 403
#     (ServiceCatalogApiError.isStepUpRequired: 403 + /requires step-up/i), show
#     <hug-step-up-challenge>, and on Confirm retry the SAME call carrying the token in
#     X-ServiceStore-StepUp; Cancel reports the write as not performed.
# Both halves are on main, so there is no @fixme here. Issue #4 stays open (Refs only).
#
# MOCKED rows: page.route() answers the domain read and the gated write in the wire
# shapes above, so the paused → confirmed → retried loop is proven without an armed
# stack (a real superadmin whose session carries a fresh MFA never sees the challenge,
# and no persona carries a step-up token). A bare 403 — the superadmin-role denial —
# must NOT pop the challenge. These rows touch no real BFF, so the seeded session is
# the honest tool (house rule in add-service-four-sources.feature).
# LIVE rows: a real domain ADMIN is refused both writes by the role gate, with no
# step-up signal — the ROLE_ADMIN 403 case the survey listed as uncovered.
#
# @cluster: the remote must be served (host shell, or `ng serve service-catalog`);
# SKIPPED at runtime unless E2E_CLUSTER=1 (features/support/fixtures.ts).
@cluster @issue:superadmin-service-catalog-ui-4
Feature: Service Catalog offer and provision pause on the step-up contract
  As the superadmin Service Catalog
  I must pause an offer or a provision on the platform's step-up refusal and retry it once with the confirmed token
  So a gated write is never silently dropped, never silently applied, and a role denial never masquerades as a step-up prompt

  Scenario: a superadmin's offer is paused by the step-up signal and nothing is offered
    Given "superadmin" opens the service-catalog at "/service-catalog/curation"
    And the admin-bff serves an empty curation catalog for "acme.test"
    And the admin-bff will refuse the next offer to "acme.test" demanding a step-up
    When "superadmin" loads the curation catalog for "acme.test"
    And "superadmin" submits an offer of "owncast"
    Then "superadmin" is shown the "service-catalog-curation-stepup" step-up challenge for "Offering “owncast” to acme.test"
    And no curation success notice is shown to "superadmin"
    And the offer to "acme.test" has been sent 1 time

  Scenario: confirming the challenge re-sends the identical offer once, carrying the token
    Given "superadmin" opens the service-catalog at "/service-catalog/curation"
    And the admin-bff serves an empty curation catalog for "acme.test"
    And the admin-bff will refuse the next offer to "acme.test" demanding a step-up
    When "superadmin" loads the curation catalog for "acme.test"
    And "superadmin" submits an offer of "owncast"
    And "superadmin" confirms the "service-catalog-curation-stepup" challenge with the token "e2e-step-up-token"
    Then the offer to "acme.test" has been sent 2 times
    And the retried offer to "acme.test" carried the token "e2e-step-up-token" and the identical body
    And "superadmin" sees the curation notice "Offered “owncast” to acme.test."

  Scenario: cancelling the challenge reports the offer as not performed
    Given "superadmin" opens the service-catalog at "/service-catalog/curation"
    And the admin-bff serves an empty curation catalog for "acme.test"
    And the admin-bff will refuse the next offer to "acme.test" demanding a step-up
    When "superadmin" loads the curation catalog for "acme.test"
    And "superadmin" submits an offer of "owncast"
    And "superadmin" cancels the "service-catalog-curation-stepup" challenge
    Then "superadmin" sees the curation error "Step-up cancelled — “owncast” was not offered."
    And the offer to "acme.test" has been sent 1 time

  Scenario: a bare 403 on an offer is the role denial and never offers the challenge
    Given "superadmin" opens the service-catalog at "/service-catalog/curation"
    And the admin-bff serves an empty curation catalog for "acme.test"
    And the admin-bff will refuse the next offer to "acme.test" with a bare 403
    When "superadmin" loads the curation catalog for "acme.test"
    And "superadmin" submits an offer of "owncast"
    Then "superadmin" sees the curation error "The server denied this action — superadmin is required to curate the catalog."
    And "superadmin" is not shown the "service-catalog-curation-stepup" step-up challenge

  Scenario: a superadmin's provision is paused, then retried once with the token and the same snapshot
    Given "superadmin" opens the service-catalog at "/service-catalog/add"
    And the admin-bff serves one recorded "owncast" deployment for "acme.test"
    And the admin-bff will refuse the next provision in "acme.test" demanding a step-up
    And the domain "acme.test" is loaded with recorded deployments
    When the superadmin chooses the "owncast" deployment to provision
    And the superadmin picks the "GIT" source
    And the superadmin enters the repository URL "https://git.acme.test/catalog/owncast.git"
    And the superadmin provisions the service
    Then "superadmin" is shown the "service-catalog-add-stepup" step-up challenge for "Provisioning “owncast” in acme.test"
    And the provision in "acme.test" has been sent 1 time
    When "superadmin" confirms the "service-catalog-add-stepup" challenge with the token "e2e-step-up-token"
    Then the provision in "acme.test" has been sent 2 times
    And the retried provision in "acme.test" carried the token "e2e-step-up-token" and the identical body
    And a provision success notice is shown

  Scenario: cancelling the provision challenge reports the service as not provisioned
    Given "superadmin" opens the service-catalog at "/service-catalog/add"
    And the admin-bff serves one recorded "owncast" deployment for "acme.test"
    And the admin-bff will refuse the next provision in "acme.test" demanding a step-up
    And the domain "acme.test" is loaded with recorded deployments
    When the superadmin chooses the "owncast" deployment to provision
    And the superadmin picks the "GIT" source
    And the superadmin enters the repository URL "https://git.acme.test/catalog/owncast.git"
    And the superadmin provisions the service
    And "superadmin" cancels the "service-catalog-add-stepup" challenge
    Then "superadmin" sees the add-service error "Step-up cancelled — the service was not provisioned."
    And the provision in "acme.test" has been sent 1 time

  Scenario: a domain admin's offer is a role refusal that carries no step-up signal
    Given "admin" signs in and opens the service-catalog at "/service-catalog/curation"
    When "admin" POSTs to "/bff/superadmin/service-store/acme.test/offer" capturing the step-up signal with body:
      """
      {"serviceKey":"owncast"}
      """
    Then the captured response was a 403 without any step-up signal

  Scenario: a domain admin's provision is a role refusal that carries no step-up signal
    Given "admin" signs in and opens the service-catalog at "/service-catalog/add"
    When "admin" POSTs to "/bff/superadmin/service-store/acme.test/deployments/e2e-deny-probe/provision" capturing the step-up signal with body:
      """
      {"sourceKind":"GIT","repoUrl":"https://git.acme.test/catalog/owncast.git","path":null,"targetRevision":null}
      """
    Then the captured response was a 403 without any step-up signal
