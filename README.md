# snapdragon-superadmin-appstore-ui

The **Superadmin App-Store console** — an Angular **native-federation remote** that
the `snapdragon.systems` host mounts at the apex path **`/appstore`**. It is the
SUPERADMIN console that makes the `snapdragon-admin-bff-api` App-Store **data
layer** (PR #56, `feat/superadmin-appstore-data-layer`) usable: per-domain service
**curation**, **app-profile** deploy-template CRUD, and **service-deployment**
lifecycle **accounting**.

## Federation contract

The federation-api appstore module row points at this remote:

| field | value |
| --- | --- |
| `remote_entry_url` | `http://snapdragon-superadmin-appstore-ui:8080/remoteEntry.json` |
| `metadata.mountAt` | `/appstore` |
| `metadata.requiresRole` | `superadmin` |
| `kind` | `remote-shell` |
| `visibility` | `internal` |

So this remote:

- exposes **`./Appstore`** (→ `src/app/appstore.routes.ts`, `APPSTORE_ROUTES`) in
  `federation.config.js` — the module key the host's
  `loadRemoteModule('appstore', './Appstore')` consumes;
- is served on **port 8080** (see `Dockerfile` + `nginx.conf`,
  `nginxinc/nginx-unprivileged`) so the emitted `remoteEntry.json` is reachable
  at the registered URL;
- is **internal** — the SUPERADMIN infra control plane, reachable only behind the
  gateway's `/appstore=superadmin` route-access gate and the Tailscale-VPN-only
  superadmin surface. It is **not** a public UI.

`federation-base.js` is **byte-identical** to the `snapdragon.systems` host (the
single source of truth for the shared-deps surface + RxJS skip list) so this
remote can't drift from the host or the other Snapdragon remotes.

## Role model

Mirrors `snapdragon-admin-bff-api` (the App-Store controllers + `SecurityConfig`
path gates). The UI gating is defence-in-depth convenience; the bff
`@PreAuthorize` is authoritative — every call surfaces a 403 gracefully.

| capability | composite | views |
| --- | --- | --- |
| `canManageStore` | `SUPERADMIN` | Curation, App profiles, Deployments (the whole console) |
| `canReadOwnCatalog` | `ADMIN \| SUPERADMIN` | the two-tier read-only "my domain's offered catalog" degrade on the forbidden screen |

The **entire console is SUPERADMIN-only**: every `/bff/superadmin/service-store/**`
and `/bff/superadmin/app-profiles/**` endpoint is
`@PreAuthorize("hasRole('SUPERADMIN')")` AND walled at the coarse
`/bff/superadmin/** = hasRole('SUPERADMIN')` gate. An **admin/mod/user** is denied.
An **admin** still gets a graceful read-only landing on the forbidden screen via
the two-tier `GET /bff/admin/service-store` (`hasAnyRole('ADMIN','SUPERADMIN')`)
read of their own issuer-derived domain's offered catalog.

### Forbidden redirect (critical)

A denied child guard routes to **`router.parseUrl('/appstore/forbidden')`** — the
IN-REMOTE mount-path screen, **NOT** `'/forbidden'` and **NOT** `'/login'`. The
host already authgated the user in (route-access `/appstore=superadmin`); a denial
here is a **within-service privilege boundary**, not an auth failure. (Shipping the
bare `/forbidden` was a real wiki-ui bug — the mount-prefixed path is the correct
in-remote target.)

## BFF contract (the exact PR #56 surface this console wires)

`src/app/appstore.service.ts` calls these EXACT paths (asserted in
`appstore.service.spec.ts`):

| method | path | body | role |
| --- | --- | --- | --- |
| `GET` | `/bff/superadmin/service-store/{domain}` | — | SUPERADMIN |
| `POST` | `/bff/superadmin/service-store/{domain}/offer` | `{serviceKey}` | SUPERADMIN |
| `POST` | `/bff/superadmin/service-store/{domain}/withdraw` | `{serviceKey}` | SUPERADMIN |
| `GET` | `/bff/superadmin/app-profiles` | — | SUPERADMIN |
| `GET` | `/bff/superadmin/app-profiles/{name}` | — | SUPERADMIN |
| `POST` | `/bff/superadmin/app-profiles` | `{name, profileJson}` | SUPERADMIN |
| `PUT` | `/bff/superadmin/app-profiles/{name}` | `{name, profileJson}` | SUPERADMIN |
| `DELETE` | `/bff/superadmin/app-profiles/{name}` | — | SUPERADMIN |
| `GET` | `/bff/superadmin/service-store/{domain}/deployments` | — | SUPERADMIN |
| `POST` | `/bff/superadmin/service-store/{domain}/deployments` | `{serviceKey, profileRef?, endingAt?, enforceActions?}` | SUPERADMIN |
| `POST` | `/bff/superadmin/service-store/{domain}/deployments/{id}/end` | — | SUPERADMIN |
| `POST` | `/bff/superadmin/service-store/{domain}/deployments/{id}/provision` | `{sourceKind, repoUrl, path?, targetRevision?}` | SUPERADMIN |
| `GET` | `/bff/admin/service-store` | — | ADMIN \| SUPERADMIN |

The `/provision` row is the **App-Store effector** (snapdragon-admin-bff-api PR #67,
`feat/superadmin-appstore-effector`, merged): it drives an existing
`service_deployment` row from accounting-only into a real provisioned service
(per-service Casdoor role → route-access rule → ArgoCD `Application`). `sourceKind`
is one of the **four App-Store sources** — `SELECT` / `GIT` / `DOCKERFILE` / `ZIP`
(case-insensitive; null/blank → `SELECT`). `SELECT` (a catalog tile) and `GIT` (a
prebuilt repo) provision today; `DOCKERFILE` and `ZIP` need an image **built first**
by the in-cluster **Kaniko** builder (the generator leg), which does not exist yet,
so the bff rejects them with a `400` ("requires the in-cluster builder"). The effector
itself **ships dark** by default (the bff `NoopArgoCdClient` makes no real ArgoCD
mutation) — the call still returns `200`; the role + route-access leg is wired and the
real ArgoCD apply lands when the effector is enabled.

The `{domain}` is always the explicit **path** target (never a body field) — the
infra control plane picks the brand. The two-tier admin read resolves the domain
from the validated JWT issuer, never the request.

## The console

- **Add a service** — the headline flow: type/select a domain, load its recorded
  deployments (its app profile), pick one, then choose one of the **four sources** —
  **Catalog (SELECT)**, **Git / GitLab (GIT)**, **Dockerfile (DOCKERFILE)** or **Zip
  repo (ZIP)** — and **Provision** it (`POST .../deployments/{id}/provision`). SELECT
  and GIT provision today; DOCKERFILE and ZIP are presented as **disabled** radio
  options with a "needs builder" badge + help text (they need the in-cluster Kaniko
  builder, which is not available yet — the ships-dark degrade). The submit is guarded
  defence-in-depth, and the bff's authoritative `400` is surfaced verbatim. `repoUrl`
  is required (the bff `@NotBlank`); `path`/`targetRevision` are optional. The
  `{domain}` and `{id}` are the explicit PATH targets.
- **Curation** — type/select a domain, load its offered catalog, and offer or
  withdraw a `service_key` for it. Shows the current offered set per domain.
- **App profiles** — CRUD the global deploy-template library (a name + a JSON
  document of resource/role/cert/exposure defaults). The editor validates the
  JSON before saving; the values are not parsed yet (a later effector resolves
  them).
- **Deployments (accounting)** — view the `service_deployment` rows (service,
  state `active|ended`, `created_at`, `ending_at` expiry clock, `enforce_actions`,
  `propagation_state`) and **record** a deployment (`serviceKey` + optional
  profile + optional `ending_at` + optional `enforce_actions`). **Ships dark**: the
  console is explicit that the actual provision/teardown (the `AddService`
  effector) is a **later increment** — this manages the catalog + accounting +
  lifecycle the BFF supports today and does not promise a deploy that won't
  happen.

Every view has loading / empty / error states; a 403/404 degrades gracefully.

## Typed API client

`ng-openapi-gen.json` is wired (`npm run gen:fetch`) to regenerate `src/app/api/`
from the bff `/v3/api-docs` once captured, at which point `appstore.service.ts`
becomes the thin wrapper over the generated client — the public method signatures
here are the stable contract.

## Develop

```bash
npm ci
npm start          # ng serve appstore — standalone dev shell at /appstore
npm run build      # ng build appstore — dist/appstore/browser (remoteEntry.json exposes ./Appstore)
npm test           # headless karma (ChromeHeadlessCI)
```

## Accessibility

Cross-repo Snapdragon UI standard: every interactive control has a programmatic
accessible name (`accessible-name.ts` + spec), keyboard nav (the console menubar
is a roving-tabindex WAI-ARIA menubar), `disabled` + help text where relevant,
ARIA roles, visible focus rings, and loading/empty/error states announced via
`role="status"`/`role="alert"`.
