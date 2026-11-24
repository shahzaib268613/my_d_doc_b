import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  lte,
  ne,
  or,
  type SQL,
  sql,
} from 'drizzle-orm'
import type { Database } from '../../db/database.js'
import { blogs, type Blog, type NewBlog } from '../../db/schema.js'
import { BlogStatus } from '../enums/blog-status.enum.js'
import type { BlogCounts } from '../interfaces/paginated-blogs.interface.js'

@Injectable()
export class BlogsRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async create(values: NewBlog): Promise<Blog> {
    const [row] = await this.db.insert(blogs).values(values).returning()
    return row
  }

  async updateById(id: string, values: Partial<NewBlog>): Promise<Blog | undefined> {
    const [row] = await this.db
      .update(blogs)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(blogs.id, id))
      .returning()
    return row
  }

  async deleteById(id: string): Promise<boolean> {
    const rows = await this.db.delete(blogs).where(eq(blogs.id, id)).returning({
      id: blogs.id,
    })
    return rows.length > 0
  }

  async findById(id: string): Promise<Blog | undefined> {
    const [row] = await this.db.select().from(blogs).where(eq(blogs.id, id)).limit(1)
    return row
  }

  async findBySlug(slug: string): Promise<Blog | undefined> {
    const [row] = await this.db
      .select()
      .from(blogs)
      .where(eq(blogs.slug, slug))
      .limit(1)
    return row
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const conditions = [eq(blogs.slug, slug)]
    if (excludeId) conditions.push(ne(blogs.id, excludeId))
    const [row] = await this.db
      .select({ id: blogs.id })
      .from(blogs)
      .where(and(...conditions))
      .limit(1)
    return Boolean(row)
  }

  async findAdminPage(input: {
    status?: string
    search?: string
    page: number
    limit: number
  }): Promise<{ items: Blog[]; total: number }> {
    const filters: SQL[] = []
    if (input.status) filters.push(eq(blogs.status, input.status as Blog['status']))
    if (input.search) {
      const pattern = `%${input.search}%`
      filters.push(
        or(ilike(blogs.title, pattern), ilike(blogs.excerpt, pattern), ilike(blogs.slug, pattern))!,
      )
    }
    const where = filters.length ? and(...filters) : undefined
    const offset = (input.page - 1) * input.limit

    const [items, totalRow] = await Promise.all([
      this.db
        .select()
        .from(blogs)
        .where(where)
        .orderBy(desc(blogs.updatedAt))
        .limit(input.limit)
        .offset(offset),
      this.db.select({ value: count() }).from(blogs).where(where),
    ])

    return { items, total: Number(totalRow[0]?.value ?? 0) }
  }

  async findPublishedPage(input: {
    page: number
    limit: number
    category?: string
  }): Promise<{ items: Omit<Blog, 'content'>[]; total: number }> {
    const filters: SQL[] = [eq(blogs.status, BlogStatus.Published)]
    if (input.category) filters.push(eq(blogs.category, input.category))
    const where = and(...filters)
    const offset = (input.page - 1) * input.limit

    const listColumns = {
      id: blogs.id,
      title: blogs.title,
      slug: blogs.slug,
      excerpt: blogs.excerpt,
      coverImage: blogs.coverImage,
      category: blogs.category,
      tags: blogs.tags,
      status: blogs.status,
      publishedAt: blogs.publishedAt,
      scheduledAt: blogs.scheduledAt,
      views: blogs.views,
      createdAt: blogs.createdAt,
      updatedAt: blogs.updatedAt,
    }

    const [items, totalRow] = await Promise.all([
      this.db
        .select(listColumns)
        .from(blogs)
        .where(where)
        .orderBy(desc(blogs.publishedAt), desc(blogs.createdAt))
        .limit(input.limit)
        .offset(offset),
      this.db.select({ value: count() }).from(blogs).where(where),
    ])

    return { items, total: Number(totalRow[0]?.value ?? 0) }
  }

  async findPublishedBySlug(slug: string): Promise<Blog | undefined> {
    const [row] = await this.db
      .select()
      .from(blogs)
      .where(and(eq(blogs.slug, slug), eq(blogs.status, BlogStatus.Published)))
      .limit(1)
    return row
  }

  async incrementViews(id: string): Promise<Blog | undefined> {
    const [row] = await this.db
      .update(blogs)
      .set({ views: sql`${blogs.views} + 1`, updatedAt: new Date() })
      .where(and(eq(blogs.id, id), eq(blogs.status, BlogStatus.Published)))
      .returning()
    return row
  }

  async counts(): Promise<BlogCounts> {
    const rows = await this.db
      .select({ status: blogs.status, value: count() })
      .from(blogs)
      .groupBy(blogs.status)

    const result: BlogCounts = { all: 0, draft: 0, published: 0, scheduled: 0 }
    for (const row of rows) {
      const value = Number(row.value)
      result.all += value
      if (row.status === BlogStatus.Draft) result.draft = value
      if (row.status === BlogStatus.Published) result.published = value
      if (row.status === BlogStatus.Scheduled) result.scheduled = value
    }
    return result
  }

  async publishDueScheduled(now = new Date()): Promise<number> {
    const rows = await this.db
      .update(blogs)
      .set({
        status: BlogStatus.Published,
        publishedAt: now,
        scheduledAt: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(blogs.status, BlogStatus.Scheduled),
          lte(blogs.scheduledAt, now),
        ),
      )
      .returning({ id: blogs.id })
    return rows.length
  }

  async listDueScheduled(now = new Date()): Promise<Blog[]> {
    return this.db
      .select()
      .from(blogs)
      .where(
        and(
          eq(blogs.status, BlogStatus.Scheduled),
          lte(blogs.scheduledAt, now),
        ),
      )
      .orderBy(asc(blogs.scheduledAt))
  }
}
