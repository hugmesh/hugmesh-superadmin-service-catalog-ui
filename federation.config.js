// Native-federation config for the "service-catalog" remote.
//
// The shareAll args + RxJS skip list live in ./federation-base.js (copied
// BYTE-IDENTICAL from the hugmesh.net host, like every other HugMesh
// remote) so this remote's federation surface can't drift from the host. The
// remote name ("service-catalog") and the exposed module key ("./ServiceCatalog") are the
// contract the host's loadRemoteModule() depends on AND the contract the
// federation-api service-catalog module row points at:
//   remote_entry_url = http://hugmesh-superadmin-service-catalog-ui:8080/remoteEntry.json
//   metadata.mountAt = /service-catalog   metadata.requiresRole = superadmin   visibility = internal
// So the remoteEntry.json emitted by the production build MUST expose ./ServiceCatalog,
// and the container MUST serve it on :8080 (see Dockerfile + nginx.conf).
const { hugmeshRemote } = require('./federation-base');

module.exports = hugmeshRemote({
  name: 'service-catalog',
  exposes: {
    './ServiceCatalog': './src/app/service-catalog.routes.ts',
  },
});
