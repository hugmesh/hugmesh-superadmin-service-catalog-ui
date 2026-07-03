import { initFederation } from '@angular-architects/native-federation';

initFederation()
  .catch(console.error)
  .then(_ => import('./bootstrap'))
  .catch(console.error);
