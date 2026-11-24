import { z } from 'zod'
import { BlogStatus } from '../enums/blog-status.enum.js'

const blogStatusSchema = z.enum([
  BlogStatus.Draft,
  BlogStatus.Published,
  BlogStatus.Scheduled,
])

const isoDateTime = z.coerce.date()

const coverImageSchema = z
  .union([
    z.string().trim().url(),
    z
      .string()
      .trim()
      .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,/),
    z.literal(''),
    z.null(),
  ])
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value))

export const createBlogSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    slug: z.string().trim().min(1).max(220).optional(),
    excerpt: z.string().trim().max(500).default(''),
    content: z.string().default(''),
    coverImage: coverImageSchema,
    category: z.string().trim().max(120).default(''),
    tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
    status: blogStatusSchema.default(BlogStatus.Draft),
    scheduledAt: isoDateTime.nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === BlogStatus.Scheduled) {
      if (!value.scheduledAt) {
        ctx.addIssue({
          code: 'custom',
          path: ['scheduledAt'],
          message: 'scheduledAt is required when status is scheduled',
        })
        return
      }
      if (value.scheduledAt.getTime() <= Date.now()) {
        ctx.addIssue({
          code: 'custom',
          path: ['scheduledAt'],
          message: 'scheduledAt must be a future date/time (UTC)',
        })
      }
    }
  })

export type CreateBlogInput = z.infer<typeof createBlogSchema>

export const updateBlogSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    slug: z.string().trim().min(1).max(220).optional(),
    excerpt: z.string().trim().max(500).optional(),
    content: z.string().optional(),
    coverImage: coverImageSchema,
    category: z.string().trim().max(120).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
    status: blogStatusSchema.optional(),
    scheduledAt: isoDateTime.nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === BlogStatus.Scheduled) {
      if (value.scheduledAt === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['scheduledAt'],
          message: 'scheduledAt is required when status is scheduled',
        })
        return
      }
      if (value.scheduledAt && value.scheduledAt.getTime() <= Date.now()) {
        ctx.addIssue({
          code: 'custom',
          path: ['scheduledAt'],
          message: 'scheduledAt must be a future date/time (UTC)',
        })
      }
    }
  })

export type UpdateBlogInput = z.infer<typeof updateBlogSchema>

export const queryBlogSchema = z.object({
  status: blogStatusSchema.optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export type QueryBlogInput = z.infer<typeof queryBlogSchema>

export const publicListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(6),
  category: z.string().trim().max(120).optional(),
})

export type PublicListQuery = z.infer<typeof publicListQuerySchema>

export const uuidParamSchema = z.string().uuid()
export const slugParamSchema = z.string().trim().min(1).max(220)

export const checkSlugQuerySchema = z.object({
  slug: z.string().trim().min(1).max(220),
  excludeId: z.string().uuid().optional(),
})

export type CheckSlugQuery = z.infer<typeof checkSlugQuerySchema>
