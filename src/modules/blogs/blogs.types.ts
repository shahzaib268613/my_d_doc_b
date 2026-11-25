import type { Blog } from '../../database/schema.js'

export type BlogListItem = Omit<Blog, 'content'>

export type PaginatedBlogs<T = BlogListItem> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type BlogCounts = {
  all: number
  draft: number
  published: number
  scheduled: number
}
