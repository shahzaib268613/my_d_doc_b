import { Module } from '@nestjs/common'
import { MailService } from './mail.service.js'
import { NewsletterAdminController } from './newsletter-admin.controller.js'
import { NewsletterPublicController } from './newsletter-public.controller.js'
import { NewsletterRepository } from './newsletter.repository.js'
import { NewsletterService } from './newsletter.service.js'

@Module({
  controllers: [NewsletterAdminController, NewsletterPublicController],
  providers: [NewsletterRepository, NewsletterService, MailService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
