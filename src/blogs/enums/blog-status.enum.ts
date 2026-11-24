export const BlogStatus = {
  Draft: 'draft',
  Published: 'published',
  Scheduled: 'scheduled',
} as const

export type BlogStatus = (typeof BlogStatus)[keyof typeof BlogStatus]

export const BLOG_STATUSES = Object.values(BlogStatus)
