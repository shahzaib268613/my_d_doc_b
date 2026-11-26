import { Injectable, type MessageEvent } from '@nestjs/common'
import { Observable, Subject, interval, map, merge } from 'rxjs'
import { NotificationsRepository } from './notifications.repository.js'

@Injectable()
export class NotificationsService {
  private readonly events$ = new Subject<MessageEvent>()

  constructor(private readonly repo: NotificationsRepository) {}

  /** Live stream for admin clients (SSE). */
  stream(): Observable<MessageEvent> {
    return merge(
      this.events$.asObservable(),
      interval(20_000).pipe(map(() => ({ data: { type: 'ping' } }) as MessageEvent)),
    )
  }

  private publish(type: string, payload: Record<string, unknown> = {}) {
    this.events$.next({
      data: { type, ...payload, at: new Date().toISOString() },
    } as MessageEvent)
  }

  async notifySubscriberJoined(input: {
    email: string
    name?: string | null
  }) {
    const display = input.name?.trim() || input.email
    const row = await this.repo.create({
      type: 'newsletter_subscribe',
      title: 'New subscriber',
      body: `${display} subscribed to the newsletter.`,
      href: '/admin/newsletter',
      isRead: false,
    })
    this.publish('notification', {
      id: row.id,
      title: row.title,
      body: row.body,
    })
    return row
  }

  async list(limit = 20) {
    const items = await this.repo.list(limit)
    const unreadCount = await this.repo.unreadCount()
    return {
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        href: item.href,
        read: item.isRead,
        createdAt:
          item.createdAt instanceof Date
            ? item.createdAt.toISOString()
            : item.createdAt,
      })),
      unreadCount,
    }
  }

  async unreadCount() {
    return { unreadCount: await this.repo.unreadCount() }
  }

  async markRead(id: string) {
    const row = await this.repo.markRead(id)
    this.publish('read', { id: row?.id ?? id })
    return { ok: true, id: row?.id ?? id }
  }

  async markAllRead() {
    const updated = await this.repo.markAllRead()
    this.publish('read-all', { updated })
    return { ok: true, updated }
  }

  async remove(id: string) {
    const ok = await this.repo.remove(id)
    this.publish('removed', { id })
    return { ok, id }
  }

  async clearAll() {
    const deleted = await this.repo.clearAll()
    this.publish('cleared', { deleted })
    return { ok: true, deleted }
  }
}
