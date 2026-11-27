import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import nodemailer, { type Transporter } from 'nodemailer'
import { renderEmailTemplate } from '../../mail/email-template.js'

export type SendMailInput = {
  to: string
  subject: string
  /** Inner HTML content; wrapped in the shared brand template unless `raw` is true. */
  html: string
  preheader?: string
  introHtml?: string
  footerHtml?: string
  /** Skip the shared template (send HTML as-is). */
  raw?: boolean
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter: Transporter | null = null

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter

    const host = this.config.get<string>('SMTP_HOST')
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587)
    const user = this.config.get<string>('SMTP_USER')
    const pass = this.config.get<string>('SMTP_PASS')
    const secure =
      String(this.config.get<string>('SMTP_SECURE') ?? 'false').toLowerCase() ===
      'true'

    if (!host || !user || !pass) {
      throw new ServiceUnavailableException(
        'SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.',
      )
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })

    return this.transporter
  }

  getFromAddress() {
    return (
      this.config.get<string>('MAIL_FROM') ??
      this.config.get<string>('SMTP_USER') ??
      'noreply@example.com'
    )
  }

  private buildHtml(input: SendMailInput) {
    if (input.raw) return input.html

    return renderEmailTemplate({
      title: input.subject,
      preheader: input.preheader ?? input.subject,
      introHtml: input.introHtml,
      bodyHtml: input.html,
      footerHtml: input.footerHtml,
    })
  }

  async sendMail(input: SendMailInput): Promise<void> {
    const transporter = this.getTransporter()
    const html = this.buildHtml(input)

    try {
      await transporter.sendMail({
        from: this.getFromAddress(),
        to: input.to,
        subject: input.subject,
        html,
      })
    } catch (error) {
      this.logger.error(`Failed to send mail to ${input.to}`, error)
      throw error
    }
  }
}
