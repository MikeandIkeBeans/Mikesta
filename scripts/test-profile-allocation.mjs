import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// Test the actual migration function against session-local fixtures. Every
// statement runs in a rolled-back transaction; public/auth tables are untouched.
const configuration = parseEnv(readFileSync(process.env.ENV_FILE || '.env.local', 'utf8'));
const url = new URL(configuration.DATABASE_URL);
const migration = readFileSync('supabase-schema.sql', 'utf8');
const start = migration.indexOf('create or replace function public.ensure_user_profile(');
const end = migration.indexOf('$$;', start) + 3;
if (start < 0 || end < 3) throw new Error('Profile allocator not found in migration');
const allocator = migration.slice(start, end)
  .replaceAll('public.ensure_user_profile', 'pg_temp.ensure_user_profile')
  .replaceAll('public.profiles', 'pg_temp.review_profiles');
const sql = `BEGIN;
CREATE TEMP TABLE review_profiles (
  id uuid PRIMARY KEY, username text UNIQUE NOT NULL,
  display_name text, bio text, avatar_url text
);
${allocator}
${readFileSync('supabase/tests/profile-allocation.sql', 'utf8')}
ROLLBACK;`;
const result = spawnSync(process.env.PSQL_BIN || 'psql', ['-X', '--no-password', '-v', 'ON_ERROR_STOP=1'], {
  input: sql,
  encoding: 'utf8',
  timeout: 20000,
  env: {
    ...process.env,
    PGHOST: url.hostname, PGPORT: url.port || '5432',
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password),
    PGCONNECT_TIMEOUT: '10', PGSSLMODE: 'verify-full',
    PGSSLROOTCERT: resolve(process.env.SUPABASE_CA_CERT || 'supabase-ca.crt'),
  },
});
if (result.error) throw new Error('Could not run psql. Install libpq and set PSQL_BIN to its psql executable.');
if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status || 1);
}
console.log('Profile allocation regression checks passed; temporary fixtures rolled back.');
