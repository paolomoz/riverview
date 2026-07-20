import ENV from './utils/env.js';

async function loadSidekick() {
  const getSk = () => document.querySelector('aem-sidekick');

  const sk = getSk() || await new Promise((resolve) => {
    document.addEventListener('sidekick-ready', () => resolve(getSk()));
  });
  if (sk) import('../tools/sidekick/sidekick.js').then((mod) => mod.default(sk));
}

(function loadLazy() {
  // Footer fragment lands here — after every section has hydrated — so its
  // insertion at the document end cannot shift visible content (see postlcp.js).
  import('./postlcp.js').then((mod) => mod.loadStaticFragment('footer'));
  import('./utils/lazyhash.js');
  import('./utils/favicon.js');
  // Author facing tools
  if (ENV !== 'prod') {
    import('../tools/scheduler/scheduler.js');
    loadSidekick();
  }
}());
