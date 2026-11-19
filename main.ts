// Vice Cover entrypoint (Node 22, standard library only). The app is the
// static folder app/ beside this file: open app/index.html in a desktop
// browser and it works offline, no build step, no network request. This
// program hands the entry in: it copies app/ and screenshots/ next to this
// file into the output directory and writes output/dossier.json, the summary
// the judge reads, using the vendored make.fun library.
//
//   node serve.ts            # try the app locally on port 8080
//   MAKEFUN_OUTPUT_DIR=out node main.ts   # build an output directory
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps: only text_max_bytes shapes the bytes; the others make
// this program refuse exactly where the scorer would (too many or too big
// screenshots, too many app entries or bytes, or an app path too long).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
