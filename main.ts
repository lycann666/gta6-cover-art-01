// Vice City Cover Maker — the entry program for gta6-cover-art-01 (Node 22, stdlib only).
// It hands the app in: copies this repo's app/ and screenshots/ into /output and writes
// /output/dossier.json with buildDossier from the kit's vendored library. Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The grader runs it with /output as the destination and no network, so it only uses the
// Node standard library and the vendored makefun-app.ts that ships in this repo.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Resolve the repo root from this file's own URL, so the program works wherever it is run from.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from a clean destination so a stale file from an earlier run can never leak in.
mkdirSync(outputDir, { recursive: true });
rmSync(join(outputDir, 'app'), { recursive: true, force: true });
rmSync(join(outputDir, 'screenshots'), { recursive: true, force: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier is the judge's view of the entry: the same caps the scorer enforces,
// so a dossier that builds here is one the gate accepts.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`Vice City Cover Maker handed in to ${outputDir}`);
