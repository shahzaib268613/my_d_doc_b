import { randomBytes } from 'node:crypto'
import slugify from 'slugify'

export function toBaseSlug(input: string): string {
  const slug = slugify(input, { lower: true, strict: true, trim: true })
  if (slug.length > 0) return slug
  return `blog-${randomBytes(3).toString('hex')}`
}

export function withSlugSuffix(base: string, attempt: number): string {
  if (attempt <= 1) return base
  return `${base}-${attempt}`
}
