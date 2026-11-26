import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { isUniqueViolation } from '../../helpers/db-errors.js'
import type {
  CreateSubscriberInput,
  ImportSubscribersInput,
  PublicSubscribeInput,
  QueryLogsInput,
  QuerySubscribersInput,
  SendBulkInput,
  SendSingleInput,
} from './newsletter.dto.js'
import { NotificationsService } from '../notifications/notifications.service.js'
import { MailService } from './mail.service.js'
import { NewsletterRepository } from './newsletter.repository.js'
import type {
  BatchStatus,
  ImportResult,
  Paginated,
  SubscriberListItem,
} from './newsletter.types.js'
import type { NewsletterSubscriber } from '../../database/schema.js'
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from './unsubscribe-token.util.js'

const CHUNK_SIZE = 10
const CHUNK_DELAY_MS = 1000
const MAX_BULK = 500

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function personalize(html: string, name: string | null) {
  const displayName = name?.trim() || 'there'
  return html.replaceAll(/\{\{\s*name\s*\}\}/gi, displayName)
}

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name)

  constructor(
    private readonly repo: NewsletterRepository,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  private getUnsubscribeSecret() {
    const secret = this.config.get<string>('NEWSLETTER_UNSUBSCRIBE_SECRET')
    if (!secret) {
      throw new BadRequestException(
        'NEWSLETTER_UNSUBSCRIBE_SECRET is not configured',
      )
    }
    return secret
  }

  private getFrontendBaseUrl() {
    return (
      this.config.get<string>('FRONTEND_URL') ??
      this.config.get<string>('CORS_ORIGIN')?.split(',')[0]?.trim() ??
      'http://localhost:5173'
    )
  }

  private buildUnsubscribeUrl(subscriberId: string) {
    const token = createUnsubscribeToken(subscriberId, this.getUnsubscribeSecret())
    const base = this.getFrontendBaseUrl().replace(/\/$/, '')
    return `${base}/unsubscribe?token=${encodeURIComponent(token)}`
  }

  private withFooter(html: string, subscriberId: string) {
    const url = this.buildUnsubscribeUrl(subscriberId)
    return `${html}
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
<p style="font-size:12px;color:#6b7280;line-height:1.5">
  You are receiving this email because you subscribed to My Diabetes Doc updates.
  <a href="${url}" style="color:#0f766e">Unsubscribe</a>
</p>`
  }

  /** Strip auto-appended unsubscribe footer so admin logs show only composed content. */
  private stripEmailFooter(html: string | null): string | null {
    if (!html) return html
    return html
      .replace(
        /<hr[^>]*>\s*<p[^>]*>[\s\S]*?You are receiving this email because you subscribed to My Diabetes Doc updates\.[\s\S]*?<\/p>\s*$/i,
        '',
      )
      .trim()
  }

  async listActive(
    query: QuerySubscribersInput,
  ): Promise<Paginated<SubscriberListItem>> {
    const { items, total } = await this.repo.findActivePage(query)
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit) || 1),
    }
  }

  async createSubscriber(input: CreateSubscriberInput) {
    const email = normalizeEmail(input.email)
    try {
      return await this.repo.createSubscriber({
        email,
        name: input.name ?? null,
        source: input.source,
        status: 'active',
      })
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('This email is already subscribed')
      }
      throw error
    }
  }

  async publicSubscribe(input: PublicSubscribeInput) {
    const email = normalizeEmail(input.email)
    const existing = await this.repo.findByEmail(email)
    if (existing) {
      if (existing.status === 'unsubscribed') {
        const restored = await this.repo.updateSubscriber(existing.id, {
          status: 'active',
          name: input.name ?? existing.name,
          source: 'homepage',
        })
        if (!restored) throw new NotFoundException('Subscriber not found')
        await this.notifications.notifySubscriberJoined({
          email: restored.email,
          name: restored.name,
        })
        return restored
      }
      throw new ConflictException('This email is already subscribed')
    }
    try {
      const created = await this.repo.createSubscriber({
        email,
        name: input.name ?? null,
        source: 'homepage',
        status: 'active',
      })
      await this.notifications.notifySubscriberJoined({
        email: created.email,
        name: created.name,
      })
      return created
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('This email is already subscribed')
      }
      throw error
    }
  }

  async importSubscribers(input: ImportSubscribersInput): Promise<ImportResult> {
    let imported = 0
    let skipped = 0

    for (const item of input.subscribers) {
      const email = normalizeEmail(item.email)
      const existing = await this.repo.findByEmail(email)
      if (existing) {
        skipped += 1
        continue
      }
      try {
        await this.repo.createSubscriber({
          email,
          name: item.name ?? null,
          status: item.status ?? 'active',
          source: item.source ?? 'import',
          createdAt: item.createdAt,
        })
        imported += 1
      } catch (error) {
        if (isUniqueViolation(error)) {
          skipped += 1
          continue
        }
        throw error
      }
    }

    return {
      imported,
      skipped,
      total: input.subscribers.length,
    }
  }

  async deleteSubscriber(id: string) {
    const ok = await this.repo.deleteSubscriber(id)
    if (!ok) throw new NotFoundException('Subscriber not found')
  }

  async unsubscribeByToken(token: string) {
    const payload = verifyUnsubscribeToken(token, this.getUnsubscribeSecret())
    if (!payload) {
      throw new BadRequestException('Invalid or expired unsubscribe link')
    }
    const subscriber = await this.repo.findById(payload.sid)
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found')
    }
    if (subscriber.status === 'unsubscribed') {
      return { ok: true, email: subscriber.email, alreadyUnsubscribed: true }
    }
    await this.repo.updateSubscriber(subscriber.id, { status: 'unsubscribed' })
    return { ok: true, email: subscriber.email, alreadyUnsubscribed: false }
  }

  async sendSingle(input: SendSingleInput) {
    const subscriber = await this.repo.findById(input.subscriberId)
    if (!subscriber) throw new NotFoundException('Subscriber not found')
    if (subscriber.status !== 'active') {
      throw new BadRequestException('Subscriber is not active')
    }

    const batch = await this.repo.createBatch({
      subject: input.subject,
      html: input.html,
      total: 1,
      sent: 0,
      failed: 0,
      status: 'processing',
    })

    await this.deliverOne(batch.id, subscriber, input.subject, input.html)
    const updated = await this.repo.findBatch(batch.id)
    await this.repo.updateBatch(batch.id, {
      status: updated && updated.failed > 0 ? 'failed' : 'completed',
    })

    if (updated && updated.failed > 0) {
      throw new BadRequestException('Failed to send email')
    }

    return { batchId: batch.id, total: 1, sent: 1, failed: 0 }
  }

  async sendBulk(input: SendBulkInput) {
    let recipients: NewsletterSubscriber[] = []

    if (input.sendToAll) {
      recipients = await this.repo.findAllActive()
    } else {
      const ids = [...new Set(input.subscriberIds ?? [])]
      if (ids.length > MAX_BULK) {
        throw new BadRequestException(`Bulk send is capped at ${MAX_BULK} recipients`)
      }
      recipients = await this.repo.findActiveByIds(ids)
    }

    if (recipients.length === 0) {
      throw new BadRequestException('No active subscribers to email')
    }
    if (recipients.length > MAX_BULK) {
      throw new BadRequestException(`Bulk send is capped at ${MAX_BULK} recipients`)
    }

    const batch = await this.repo.createBatch({
      subject: input.subject,
      html: input.html,
      total: recipients.length,
      sent: 0,
      failed: 0,
      status: 'processing',
    })

    void this.processBulk(batch.id, recipients, input.subject, input.html)

    return { batchId: batch.id, total: recipients.length }
  }

  async getBatch(batchId: string): Promise<BatchStatus> {
    const batch = await this.repo.findBatch(batchId)
    if (!batch) throw new NotFoundException('Batch not found')
    return {
      id: batch.id,
      total: batch.total,
      sent: batch.sent,
      failed: batch.failed,
      status: batch.status,
      subject: batch.subject,
    }
  }

  async listLogs(query: QueryLogsInput) {
    const { items, total } = await this.repo.findLogsPage(query)
    return {
      items: items.map((item) => ({
        ...item,
        message: this.stripEmailFooter(item.message),
        createdAt:
          item.createdAt instanceof Date
            ? item.createdAt.toISOString()
            : item.createdAt,
      })),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit) || 1),
    }
  }

  private async processBulk(
    batchId: string,
    recipients: NewsletterSubscriber[],
    subject: string,
    html: string,
  ) {
    try {
      for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
        const chunk = recipients.slice(i, i + CHUNK_SIZE)
        await Promise.all(
          chunk.map((subscriber) =>
            this.deliverOne(batchId, subscriber, subject, html),
          ),
        )
        if (i + CHUNK_SIZE < recipients.length) {
          await sleep(CHUNK_DELAY_MS)
        }
      }
      const batch = await this.repo.findBatch(batchId)
      await this.repo.updateBatch(batchId, {
        status: batch && batch.failed === batch.total ? 'failed' : 'completed',
      })
    } catch (error) {
      this.logger.error(`Bulk batch ${batchId} failed`, error)
      await this.repo.updateBatch(batchId, { status: 'failed' })
    }
  }

  private async deliverOne(
    batchId: string,
    subscriber: NewsletterSubscriber,
    subject: string,
    html: string,
  ) {
    const body = personalize(html, subscriber.name)
    const toSend = this.withFooter(body, subscriber.id)

    try {
      await this.mail.sendMail({
        to: subscriber.email,
        subject,
        html: toSend,
      })
      await this.repo.createEmailLog({
        batchId,
        subscriberId: subscriber.id,
        recipient: subscriber.email,
        subject,
        message: body,
        status: 'sent',
        error: null,
      })
      await this.repo.incrementBatchCounters(batchId, 'sent')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Send failed'
      await this.repo.createEmailLog({
        batchId,
        subscriberId: subscriber.id,
        recipient: subscriber.email,
        subject,
        message: body,
        status: 'failed',
        error: message,
      })
      await this.repo.incrementBatchCounters(batchId, 'failed')
    }
  }
}
