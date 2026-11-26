import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const subscriberStatusEnum = pgEnum('subscriber_status', [
  'active',
  'unsubscribed',
])

export const subscriberSourceEnum = pgEnum('subscriber_source', [
  'homepage',
  'admin',
  'import',
])

export const emailLogStatusEnum = pgEnum('email_log_status', [
  'sent',
  'failed',
  'pending',
])

export const newsletterBatchStatusEnum = pgEnum('newsletter_batch_status', [
  'pending',
  'processing',
  'completed',
  'failed',
])

export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name'),
    email: text('email').notNull().unique(),
    status: subscriberStatusEnum('status').notNull().default('active'),
    source: subscriberSourceEnum('source').notNull().default('homepage'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('newsletter_subscribers_status_created_at_idx').on(
      table.status,
      table.createdAt,
    ),
    index('newsletter_subscribers_email_idx').on(table.email),
  ],
)

export const newsletterBatches = pgTable('newsletter_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  subject: text('subject').notNull(),
  /** Original HTML body for this send batch (used when log.message is empty). */
  html: text('html'),
  total: integer('total').notNull().default(0),
  sent: integer('sent').notNull().default(0),
  failed: integer('failed').notNull().default(0),
  status: newsletterBatchStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const newsletterEmailLogs = pgTable(
  'newsletter_email_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    batchId: uuid('batch_id').references(() => newsletterBatches.id, {
      onDelete: 'set null',
    }),
    subscriberId: uuid('subscriber_id').references(() => newsletterSubscribers.id, {
      onDelete: 'set null',
    }),
    recipient: text('recipient').notNull(),
    subject: text('subject').notNull(),
    /** HTML body that was sent (for sent-log preview). */
    message: text('message'),
    status: emailLogStatusEnum('status').notNull().default('pending'),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('newsletter_email_logs_batch_id_idx').on(table.batchId),
    index('newsletter_email_logs_created_at_idx').on(table.createdAt),
    index('newsletter_email_logs_recipient_idx').on(table.recipient),
  ],
)

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect
export type NewNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert
export type NewsletterBatch = typeof newsletterBatches.$inferSelect
export type NewNewsletterBatch = typeof newsletterBatches.$inferInsert
export type NewsletterEmailLog = typeof newsletterEmailLogs.$inferSelect
export type NewNewsletterEmailLog = typeof newsletterEmailLogs.$inferInsert
