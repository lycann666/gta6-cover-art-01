// Vice City Cover Maker — submission entrypoint (Node 22, standard library only).
// Hands the entry in: copies this repo's app/ and screenshots/ into the output
// directory and writes /output/dossier.json with the kit's vendored library.
// The app itself is plain static files under app/ (index.html + ES modules +
// bundled fonts and samples) that run offline in a desktop browser.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Directory holding this file (the repo root), resolved from the module URL.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(from, to) {
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outDir, 'app'));
copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));

// The scorer's own caps: text_max_bytes shapes the dossier text; the rest
// refuse an entry the scorer would refuse (over 4 screenshots or one over
// 256 KiB; over 993 app files or 48 MiB of app files; an app path over
// 1000 bytes). Our app is far inside all of them.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Vice City Cover Maker handed in: ${outDir} (dossier ${dossier.length} bytes).`);
