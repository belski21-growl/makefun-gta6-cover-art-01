import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

const limits = {
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
  text_max_bytes: 160 * 1024,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
};

function assembleEntry(destination: string) {
  for (const folder of ['app', 'screenshots']) {
    const source = join(import.meta.dirname, folder);
    const target = join(destination, folder);
    mkdirSync(target, { recursive: true });
    cpSync(source, target, { recursive: true });
  }
  const packet = buildDossier(destination, limits);
  writeFileSync(join(destination, 'dossier.json'), packet);
}

assembleEntry(resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output'));
