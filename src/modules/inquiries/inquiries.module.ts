import { Module } from '@nestjs/common'
import { MailService } from '../newsletter/mail.service.js'
import { ProfileModule } from '../profile/profile.module.js'
import { InquiriesController } from './inquiries.controller.js'
import { InquiriesService } from './inquiries.service.js'

@Module({
  imports: [ProfileModule],
  controllers: [InquiriesController],
  providers: [InquiriesService, MailService],
})
export class InquiriesModule {}
