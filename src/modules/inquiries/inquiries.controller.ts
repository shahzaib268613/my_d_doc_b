import { Body, Controller, Post } from '@nestjs/common'
import {
  appointmentInquirySchema,
  partnershipInquirySchema,
  speakingInquirySchema,
  type AppointmentInquiryInput,
  type PartnershipInquiryInput,
  type SpeakingInquiryInput,
} from './inquiries.dto.js'
import { InquiriesService } from './inquiries.service.js'

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Post('partnership')
  partnership(
    @Body({ schema: partnershipInquirySchema }) body: PartnershipInquiryInput,
  ) {
    return this.inquiries.submitPartnership(body)
  }

  @Post('speaking')
  speaking(@Body({ schema: speakingInquirySchema }) body: SpeakingInquiryInput) {
    return this.inquiries.submitSpeaking(body)
  }

  @Post('appointment')
  appointment(
    @Body({ schema: appointmentInquirySchema }) body: AppointmentInquiryInput,
  ) {
    return this.inquiries.submitAppointment(body)
  }
}
