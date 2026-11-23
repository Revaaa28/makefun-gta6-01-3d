// Costa Serena — the make.fun gta6-01 entry program (Node 22, standard library only).
//
// The game itself is the game/ folder beside this file: plain static files a desktop
// browser plays offline (game/index.html, its classic scripts and a vendored three.js).
// This program hands the entry in exactly the way the bounty asks: it copies game/ and
// screenshots/ into the output directory and writes dossier.json there with the
// vendored make.fun library, so the dossier the judge reads is built from the very
// files being handed in.
//
// Run it locally the same way the grader does, with MAKEFUN_OUTPUT_DIR naming a
// scratch folder instead of /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below are the gate's own (the kit's reference gate limits): the dossier
// text is capped, screenshots are at most 4 files of 256 KiB, and game/ stays under
// 993 entries, 48 MiB and 1000-byte paths, so an entry this program writes is one
// the scorer can accept.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
