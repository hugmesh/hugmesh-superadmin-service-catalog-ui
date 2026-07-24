# App-profile CRUD (create / 409 duplicate / delete) AND the cross-view data
# dependency: a created profile must appear in the Deployments profileRef dropdown,
# and a deleted one must disappear from it. The 409 duplicate-name contract is verified
# against admin-bff AppProfileService (find-before-insert conflict + UNIQUE-index race
# backstop, both mapped to 409).
#
# @cluster: real Casdoor session (every profile write + the dropdown's profile load is
# a /bff/superadmin/** call needing the bff_ cookie). Runtime-skipped unless
# E2E_CLUSTER=1; the exact 201/409/204 path/body contract is proven offline in
# service-catalog-profiles.component.spec.ts. This BDD layer is the through-the-browser
# CRUD + cross-view dropdown flow.
@cluster
Feature: App-profile CRUD and the profile-to-deployments dropdown data flow
  As a superadmin managing the global deploy-template library
  I want to create, reject duplicates of, and delete app profiles
  So deployments can reference a valid template by name

  Background:
    Given "superadmin" signs in and opens the service-catalog at "/service-catalog/profiles"

  Scenario: create a profile, see it in the dropdown, reject a duplicate, delete it
    When the superadmin creates the app profile "small-postgres"
    Then the app profile "small-postgres" is listed
    And the deployments profile dropdown for "acme.test" offers "small-postgres"
    When the superadmin opens the "profiles" view
    And the superadmin creates the app profile "small-postgres" a second time
    Then the duplicate-name conflict message is shown
    When the superadmin deletes the app profile "small-postgres"
    Then the app profile "small-postgres" is not listed
    And the deployments profile dropdown for "acme.test" does not offer "small-postgres"
