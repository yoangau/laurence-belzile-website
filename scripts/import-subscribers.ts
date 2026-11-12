/**
 * Imports the v1 newsletter list (DynamoDB table `laurence-belzile-website-email-list`) into D1.
 *
 * 1. AWS console → DynamoDB → the table → "Explore items" → select all → "Download results to CSV".
 * 2. npm run subscribers:import -- export.csv            (local D1)
 *    npm run subscribers:import -- export.csv --remote   (production D1)
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { remote: { type: 'boolean', default: false } },
});
const file = positionals[0];
if (!file) throw new Error('Usage: npm run subscribers:import -- <export.csv> [--remote]');

/** Minimal CSV parser (handles quoted fields, which is all DynamoDB exports use). */
const parseCsv = (text: string): string[][] =>
  text
    .trim()
    .split(/\r?\n/)
    .map((line) =>
      [...line.matchAll(/("([^"]|"")*"|[^,]*)(,|$)/g)]
        .map((m) => m[1]!.replace(/^"|"$/g, '').replace(/""/g, '"'))
        .slice(0, -1),
    );

const [header, ...rows] = parseCsv(readFileSync(file, 'utf8'));
const col = (name: string) => header!.findIndex((h) => h.replace(/\s*\(.*\)$/, '').trim() === name);
const emailCol = col('email');
const dateCol = col('createdAt');
if (emailCol < 0) throw new Error(`No "email" column in ${file} (columns: ${header!.join(', ')})`);

const sqlString = (s: string) => `'${s.replace(/'/g, "''")}'`;
const statements = rows
  .map((r) => ({
    email: r[emailCol]?.trim().toLowerCase() ?? '',
    createdAt: (dateCol >= 0 && r[dateCol]) || new Date().toISOString(),
  }))
  .filter((r) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email))
  .map(
    (r) =>
      `INSERT OR IGNORE INTO subscribers (email, locale, created_at) VALUES (${sqlString(r.email)}, 'fr', ${sqlString(r.createdAt)});`,
  );

mkdirSync('.migration', { recursive: true });
writeFileSync('.migration/subscribers.sql', statements.join('\n'));
console.log(`${statements.length} subscribers → .migration/subscribers.sql`);
execFileSync(
  'npx',
  ['wrangler', 'd1', 'execute', 'lb', values.remote ? '--remote' : '--local', '--file', '.migration/subscribers.sql'],
  {
    stdio: 'inherit',
  },
);
