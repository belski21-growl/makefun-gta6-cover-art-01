import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

// Centralize package caps so the dossier uses the same limits on every run.
const packageBudget = {
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
  text_max_bytes: 160 * 1024,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
};

// Locate source assets relative to this script, independent of the launch cwd.
const repository = resolve(import.meta.dirname);

// Assemble an output copy, then persist the dossier bytes supplied by the kit.
function assemble(destination: string): void {
  const target = resolve(destination);
  // Ensure the destination exists before either recursive copy begins.
  mkdirSync(target, { recursive: true });
  // Copy the built browser application as a complete directory tree.
  cpSync(join(repository, 'app'), join(target, 'app'), { recursive: true });
  // Preserve the supplied capture images alongside the app package.
  cpSync(join(repository, 'screenshots'), join(target, 'screenshots'), { recursive: true });
  // The kit returns serialized dossier content ready for direct file output.
  const report = buildDossier(target, packageBudget);
  writeFileSync(join(target, 'dossier.json'), report);
}

// Honor the configured output path, with the conventional container location.
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
assemble(destination);
