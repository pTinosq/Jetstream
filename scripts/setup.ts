import { existsSync, copyFileSync } from 'node:fs';

// Ensure a local .env exists (it's gitignored) before migrations/seeding run.
if (existsSync('.env')) {
  console.log('.env already exists — leaving it untouched.');
} else {
  copyFileSync('.env.example', '.env');
  console.log('Created .env from .env.example.');
}
