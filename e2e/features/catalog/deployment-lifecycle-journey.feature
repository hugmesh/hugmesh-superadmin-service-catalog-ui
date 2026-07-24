# The full record -> provision -> end journey the UI copy instructs, walked
# end-to-end across THREE views (App profiles -> Deployments -> Add a service ->
# Deployments -> Add). A superadmin creates a deploy-template, records a deployment
# stamped with it and an expiry clock, provisions it from the Add tab via GIT, ends it
# from the Deployments tab, and confirms the accounting row is retained as ended +
# applied and the Add list now shows it ended (no longer offered as active).
#
# @cluster: real Casdoor session — every step here reads or writes /bff/superadmin/**
# and needs the bff_ cookie. Runtime-skipped unless E2E_CLUSTER=1. The exact per-call
# path/body contract is proven offline by service-catalog-add-service.e2e.spec.ts +
# the component karma specs; this BDD layer is the through-the-browser cross-view journey.
@cluster
Feature: Record, provision, and end a deployment across the console tabs
  As a superadmin standing a service up for a domain
  I want the record -> provision -> end lifecycle to hold across the three views
  So the accounting, provisioning, and teardown stay consistent end-to-end

  Scenario: a superadmin records with a profile, provisions via GIT, and ends the deployment
    Given "superadmin" signs in and opens the service-catalog at "/service-catalog/profiles"
    When the superadmin creates the app profile "lifecycle-tmpl"
    And the superadmin opens the "deployments" view
    And the superadmin loads the deployments for "acme.test"
    And the superadmin records the service "owncast-journey" with the "lifecycle-tmpl" profile and an expiry
    Then the deployments accounting shows "owncast-journey" as "active"
    When the superadmin opens the "add" view
    And the domain "acme.test" is loaded with recorded deployments
    And the superadmin chooses the "owncast-journey" deployment to provision
    And the superadmin picks the "GIT" source
    And the superadmin enters the repository URL "https://gitlab.acme.test/svc/owncast.git"
    And the superadmin provisions the service
    Then a provision success notice is shown
    And the deployment list reflects the applied propagation state
    When the superadmin opens the "deployments" view
    And the superadmin loads the deployments for "acme.test"
    And the superadmin ends the "owncast-journey" deployment
    Then the deployments accounting shows "owncast-journey" as "ended"
    And the deployments accounting row for "owncast-journey" shows propagation "applied"
    When the superadmin opens the "add" view
    And the domain "acme.test" is loaded with recorded deployments
    Then the add list shows "owncast-journey" as "ended"
