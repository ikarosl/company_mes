import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const currentDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(currentDir, '..');
const envPath = resolve(appRoot, '.env');

if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  config();
}
