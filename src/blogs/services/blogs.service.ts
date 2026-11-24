import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { toBaseSlug, withSlugSuffix } from '../../common/utils/slug.util.js'
import type { Blog } from '../../db/schema.js'
import { BlogStatus } from '../enums/blog-status.enum.js'
import type {
  BlogCounts,
  PaginatedBlogs,
} from '../interfaces/paginated-blogs.interface.js'
import { BlogsRepository } from '../repositories/blogs.repository.js'
import type {
  CreateBlogInput,
  PublicListQuery,
  QueryBlogInput,
  UpdateBlogInput,
} from '../schemas/blog.schemas.js'
import { isUniqueViolation } from '../utils/db-errors.js'

@Injectable()
export class BlogsService {
  constructor(private readonly blogs: BlogsRepository) {}

  async create(input: CreateBlogInput): Promise<Blog> {
    this.assertScheduledRules(input.status, input.scheduledAt ?? null)

    const slugProvided = Boolean(input.slug?.trim())
    const base = toBaseSlug(input.slug?.trim() || input.title)
    const slug = slugProvided
      ? await this.requireAvailableSlug(base)
      : await this.allocateUniqueSlug(base)
    const now = new Date()
    const status = input.status
    const publishedAt = status === BlogStatus.Published ? now : null
    const scheduledAt =
      status === BlogStatus.Scheduled ? (input.scheduledAt ?? null) : null

    try {
      return await this.blogs.create({
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: input.content,
        coverImage: input.coverImage ?? null,
        category: input.category,
        tags: input.tags,
        status,
        publishedAt,
        scheduledAt,
        views: 0,
      })
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('A blog with that slug already exists')
      }
      throw error
    }
  }

  async update(id: string, input: UpdateBlogInput): Promise<Blog> {
    const existing = await this.requireById(id)
    const nextStatus = input.status ?? existing.status

    const scheduledAt =
      input.scheduledAt !== undefined
        ? input.scheduledAt
        : nextStatus === BlogStatus.Scheduled
          ? existing.scheduledAt
          : null

    this.assertScheduledRules(nextStatus, scheduledAt)

    // Slug is independently editable — never auto-overwrite from title.
    let nextSlug = existing.slug
    if (input.slug !== undefined) {
      const requested = toBaseSlug(input.slug)
      if (requested !== existing.slug) {
        nextSlug = await this.requireAvailableSlug(requested, existing.id)
      }
    }

    const resolvedPublishedAt =
      nextStatus === BlogStatus.Published
        ? (existing.publishedAt ?? new Date())
        : null

    const resolvedScheduledAt =
      nextStatus === BlogStatus.Scheduled ? scheduledAt : null

    try {
      const updated = await this.blogs.updateById(id, {
        title: input.title ?? existing.title,
        slug: nextSlug,
        excerpt: input.excerpt ?? existing.excerpt,
        content: input.content ?? existing.content,
        coverImage:
          input.coverImage !== undefined ? input.coverImage : existing.coverImage,
        category: input.category ?? existing.category,
        tags: input.tags ?? existing.tags,
        status: nextStatus,
        publishedAt: resolvedPublishedAt,
        scheduledAt: resolvedScheduledAt,
      })
      if (!updated) throw new NotFoundException('Blog not found')
      return updated
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('A blog with that slug already exists')
      }
      throw error
    }
  }

  async isSlugAvailable(slug: string, excludeId?: string): Promise<{ available: boolean; slug: string }> {
    const normalized = toBaseSlug(slug)
    const exists = await this.blogs.slugExists(normalized, excludeId)
    return { available: !exists, slug: normalized }
  }

  async publish(id: string): Promise<Blog> {
    const existing = await this.requireById(id)
    const updated = await this.blogs.updateById(id, {
      status: BlogStatus.Published,
      publishedAt: existing.publishedAt ?? new Date(),
      scheduledAt: null,
    })
    if (!updated) throw new NotFoundException('Blog not found')
    return updated
  }

  async unpublish(id: string): Promise<Blog> {
    await this.requireById(id)
    const updated = await this.blogs.updateById(id, {
      status: BlogStatus.Draft,
      publishedAt: null,
      scheduledAt: null,
    })
    if (!updated) throw new NotFoundException('Blog not found')
    return updated
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.blogs.deleteById(id)
    if (!deleted) throw new NotFoundException('Blog not found')
  }

  async findAdminById(id: string): Promise<Blog> {
    return this.requireById(id)
  }

  async findAdminPage(query: QueryBlogInput): Promise<PaginatedBlogs<Blog>> {
    const { items, total } = await this.blogs.findAdminPage(query)
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit) || 1),
    }
  }

  async counts(): Promise<BlogCounts> {
    return this.blogs.counts()
  }

  async findPublicPage(query: PublicListQuery) {
    const { items, total } = await this.blogs.findPublishedPage(query)
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit) || 1),
    }
  }

  async findPublicBySlug(slug: string): Promise<Blog> {
    const blog = await this.blogs.findPublishedBySlug(slug)
    if (!blog) throw new NotFoundException('Blog not found')
    return blog
  }

  async recordView(slug: string): Promise<{ views: number }> {
    const blog = await this.blogs.findPublishedBySlug(slug)
    if (!blog) throw new NotFoundException('Blog not found')
    const updated = await this.blogs.incrementViews(blog.id)
    if (!updated) throw new NotFoundException('Blog not found')
    return { views: updated.views }
  }

  async publishDueScheduled(): Promise<number> {
    return this.blogs.publishDueScheduled(new Date())
  }

  private async requireById(id: string): Promise<Blog> {
    const blog = await this.blogs.findById(id)
    if (!blog) throw new NotFoundException('Blog not found')
    return blog
  }

  private assertScheduledRules(
    status: string,
    scheduledAt: Date | null | undefined,
  ) {
    if (status !== BlogStatus.Scheduled) return
    if (!scheduledAt) {
      throw new BadRequestException(
        'scheduledAt is required when status is scheduled',
      )
    }
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'scheduledAt must be a future date/time (UTC)',
      )
    }
  }

  private async requireAvailableSlug(
    base: string,
    excludeId?: string,
  ): Promise<string> {
    const exists = await this.blogs.slugExists(base, excludeId)
    if (exists) {
      throw new ConflictException('A blog with that slug already exists')
    }
    return base
  }

  private async allocateUniqueSlug(
    base: string,
    excludeId?: string,
  ): Promise<string> {
    for (let attempt = 1; attempt <= 50; attempt += 1) {
      const candidate = withSlugSuffix(base, attempt)
      const exists = await this.blogs.slugExists(candidate, excludeId)
      if (!exists) return candidate
    }
    throw new ConflictException('Unable to allocate a unique slug')
  }
}
