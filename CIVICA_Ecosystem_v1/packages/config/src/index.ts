import fs from 'node:fs';
import path from 'node:path';

export function loadEnvLocal(fromDir = process.cwd()) {
  let dir = fromDir;
  while (dir !== path.dirname(dir)) {
    const file = path.join(dir, '.env.local');
    if (fs.existsSync(file)) {
      for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const index = trimmed.indexOf('=');
        if (index === -1) continue;
        const key = trimmed.slice(0, index);
        const value = trimmed.slice(index + 1);
        process.env[key] ??= value;
      }
      return;
    }
    dir = path.dirname(dir);
  }
}
