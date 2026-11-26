import type {
  NewsletterEmailLog,
  NewsletterSubscriber,
} from '../../database/schema.js'

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type SubscriberListItem = NewsletterSubscriber

export type BatchStatus = {
  id: string
  total: number
  sent: number
  failed: number
  status: string
  subject: string
}

export type EmailLogListItem = NewsletterEmailLog

export type ImportResult = {
  imported: number
  skipped: number
  total: number
}
