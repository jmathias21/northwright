import { cp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'site'), output, { recursive: true });
await cp(path.join(root, 'cloudflare/worker.js'), path.join(output, '_worker.js'));
await cp(path.join(root, 'cloudflare/routes.json'), path.join(output, '_routes.json'));
// Version asset URLs so returning visitors cannot combine new HTML with old form code.
const versions = new Map();
for (const asset of ['main.js', 'styles.css']) {
  const bytes = await readFile(path.join(output, asset));
  versions.set(asset, createHash('sha256').update(bytes).digest('hex').slice(0, 12));
}
for (const file of await readdir(output)) {
  if (!file.endsWith('.html')) continue;
  const filename = path.join(output, file);
  let html = await readFile(filename, 'utf8');
  for (const [asset, version] of versions) html = html.replaceAll(`"/${asset}"`, `"/${asset}?v=${version}"`);
  await writeFile(filename, html);
}
const files = await readdir(output, { recursive: true });
console.log(`Built ${files.length} entries into dist/. No runtime dependencies.`);
