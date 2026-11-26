import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import { and, count, desc, eq } from 'drizzle-orm'
import type { Database } from '../../database/database.js'
import {
  adminNotifications,
  type AdminNotification,
  type NewAdminNotification,
} from '../../database/schema.js'

@Injectable()
export class NotificationsRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async create(values: NewAdminNotification): Promise<AdminNotification> {
    const [row] = await this.db
      .insert(adminNotifications)
      .values(values)
      .returning()
    return row
  }

  async list(limit = 20): Promise<AdminNotification[]> {
    return this.db
      .select()
      .from(adminNotifications)
      .orderBy(desc(adminNotifications.createdAt))
      .limit(limit)
  }

  async unreadCount(): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(adminNotifications)
      .where(eq(adminNotifications.isRead, false))
    return Number(row?.value ?? 0)
  }

  async markRead(id: string): Promise<AdminNotification | null> {
    const [row] = await this.db
      .update(adminNotifications)
      .set({ isRead: true })
      .where(
        and(
          eq(adminNotifications.id, id),
          eq(adminNotifications.isRead, false),
        ),
      )
      .returning()
    return row ?? null
  }

  async markAllRead(): Promise<number> {
    const rows = await this.db
      .update(adminNotifications)
      .set({ isRead: true })
      .where(eq(adminNotifications.isRead, false))
      .returning({ id: adminNotifications.id })
    return rows.length
  }

  async remove(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(adminNotifications)
      .where(eq(adminNotifications.id, id))
      .returning({ id: adminNotifications.id })
    return rows.length > 0
  }

  async clearAll(): Promise<number> {
    const rows = await this.db
      .delete(adminNotifications)
      .returning({ id: adminNotifications.id })
    return rows.length
  }
}
