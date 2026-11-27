import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common'
import {
  buildEmailDetailsTable,
  escapeHtml,
} from '../../mail/email-template.js'
import { MailService } from '../newsletter/mail.service.js'
import { ProfileService } from '../profile/profile.service.js'
import type {
  AppointmentInquiryInput,
  PartnershipInquiryInput,
  SpeakingInquiryInput,
} from './inquiries.dto.js'

@Injectable()
export class InquiriesService {
  private readonly logger = new Logger(InquiriesService.name)

  constructor(
    private readonly profile: ProfileService,
    private readonly mail: MailService,
  ) {}

  private async adminInbox() {
    const contact = await this.profile.getPublicContact()
    if (!contact.email?.trim()) {
      throw new BadRequestException('Admin contact email is not configured')
    }
    return contact
  }

  async submitPartnership(input: PartnershipInquiryInput) {
    const admin = await this.adminInbox()
    const subject = `Brand partnership inquiry from ${input.company}`

    try {
      await this.mail.sendMail({
        to: admin.email,
        subject,
        preheader: `${input.name} from ${input.company} submitted a partnership inquiry`,
        introHtml: `<p style="margin:0;">A new brand partnership inquiry was submitted on the website and delivered to your My Profile contact email (<strong>${escapeHtml(admin.email)}</strong>).</p>`,
        html: buildEmailDetailsTable([
          { label: 'Name', value: input.name },
          { label: 'Company', value: input.company },
          { label: 'Email', value: input.email },
          { label: 'Collaboration type', value: input.collaborationType },
          { label: 'Budget range', value: input.budgetRange },
          { label: 'Timeline', value: input.timeline },
          { label: 'Message', value: input.message },
        ]),
      })
    } catch (error) {
      this.logger.error('Failed to send partnership inquiry email', error)
      throw new BadRequestException('Failed to send inquiry email')
    }

    return { ok: true }
  }

  async submitSpeaking(input: SpeakingInquiryInput) {
    const admin = await this.adminInbox()
    const subject = `Speaking engagement inquiry from ${input.organization}`

    try {
      await this.mail.sendMail({
        to: admin.email,
        subject,
        preheader: `${input.name} invited you to speak for ${input.organization}`,
        introHtml: `<p style="margin:0;">A new speaking engagement inquiry was submitted on the website and delivered to your My Profile contact email (<strong>${escapeHtml(admin.email)}</strong>).</p>`,
        html: buildEmailDetailsTable([
          { label: 'Name', value: input.name },
          { label: 'Organization', value: input.organization },
          { label: 'Email', value: input.email },
          { label: 'Event type', value: input.eventType },
          { label: 'Event date', value: input.eventDate },
          { label: 'Audience size', value: input.audienceSize },
          { label: 'Format', value: input.format },
          { label: 'Location', value: input.location },
          { label: 'Message', value: input.message },
        ]),
      })
    } catch (error) {
      this.logger.error('Failed to send speaking inquiry email', error)
      throw new BadRequestException('Failed to send inquiry email')
    }

    return { ok: true }
  }

  async submitAppointment(input: AppointmentInquiryInput) {
    const admin = await this.adminInbox()
    const subject = `Appointment request from ${input.fullName}`

    try {
      await this.mail.sendMail({
        to: admin.email,
        subject,
        preheader: `${input.fullName} requested an appointment for ${input.date}`,
        introHtml: `<p style="margin:0;">A new appointment request was submitted on the About page and delivered to your My Profile contact email (<strong>${escapeHtml(admin.email)}</strong>).</p>`,
        html: buildEmailDetailsTable([
          { label: 'Full name', value: input.fullName },
          { label: 'Email', value: input.email },
          { label: 'Phone', value: input.phone },
          { label: 'Preferred date', value: input.date },
          { label: 'Preferred time', value: input.preferredTime },
          { label: 'Message', value: input.message || '—' },
        ]),
      })
    } catch (error) {
      this.logger.error('Failed to send appointment request email', error)
      throw new BadRequestException('Failed to send appointment request email')
    }

    return { ok: true }
  }
}
