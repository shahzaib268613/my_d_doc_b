import { sql } from 'drizzle-orm'
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const blogStatusEnum = pgEnum('blog_status', [
  'draft',
  'published',
  'scheduled',
])

export const blogs = pgTable(
  'blogs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    excerpt: text('excerpt').notNull().default(''),
    content: text('content').notNull().default(''),
    coverImage: text('cover_image'),
    category: text('category').notNull().default(''),
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    status: blogStatusEnum('status').notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true, mode: 'date' }),
    views: integer('views').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('blogs_status_published_at_idx').on(table.status, table.publishedAt),
    index('blogs_scheduled_at_idx').on(table.scheduledAt),
  ],
)

export type Blog = typeof blogs.$inferSelect
export type NewBlog = typeof blogs.$inferInsert

export const schema = { blogs }
