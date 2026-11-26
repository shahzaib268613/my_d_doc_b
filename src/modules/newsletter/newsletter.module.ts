import { Module } from '@nestjs/common'
import { NotificationsModule } from '../notifications/notifications.module.js'
import { MailService } from './mail.service.js'
import { NewsletterAdminController } from './newsletter-admin.controller.js'
import { NewsletterPublicController } from './newsletter-public.controller.js'
import { NewsletterRepository } from './newsletter.repository.js'
import { NewsletterService } from './newsletter.service.js'

@Module({
  imports: [NotificationsModule],
  controllers: [NewsletterAdminController, NewsletterPublicController],
  providers: [NewsletterRepository, NewsletterService, MailService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
