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
DO $$ BEGIN
  CREATE TYPE subscriber_status AS ENUM ('active', 'unsubscribed');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE subscriber_source AS ENUM ('homepage', 'admin', 'import');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE email_log_status AS ENUM ('sent', 'failed', 'pending');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE newsletter_batch_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text NOT NULL UNIQUE,
  status subscriber_status NOT NULL DEFAULT 'active',
  source subscriber_source NOT NULL DEFAULT 'homepage',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_created_at_idx
  ON newsletter_subscribers (status, created_at);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_email_idx
  ON newsletter_subscribers (email);

CREATE TABLE IF NOT EXISTS newsletter_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  html text,
  total integer NOT NULL DEFAULT 0,
  sent integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  status newsletter_batch_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES newsletter_batches(id) ON DELETE SET NULL,
  subscriber_id uuid REFERENCES newsletter_subscribers(id) ON DELETE SET NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  message text,
  status email_log_status NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS newsletter_email_logs_batch_id_idx
  ON newsletter_email_logs (batch_id);
CREATE INDEX IF NOT EXISTS newsletter_email_logs_created_at_idx
  ON newsletter_email_logs (created_at);
CREATE INDEX IF NOT EXISTS newsletter_email_logs_recipient_idx
  ON newsletter_email_logs (recipient);
`)

// Separate statements so existing tables always get new columns.
await client.query(
  'ALTER TABLE newsletter_batches ADD COLUMN IF NOT EXISTS html text',
)
await client.query(
  'ALTER TABLE newsletter_email_logs ADD COLUMN IF NOT EXISTS message text',
)

console.log('newsletter tables ready')
await client.end()
