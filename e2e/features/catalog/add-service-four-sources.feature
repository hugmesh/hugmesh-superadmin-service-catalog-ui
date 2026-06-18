# The App-Store headline flow: a SUPERADMIN adds a service to a domain via one
# of the FOUR sources (src/app/appstore-add-service.component.ts).
#
#   SELECT     — a curated catalog tile (pre-built image). Deploys today.
#   GIT        — a git/GitLab repo that builds its own image. Deploys today.
#   DOCKERFILE — a dropped Dockerfile built in-cluster first. NEEDS the Kaniko builder.
#   ZIP        — an uploaded zip-as-repo built in-cluster first. NEEDS the Kaniko builder.
#
# Ships dark: DOCKERFILE + ZIP depend on the in-cluster Kaniko builder (the
# generator leg) which does not exist yet, so the UI presents those two radio
# options DISABLED + badged "needs builder", and the bff rejects them 400 if
# forced. SELECT/GIT provision returns 200 but the NoopArgoCdClient makes no real
# ArgoCD mutation — the UI is explicit that it records intent + wires the role/route.
#
# Each scenario flows: pick a domain → load its recorded deployment rows → choose
# a row → choose a source + repo coordinates → Provision.
#
# @cluster: needs the built remote + a real admin-bff
# /bff/superadmin/service-store endpoint, so these are SKIPPED at runtime unless
# E2E_CLUSTER=1 (see features/support/fixtures.ts). The exact path/body contract
# is already proven offline by src/app/appstore-add-service.e2e.spec.ts (karma,
# fetch-stubbed); this BDD layer is the through-the-browser presentation. bddgen
# + `playwright test --list` discover these regardless.
@cluster
Feature: Superadmin adds a service via the four sources
  As a superadmin curating a domain's services
  I want to provision a recorded deployment from one of the four sources
  So the per-service role + route-access rule are wired and ArgoCD picks it up

  Background:
    Given "superadmin" opens the appstore at "/appstore/add"
    And the appstore console nav is visible

  Scenario: the add view explains the ships-dark effector before any provision
    Then the ships-dark effector note is shown
    And the "add" view is shown

  Scenario: add a service via the SELECT (catalog) source
    Given the domain "acme.test" is loaded with recorded deployments
    When the superadmin chooses the first recorded deployment
    And the superadmin picks the "SELECT" source
    And the superadmin enters the repository URL "https://git.acme.test/catalog/owncast.git"
    And the superadmin provisions the service
    Then a provision success notice is shown
    And the deployment list reflects the applied propagation state

  Scenario: add a service via the GIT source with a path and revision
    Given the domain "acme.test" is loaded with recorded deployments
    When the superadmin chooses the first recorded deployment
    And the superadmin picks the "GIT" source
    And the superadmin enters the repository URL "https://gitlab.acme.test/svc/phpbb.git"
    And the superadmin enters the repo path "deploy/"
    And the superadmin enters the target revision "main"
    And the superadmin provisions the service
    Then a provision success notice is shown

  Scenario: the DOCKERFILE and ZIP sources are offered but DISABLED (ships dark)
    Given the domain "acme.test" is loaded with recorded deployments
    When the superadmin chooses the first recorded deployment
    Then the "DOCKERFILE" source option is disabled and badged "needs builder"
    And the "ZIP" source option is disabled and badged "needs builder"
    And the Provision button is disabled until a live source and repo URL are chosen

  Scenario: provisioning is blocked until a deployment, a live source, and a repo URL are present
    Given the domain "acme.test" is loaded with recorded deployments
    Then the Provision button is disabled until a live source and repo URL are chosen
    When the superadmin chooses the first recorded deployment
    And the superadmin picks the "SELECT" source
    And the superadmin enters the repository URL "https://git.acme.test/catalog/owncast.git"
    Then the Provision button is enabled
