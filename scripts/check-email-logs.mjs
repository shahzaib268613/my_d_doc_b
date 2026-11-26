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

const cols = await client.query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'newsletter_email_logs'
  ORDER BY ordinal_position
`)
console.log(
  'cols',
  cols.rows.map((row) => row.column_name),
)

const sample = await client.query(`
  SELECT
    id,
    recipient,
    subject,
    message IS NOT NULL AS has_message,
    left(coalesce(message, ''), 80) AS msg_preview,
    created_at
  FROM newsletter_email_logs
  ORDER BY created_at DESC
  LIMIT 5
`)
console.log(sample.rows)

const grouped = await client.query(`
  WITH latest AS (
    SELECT DISTINCT ON (lower(recipient))
      id,
      batch_id AS "batchId",
      subscriber_id AS "subscriberId",
      recipient,
      subject,
      message,
      status,
      error,
      created_at AS "createdAt"
    FROM newsletter_email_logs
    ORDER BY lower(recipient), created_at DESC
  ),
  counts AS (
    SELECT lower(recipient) AS email_key, count(*)::int AS send_count
    FROM newsletter_email_logs
    GROUP BY lower(recipient)
  )
  SELECT
    latest.*,
    counts.send_count AS "sendCount"
  FROM latest
  INNER JOIN counts ON counts.email_key = lower(latest.recipient)
  ORDER BY latest."createdAt" DESC
  LIMIT 5
`)
console.log('grouped keys', Object.keys(grouped.rows[0] ?? {}))
console.log(
  'grouped preview',
  grouped.rows.map((row) => ({
    recipient: row.recipient,
    sendCount: row.sendCount,
    hasMessage: Boolean(row.message),
    messageKeys: Object.keys(row).filter((key) => key.toLowerCase().includes('message')),
  })),
)

await client.end()
