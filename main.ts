import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

// These caps are part of the hand-in contract and are kept in one immutable shape.
const limits = {
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
  text_max_bytes: 160 * 1024,
  screenshots: { max: 4, max_bytes: 256 * 1024 }
};

// Assemble an output directory from the checked-in app and its reference renders.
function assemble(destination: string) {
  const target = resolve(destination);
  const root = dirname(new URL(import.meta.url).pathname);
  mkdirSync(target, { recursive: true });
  cpSync(join(root, 'app'), join(target, 'app'), { recursive: true });
  cpSync(join(root, 'screenshots'), join(target, 'screenshots'), { recursive: true });
  const dossier = buildDossier(target, limits);
  writeFileSync(join(target, 'dossier.json'), dossier);
}

// The harness supplies an output location; local runs use the conventional mount.
const output = process.env.MAKEFUN_OUTPUT_DIR || '/output';
assemble(output);
