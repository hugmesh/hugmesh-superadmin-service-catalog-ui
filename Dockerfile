# hugmesh-superadmin-service-catalog-ui — builds the Superadmin Service Catalog
# native-federation REMOTE (src → dist/service-catalog/browser) and serves it via nginx
# with CORS so the hugmesh.net host can fetch its remoteEntry.json
# cross-origin.
#
# Serves on :8080 to MATCH the federation-api service-catalog module registration:
#   remote_entry_url = http://hugmesh-superadmin-service-catalog-ui:8080/remoteEntry.json
# The remoteEntry.json the production build emits exposes ./ServiceCatalog (the host
# loadRemoteModule('service-catalog','./ServiceCatalog') mounts SERVICE_CATALOG_ROUTES at /service-catalog).
#
# visibility=internal: the service-catalog remote is the SUPERADMIN infra control plane.
# It is reachable only behind the gateway's /service-catalog=superadmin route-access
# gate and the TAILSCALE-VPN-ONLY superadmin surface — it is NOT a public UI.
# Consumes same-origin /bff/superadmin/service-store + /bff/superadmin/app-profiles
# (+ the two-tier /bff/admin/service-store read) on hugmesh-admin-bff-api.
# Angular CLI 22 requires Node >= 24.15.
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:service-catalog
# ASSERT THE ARTEFACT, not the builder's exit code. scripts/assert-artefact-routes.mjs
# existed and was wired into NOTHING -- present in package.json and the README, run by no
# CI job and no image build -- so the defect class it was written to catch (a route that
# compiles but never reaches the emitted bundle) still shipped green. An unwired guard is
# a comment. This is the one place every deployable artefact passes through.
RUN npm run verify:artefact

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/service-catalog/browser /usr/share/nginx/html
EXPOSE 8080
