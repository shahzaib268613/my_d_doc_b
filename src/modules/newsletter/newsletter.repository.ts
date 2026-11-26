import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'
import type { Database } from '../../database/database.js'
import {
  newsletterBatches,
  newsletterEmailLogs,
  newsletterSubscribers,
  type NewNewsletterBatch,
  type NewNewsletterEmailLog,
  type NewNewsletterSubscriber,
  type NewsletterBatch,
  type NewsletterEmailLog,
  type NewsletterSubscriber,
} from '../../database/schema.js'

@Injectable()
export class NewsletterRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async createSubscriber(
    values: NewNewsletterSubscriber,
  ): Promise<NewsletterSubscriber> {
    const [row] = await this.db
      .insert(newsletterSubscribers)
      .values(values)
      .returning()
    return row
  }

  async findByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
    const [row] = await this.db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1)
    return row
  }

  async findById(id: string): Promise<NewsletterSubscriber | undefined> {
    const [row] = await this.db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, id))
      .limit(1)
    return row
  }

  async updateSubscriber(
    id: string,
    values: Partial<NewNewsletterSubscriber>,
  ): Promise<NewsletterSubscriber | undefined> {
    const [row] = await this.db
      .update(newsletterSubscribers)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(newsletterSubscribers.id, id))
      .returning()
    return row
  }

  async deleteSubscriber(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, id))
      .returning({ id: newsletterSubscribers.id })
    return rows.length > 0
  }

  async findActivePage(input: {
    search?: string
    page: number
    limit: number
  }): Promise<{ items: NewsletterSubscriber[]; total: number }> {
    const filters: SQL[] = [eq(newsletterSubscribers.status, 'active')]
    if (input.search) {
      const pattern = `%${input.search}%`
      filters.push(
        or(
          ilike(newsletterSubscribers.email, pattern),
          ilike(newsletterSubscribers.name, pattern),
        )!,
      )
    }
    const where = and(...filters)
    const offset = (input.page - 1) * input.limit

    const [items, totalRow] = await Promise.all([
      this.db
        .select()
        .from(newsletterSubscribers)
        .where(where)
        .orderBy(desc(newsletterSubscribers.createdAt))
        .limit(input.limit)
        .offset(offset),
      this.db.select({ value: count() }).from(newsletterSubscribers).where(where),
    ])

    return { items, total: Number(totalRow[0]?.value ?? 0) }
  }

  async countActive(): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, 'active'))
    return Number(row?.value ?? 0)
  }

  async findActiveByIds(ids: string[]): Promise<NewsletterSubscriber[]> {
    if (ids.length === 0) return []
    return this.db
      .select()
      .from(newsletterSubscribers)
      .where(
        and(
          inArray(newsletterSubscribers.id, ids),
          eq(newsletterSubscribers.status, 'active'),
        ),
      )
  }

  async findAllActive(): Promise<NewsletterSubscriber[]> {
    return this.db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, 'active'))
      .orderBy(desc(newsletterSubscribers.createdAt))
  }

  async createBatch(values: NewNewsletterBatch): Promise<NewsletterBatch> {
    const [row] = await this.db.insert(newsletterBatches).values(values).returning()
    return row
  }

  async updateBatch(
    id: string,
    values: Partial<NewNewsletterBatch>,
  ): Promise<NewsletterBatch | undefined> {
    const [row] = await this.db
      .update(newsletterBatches)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(newsletterBatches.id, id))
      .returning()
    return row
  }

  async findBatch(id: string): Promise<NewsletterBatch | undefined> {
    const [row] = await this.db
      .select()
      .from(newsletterBatches)
      .where(eq(newsletterBatches.id, id))
      .limit(1)
    return row
  }

  async incrementBatchCounters(
    id: string,
    field: 'sent' | 'failed',
  ): Promise<void> {
    if (field === 'sent') {
      await this.db
        .update(newsletterBatches)
        .set({
          sent: sql`${newsletterBatches.sent} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(newsletterBatches.id, id))
      return
    }
    await this.db
      .update(newsletterBatches)
      .set({
        failed: sql`${newsletterBatches.failed} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(newsletterBatches.id, id))
  }

  async createEmailLog(values: NewNewsletterEmailLog): Promise<NewsletterEmailLog> {
    const [row] = await this.db
      .insert(newsletterEmailLogs)
      .values(values)
      .returning()
    return row
  }

  async findLogsPage(input: {
    page: number
    limit: number
  }): Promise<{ items: NewsletterEmailLog[]; total: number }> {
    const offset = (input.page - 1) * input.limit
    const [items, totalRow] = await Promise.all([
      this.db
        .select()
        .from(newsletterEmailLogs)
        .orderBy(desc(newsletterEmailLogs.createdAt))
        .limit(input.limit)
        .offset(offset),
      this.db.select({ value: count() }).from(newsletterEmailLogs),
    ])
    return { items, total: Number(totalRow[0]?.value ?? 0) }
  }
}
