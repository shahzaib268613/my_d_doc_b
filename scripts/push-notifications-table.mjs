import { readFileSync } from 'node:fs'
import pg from 'pg'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=')
      return [line.slice(0, i), line.slice(i + 1)]
    }),
)

const client = new pg.Client({ connectionString: env.DATABASE_URL })
await client.connect()

await client.query(`
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  href text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS admin_notifications_created_at_idx
  ON admin_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_notifications_is_read_created_at_idx
  ON admin_notifications (is_read, created_at DESC);
`)

console.log('admin_notifications table ready')
await client.end()
