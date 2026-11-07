import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import config from '../cloudflare.config.ts';

// Emit cf's Build Output Specification directly: this single ES module needs no bundler.
// Use --prebuilt for the dry run so cf does not select a separate build implementation.
const root = resolve('.cloudflare/output/v0');
const bundle = resolve(root, 'workers/default/bundle');
const { entrypoint, ...worker } = config.worker;
await mkdir(bundle, { recursive: true });
await copyFile(entrypoint, resolve(bundle, 'index.js'));
await writeFile(resolve(root, 'config.json'), JSON.stringify({ buildContext: { isPreview: false } }, null, 2) + '\n');
await writeFile(resolve(root, 'workers/default/worker.config.json'), JSON.stringify({
  ...worker,
  manifest: { type: 'complete', mainModule: 'index.js', modules: { 'index.js': { type: 'esm' } } },
}, null, 2) + '\n');
console.log('Built agentswarm-remote: .cloudflare/output/v0/workers/default/bundle/index.js');
